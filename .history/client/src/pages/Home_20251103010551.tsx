import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Tabs, Card, Button, Row, Col, Spin, Tag, Empty, Typography, Pagination, message, Popover, ConfigProvider, Switch } from "antd";
import axiosInstance, { getFullImageURL } from "../api/axiosInstance";
import Header from "../components/common/Header";
import HeroSlider from "../components/HeroSlider/HeroSlider";
import HighlightNews from "../components/News/HighlightNews";
import TrendingNews from "../components/News/TrendingNews";
import "../styles/home.scss";
import { useCart } from "../components/context/CartContext";
import { ShoppingCartOutlined } from "@ant-design/icons";
import imagesDefault from "../../../client/public/images/1827380.png";
import { Box, Layers, Palette, Settings, User } from "lucide-react";
import Footer from "../components/common/Footer";
import { theme as antdTheme } from "antd";

const { Meta } = Card;
const { Title } = Typography;

interface Product {
  _id: string;
  name: string;
  price: number;
  status: string;
  images?: string[];
  stock?: number;
  themeId?: { name: string };
  ageRangeId?: { rangeLabel: string };
  difficultyId?: { label: string };
  pieces?: number;
  description?: string;
}

interface Category {
  _id: string;
  name: string;
  image?: string;
}

export default function Home() {
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(
    localStorage.getItem("theme") === "dark"
  );

  // Toggle theme and persist to localStorage
  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newTheme = !prev;
      localStorage.setItem("theme", newTheme ? "dark" : "light");
      document.body.setAttribute("data-theme", newTheme ? "dark" : "light");
      return newTheme;
    });
  };

  // Apply initial theme attribute
  useEffect(() => {
    document.body.setAttribute("data-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  // Recently Viewed state
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);

  // Other states
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const pageSize = 8;

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const search = params.get("search") || "";

  // Fetch recently viewed products
 // 🔁 replace your "Fetch recently viewed products" useEffect
useEffect(() => {
  let didCancel = false;
  const controller = new AbortController();

  const run = async () => {
    setRecentLoading(true);
    try {
      const ids: string[] = typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("recentlyViewedIds") || "[]")
        : [];

      if (!Array.isArray(ids) || ids.length === 0) {
        if (!didCancel) setRecentlyViewed([]);
        return;
      }

      const res = await axiosInstance.get("/products/recentlyViewedIds/view/recent", {
        params: { ids: ids.slice(0, 8).join(",") },
        signal: controller.signal as any, // axios supports AbortController in recent versions
      });

      const payload = res?.data;
      const products =
        Array.isArray(payload?.products)
          ? payload.products
          : Array.isArray(payload?.data?.products)
          ? payload.data.products
          : Array.isArray(payload?.data)
          ? payload.data
          : [];

      if (!didCancel) setRecentlyViewed(products);
    } catch (err: any) {
      if (!didCancel) {
        message.error("Failed to load recently viewed products.");
        setRecentlyViewed([]);
      }
    } finally {
      if (!didCancel) setRecentLoading(false);
    }
  };

  run();
  return () => {
    didCancel = true;
    controller.abort();
  };
}, []);

  // Fetch active vouchers
  useEffect(() => {
    setVoucherLoading(true);
    axiosInstance
      .get("/vouchers/active")
      .then((res) => {
        const arr = Array.isArray(res.data?.data) ? res.data.data : [];
        setVouchers(arr);
      })
      .catch(() => {
        setVouchers([]);
        message.error("Failed to load vouchers.");
      })
      .finally(() => setVoucherLoading(false));
  }, []);

  // Fetch New Products
  useEffect(() => {
    const fetchNewProducts = async () => {
      try {
        setLoading(true);
        const url = search
          ? `/products?search=${encodeURIComponent(search)}`
          : "/products?sortBy=newest";
        const res = await axiosInstance.get(url);
        const products = extractArray(res.data);
        setNewProducts(products);
        setFilteredProducts(products);
      } catch (err) {
        console.error("❌ Error fetching new products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNewProducts();
  }, [search]);

  // Fetch Best Sellers
  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        const res = await axiosInstance.get("/products/best-sell");
        const products = extractArray(res.data);
        setBestSellers(products);
      } catch (err) {
        console.error("❌ Error fetching best sellers:", err);
        message.error("Failed to load best sellers.");
      }
    };
    fetchBestSellers();
  }, []);

  // Fetch All Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axiosInstance.get(`/categories`);
        const cats = extractArray(res.data);
        setCategories(cats);
      } catch (err) {
        console.error("❌ Error fetching categories:", err);
        message.error("Failed to load categories.");
      }
    };
    fetchCategories();
  }, []);

  // Fetch products by category
  const fetchProductByCategory = async (categoryId: string | null) => {
    try {
      setLoading(true);
      setSelectedCategory(categoryId);
      setCurrentPage(1);
      if (!categoryId) {
        const res = await axiosInstance.get("/products");
        const products = res.data?.data?.products || [];
        setFilteredProducts(products);
        return;
      }
      const res = await axiosInstance.get(`/products/caterory_list/${categoryId}`);
      const products = res.data?.data || [];
      setFilteredProducts(products);
      if (products.length === 0) {
        message.info("No products found in this category.");
      }
    } catch (err: any) {
      console.error("❌ Error fetching products by category:", err);
      if (err.response?.status === 404 && err.response?.data?.message) {
        message.info("No products found in this category.");
        setFilteredProducts([]);
        return;
      }
      message.error("Failed to load products. Please try again!");
    } finally {
      setLoading(false);
    }
  };

  // Helper: Extract array safely
  const extractArray = (data: any): any[] => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.products)) return data.products;
    return [];
  };

  useEffect(() => {
    fetchProductByCategory(null);
  }, []);

  // Pagination
  const safeProducts = Array.isArray(filteredProducts) ? filteredProducts : [];
  const paginatedProducts = safeProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: isDarkMode ? "#40c4ff" : "#ff7a00",
          borderRadius: 8,
          colorBgContainer: isDarkMode ? "#2c2c2c" : "var(--bg)",
        },
      }}
    >
  <div style={{ backgroundColor: isDarkMode ? "#141414" : "var(--bg)" }}>
        {/* Theme Toggle Switch */}
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 1000 }}>
          <Switch
            checked={isDarkMode}
            onChange={toggleTheme}
            checkedChildren="Dark"
            unCheckedChildren="Light"
          />
        </div>
  <HeroSlider />
  <HighlightNews limit={4} />
  <TrendingNews limit={5} />

        {/* Recently Viewed Section */}
        <section style={{ padding: "24px 80px", margin: "16px 0" }}>
          <Title level={3} style={{ textAlign: "left", marginBottom: 18, color: "var(--primary)" }}>
            🕒 Sản phẩm đã xem gần đây
          </Title>
          {recentLoading ? (
            <Spin />
          ) : recentlyViewed.length === 0 ? (
            <Empty description="Bạn chưa xem sản phẩm nào gần đây." />
          ) : (
            <Row gutter={[24, 24]}>
              {recentlyViewed.map((p) => (
                <Col key={p._id} xs={12} sm={8} md={6} lg={4}>
                  <Card
                    hoverable
                    cover={
                      <img
                        alt={p.name}
                        src={getFullImageURL(p.images?.[0])}
                        style={{ height: 120, objectFit: "cover" }}
                      />
                    }
                    style={{ borderRadius: 10, marginBottom: 8 }}
                  >
                    <Meta
                      title={<span style={{ fontWeight: 500 }}>{p.name}</span>}
                      description={<span style={{ color: "var(--primary)" }}>${p.price?.toFixed(2)}</span>}
                    />
                    <Button type="link" href={`/product/${p._id}`} style={{ marginTop: 8 }}>
                      Xem chi tiết
                    </Button>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </section>

        {/* Voucher Section */}
        <section style={{ padding: "24px 80px", borderRadius: 12, margin: "32px 0" }}>
          <Title level={2} style={{ textAlign: "center", marginBottom: 24, color: "#d97706" }}>
            🎁 Khuyến mãi & Voucher
          </Title>
          {voucherLoading ? (
            <Spin />
          ) : vouchers.length === 0 ? (
            <Empty description="Không có voucher nào đang hoạt động." />
          ) : (
            <Row gutter={[24, 24]} justify="center">
              {vouchers.map((v) => {
                const now = Date.now();
                const expiry = new Date(v.expiryDate).getTime();
                const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
                let status = "Còn hạn";
                let statusColor = "green";
                if (daysLeft <= 3 && daysLeft > 0) {
                  status = `Sắp hết hạn (${daysLeft} ngày)`;
                  statusColor = "orange";
                } else if (daysLeft <= 0) {
                  status = "Hết hạn";
                  statusColor = "red";
                }
                return (
                  <Col key={v._id} xs={24} sm={12} md={8} lg={6}>
                    <Card
                      bordered
                      style={{ borderColor: "#f59e42", borderRadius: 10, boxShadow: "0 2px 8px #f59e4280" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ fontWeight: 700, fontSize: 18, color: "#d97706" }}>
                          <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 20 }}>
                            {v.code}
                          </span>
                        </div>
                        <Tag color={statusColor} style={{ fontWeight: 500, fontSize: 14 }}>
                          {status}
                        </Tag>
                      </div>
                      <div style={{ margin: "8px 0", fontSize: 16 }}>
                        Giảm <span style={{ color: "#16a34a", fontWeight: 600 }}>{v.discountPercent}%</span>
                      </div>
                      <div style={{ fontSize: 14, color: "#555" }}>
                        HSD: {new Date(v.expiryDate).toLocaleDateString()}
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <Button
                          type="primary"
                          style={{ background: "#f59e42", border: "none", borderRadius: 6, fontWeight: 500 }}
                          onClick={() => {
                            navigator.clipboard.writeText(v.code);
                            message.success({
                              content: `Đã copy mã ${v.code}!`,
                              icon: <span style={{ color: "#16a34a", fontWeight: 700 }}>✔️</span>,
                            });
                          }}
                        >
                          Sao chép mã
                        </Button>
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}
        </section>

        {/* Category Filter Section */}
        <section style={{ padding: "40px 80px" }}>
          <Title level={2} style={{ textAlign: "center", marginBottom: 24 }}>
            🧩 Product Categories
          </Title>
          <div
            style={{
              display: "flex",
              overflowX: "auto",
              gap: 12,
              paddingBottom: 8,
              scrollbarWidth: "thin",
            }}
          >
            <Button
              key="all"
              type={!selectedCategory ? "primary" : "default"}
              onClick={() => fetchProductByCategory(null)}
              style={{
                borderRadius: 10,
                padding: "10px 16px",
                flexShrink: 0,
                width: 140,
                height: 180,
                fontWeight: 500,
              }}
            >
              All
            </Button>
            {categories.map((c) => (
              <Button
                key={c._id}
                type={selectedCategory === c._id ? "primary" : "default"}
                onClick={() => fetchProductByCategory(c._id)}
                style={{
                  borderRadius: 10,
                  padding: "10px 16px",
                  flexShrink: 0,
                  width: 140,
                  height: 180,
                  backgroundImage: `url(${getFullImageURL(c.image)})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  fontWeight: 500,
                }}
              >
                {c.name}
              </Button>
            ))}
          </div>
        </section>

        {/* Product Grid */}
        <section className="perfect-set" style={{ padding: "20px 80px" }}>
          <Tabs
            defaultActiveKey="1"
            centered
            size="large"
            items={[
              {
                key: "1",
                label: "🆕 Product List",
                children: (
                  <>
                    <ProductGrid loading={loading} products={paginatedProducts} />
                    {safeProducts.length > pageSize && (
                      <div style={{ textAlign: "center", marginTop: 30 }}>
                        <Pagination
                          current={currentPage}
                          pageSize={pageSize}
                          total={safeProducts.length}
                          onChange={(page) => setCurrentPage(page)}
                        />
                      </div>
                    )}
                  </>
                ),
              },
              {
                key: "2",
                label: "🔥 Best Sellers",
                children: <ProductGrid loading={loading} products={bestSellers} />,
              },
            ]}
          />
        </section>
        <Footer />
      </div>
    </ConfigProvider>
  );
}

function ProductGrid({ loading, products }: { loading: boolean; products: Product[] }) {
  const { addToCart } = useCart();

  const saveRecentlyViewed = (productId: string) => {
    const key = "recentlyViewedIds";
    let viewed = JSON.parse(localStorage.getItem(key) || "[]");
    viewed = viewed.filter((id: string) => id !== productId);
    viewed.unshift(productId);
    if (viewed.length > 10) viewed = viewed.slice(0, 10);
    localStorage.setItem(key, JSON.stringify(viewed));
  };

  if (loading) {
    return (
      <div className="loading-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!products.length) {
    return <Empty description="No products available." />;
  }

  return (
    <Row gutter={[24, 24]}>
      {products.map((p) => (
        <Col key={p._id} xs={24} sm={12} md={8} lg={6} style={{ display: "flex", justifyContent: "center" }}>
          <Popover
            trigger="hover"
            placement="right"
            content={
              <div style={{ width: 300, padding: 10 }}>
                <img
                  src={getFullImageURL(p.images?.[0])}
                  alt={p.name}
                  style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 10, marginBottom: 10 }}
                />
                <h3 style={{ marginBottom: 6, fontWeight: 600, fontSize: 16 }}>{p.name}</h3>
                <p style={{ fontSize: 16, fontWeight: "bold", color: "var(--primary)", marginBottom: 6 }}>
                  ${p.price.toFixed(2)}
                </p>
                <p style={{ fontSize: 13, color: p.stock ? (p.stock > 0 ? "#28a745" : "#dc3545") : "#dc3545", marginBottom: 10 }}>
                  {p.stock ? (p.stock > 0 ? `In stock: ${p.stock}` : "Out of stock") : "Out of stock"}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 10px", marginBottom: 12, fontSize: 12 }}>
                  {p.themeId && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Palette size={14} />
                      <span>{p.themeId.name}</span>
                    </div>
                  )}
                  {p.ageRangeId && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <User size={14} />
                      <span>{p.ageRangeId.rangeLabel}</span>
                    </div>
                  )}
                  {p.difficultyId && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Settings size={14} />
                      <span>{p.difficultyId.label}</span>
                    </div>
                  )}
                  {p.pieces && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Layers size={14} />
                      <span>{p.pieces} pcs</span>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Box size={14} />
                    <span>{p.stock || 0} left</span>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: "#666", marginBottom: 10 }}>
                  {p.description?.slice(0, 80) || "A creative LEGO set to spark imagination."}
                </p>
                <Button
                  type="primary"
                  size="small"
                  icon={<ShoppingCartOutlined />}
                  block
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addToCart({
                      id: p._id,
                      name: p.name,
                      price: p.price,
                      image: p.images?.[0] || imagesDefault,
                      quantity: 1,
                      stock: p.stock,
                    });
                    message.success(`${p.name} đã được thêm vào giỏ hàng`);
                  }}
                >
                  Add to Bag
                </Button>
              </div>
            }
          >
            <Link to={`/product/${p._id}`} onClick={() => saveRecentlyViewed(p._id)}>
              <Card
                hoverable
                style={{
                  width: 260,
                  position: "relative",
                  borderRadius: 12,
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  transition: "transform 0.25s ease, box-shadow 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.04)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                }}
                cover={
                  <img
                    alt={p.name}
                    src={getFullImageURL(p.images?.[0])}
                    style={{ height: 220, objectFit: "cover", width: "100%" }}
                  />
                }
              >
                <Meta
                  title={<span style={{ color: "var(--primary)" }}>{p.name}</span>}
                  description={
                    <div style={{ marginTop: "8px" }}>
                      <b style={{ fontSize: "16px" }}>${p.price.toFixed(2)}</b>
                    </div>
                  }
                />
                <Button
                  type="primary"
                  icon={<ShoppingCartOutlined />}
                  block
                  style={{ marginTop: "12px", borderRadius: 8 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                      addToCart({
                        id: p._id,
                        name: p.name,
                        price: p.price,
                        image: p.images?.[0] || imagesDefault,
                        quantity: 1,
                        stock: p.stock,
                      });
                      message.success(`${p.name} đã được thêm vào giỏ hàng`);
                    } catch (err) {
                      console.error("Add to cart error", err);
                      message.error("Không thể thêm sản phẩm vào giỏ hàng");
                    }
                  }}
                >
                  Add to cart
                </Button>
              </Card>
            </Link>
          </Popover>
        </Col>
      ))}
    </Row>
  );
}