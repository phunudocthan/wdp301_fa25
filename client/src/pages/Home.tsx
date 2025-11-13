import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Tabs,
  Card,
  Button,
  Row,
  Col,
  Spin,
  Tag,
  Empty,
  Typography,
  Pagination,
  message,
  Popover,
  ConfigProvider,
  Switch,
} from "antd";
import axiosInstance, { getFullImageURL } from "../api/axiosInstance";
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
import { addRecentlyViewed, getRecentlyViewed } from "../api/recentlyViewed";
import { storage } from "../lib/storage";

const { Meta } = Card;
const { Title } = Typography;

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/* Helper: normalise API responses                                    */
/* ------------------------------------------------------------------ */
const normalizeProductResponse = (
  payload: any,
  dataKey: "data" | "products" = "products"
): { products: any[] } => {
  if (!payload) return { products: [] };
  if (Array.isArray(payload)) return { products: payload };
  if (Array.isArray(payload.products)) return { products: payload.products };
  if (payload.data) {
    if (Array.isArray(payload.data)) return { products: payload.data };
    if (Array.isArray(payload.data.products))
      return { products: payload.data.products };
    if (Array.isArray(payload.data[dataKey]))
      return { products: payload.data[dataKey] };
  }
  return { products: [] };
};

/* ------------------------------------------------------------------ */
/* Main component                                                     */
/* ------------------------------------------------------------------ */
export default function Home() {
  /* -------------------------- Theme -------------------------- */
  const [isDarkMode, setIsDarkMode] = useState<boolean>(
    localStorage.getItem("theme") === "dark"
  );

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newTheme = !prev;
      localStorage.setItem("theme", newTheme ? "dark" : "light");
      document.body.setAttribute("data-theme", newTheme ? "dark" : "light");
      return newTheme;
    });
  };

  useEffect(() => {
    document.body.setAttribute("data-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  /* ----------------------- Recently Viewed ------------------- */
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);

  // Save a product id to localStorage (and to backend when logged-in)
  const saveRecentlyViewed = (productId: string) => {
    const key = "recentlyViewedIds";
    let viewed: string[] = JSON.parse(localStorage.getItem(key) ?? "[]");
    viewed = viewed.filter((id) => id !== productId);
    viewed.unshift(productId);
    if (viewed.length > 10) viewed = viewed.slice(0, 10);
    localStorage.setItem(key, JSON.stringify(viewed));

    if (storage.getToken()) {
      void addRecentlyViewed(productId).catch((e) =>
        console.warn("[recentlyViewed] failed to record view:", e)
      );
    }
  };

  // ONE SINGLE effect that loads recently-viewed products
  useEffect(() => {
    let didCancel = false;
    const controller = new AbortController();

    const load = async () => {
      setRecentLoading(true);
      try {
        const ids: string[] =
          typeof window !== "undefined"
            ? JSON.parse(localStorage.getItem("recentlyViewedIds") ?? "[]")
            : [];

        if (!Array.isArray(ids) || ids.length === 0) {
          if (!didCancel) setRecentlyViewed([]);
          return;
        }

        const res = await axiosInstance.get(
          "/products/recentlyViewedIds/view/recent",
          {
            params: { ids: ids.slice(0, 8).join(",") },
            signal: controller.signal as any,
          }
        );

        const payload = res?.data;
        const products = normalizeProductResponse(payload).products;

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

    load();
    return () => {
      didCancel = true;
      controller.abort();
    };
  }, []);

  /* -------------------------- Other data -------------------------- */
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
  const search = params.get("search") ?? "";
  const { addToCart } = useCart();

  /* -------------------------- Vouchers -------------------------- */
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

  /* -------------------------- New Products -------------------------- */
  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const base = search
          ? `/products?search=${encodeURIComponent(search)}`
          : "/products?sortBy=newest";
        const url = base.includes("?") ? `${base}&limit=0` : `${base}?limit=0`;
        const res = await axiosInstance.get(url);
        const { products } = normalizeProductResponse(res.data);
        setNewProducts(products);
        setFilteredProducts(products);
      } catch (e) {
        console.error("Error fetching new products:", e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [search]);

  /* -------------------------- Best Sellers -------------------------- */
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axiosInstance.get("/products/best-sell");
        const { products } = normalizeProductResponse(res.data);
        setBestSellers(products);
      } catch (e) {
        console.error("Error fetching best sellers:", e);
        message.error("Failed to load best sellers.");
      }
    };
    fetch();
  }, []);

  /* -------------------------- Categories -------------------------- */
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axiosInstance.get("/categories");
        const { products: cats } = normalizeProductResponse(res.data, "data");
        setCategories(cats);
      } catch (e) {
        console.error("Error fetching categories:", e);
        message.error("Failed to load categories.");
      }
    };
    fetch();
  }, []);

  /* -------------------------- Category filter -------------------------- */
  const fetchProductByCategory = async (categoryId: string | null) => {
    try {
      setLoading(true);
      setSelectedCategory(categoryId);
      setCurrentPage(1);

      if (!categoryId) {
        const res = await axiosInstance.get("/products?limit=0");
        const { products } = normalizeProductResponse(res.data);
        setFilteredProducts(products);
        return;
      }

      const res = await axiosInstance.get(
        `/products/category_list/${categoryId}`
      );
      const { products } = normalizeProductResponse(res.data);
      setFilteredProducts(products);
      if (products.length === 0) {
        message.info("No products found in this category.");
      }
    } catch (err: any) {
      console.error("Error fetching products by category:", err);
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

  // Load all products on first mount
  useEffect(() => {
    fetchProductByCategory(null);
  }, []);

  /* -------------------------- Pagination -------------------------- */
  const safeProducts = Array.isArray(filteredProducts) ? filteredProducts : [];
  const paginatedProducts = safeProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  /* ------------------------------------------------------------------ */
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
  <div className={`homepage ${isDarkMode ? "dark" : "light"}`}>
        {/* Theme switch */}
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

        {/* ------------------- Recently Viewed ------------------- */}
        <section style={{ padding: "24px 80px", margin: "16px 0" }}>
          <Title level={3} style={{ textAlign: "left", marginBottom: 18, color: "#1677ff" }}>
            Recently Viewed
          </Title>

          {recentLoading ? (
            <div style={{ textAlign: "center", padding: "30px" }}>
              <Spin size="large" />
            </div>
          ) : recentlyViewed.length === 0 ? (
            <Empty description="Bạn chưa xem sản phẩm nào gần đây." />
          ) : (
            <Row gutter={[24, 24]}>
              {recentlyViewed.map((p) => (
                <Col
                  key={p._id}
                  xs={24}
                  sm={12}
                  md={8}
                  lg={6}
                  style={{ display: "flex", justifyContent: "center" }}
                >
                  <Popover
                    trigger="hover"
                    placement="right"
                    content={
                      <div style={{ width: 300, padding: 10 }}>
                        <img
                          src={getFullImageURL(p.images?.[0])}
                          alt={p.name}
                          style={{
                            width: "100%",
                            height: 160,
                            objectFit: "cover",
                            borderRadius: 10,
                            marginBottom: 10,
                          }}
                        />
                        <h3 style={{ marginBottom: 6, fontWeight: 600, fontSize: 16 }}>
                          {p.name}
                        </h3>
                        <p
                          style={{
                            fontSize: 16,
                            fontWeight: "bold",
                            color: "#1677ff",
                            marginBottom: 6,
                          }}
                        >
                          ${p.price.toFixed(2)}
                        </p>
                        <p
                          style={{
                            fontSize: 13,
                            color: p.stock ? (p.stock > 0 ? "#28a745" : "#dc3545") : "#dc3545",
                            marginBottom: 10,
                          }}
                        >
                          {p.stock
                            ? p.stock > 0
                              ? `In stock: ${p.stock}`
                              : "Out of stock"
                            : "Out of stock"}
                        </p>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "6px 10px",
                            marginBottom: 12,
                            fontSize: 12,
                          }}
                        >
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
                          {p.description?.slice(0, 80) ||
                            "A creative LEGO set to spark imagination."}
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
                          borderRadius: 12,
                          overflow: "hidden",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                          transition: "transform .25s ease, box-shadow .25s ease",
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
                          title={<span style={{ color: "#1677ff" }}>{p.name}</span>}
                          description={
                            <div style={{ marginTop: 8 }}>
                              <b style={{ fontSize: 16 }}>${p.price.toFixed(2)}</b>
                            </div>
                          }
                        />
                        <Button
                          type="primary"
                          icon={<ShoppingCartOutlined />}
                          block
                          style={{ marginTop: 12, borderRadius: 8 }}
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
                          Add to cart
                        </Button>
                      </Card>
                    </Link>
                  </Popover>
                </Col>
              ))}
            </Row>
          )}
        </section>

        {/* ------------------- Vouchers ------------------- */}
        <section style={{ padding: "24px 80px", margin: "32px 0" }}>
          <Title level={2} style={{ textAlign: "center", marginBottom: 24, color: "#d97706" }}>
            Khuyến mãi & Voucher
          </Title>

          {voucherLoading ? (
            <div style={{ textAlign: "center" }}>
              <Spin />
            </div>
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
                      style={{
                        borderColor: "#f59e42",
                        borderRadius: 10,
                        boxShadow: "0 2px 8px #f59e4280",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: 18, color: "#d97706" }}>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: 6,
                              fontSize: 20,
                            }}
                          >
                            {v.code}
                          </span>
                        </div>
                        <Tag color={statusColor} style={{ fontWeight: 500, fontSize: 14 }}>
                          {status}
                        </Tag>
                      </div>

                      <div style={{ margin: "8px 0", fontSize: 16 }}>
                        Giảm{" "}
                        <span style={{ color: "#16a34a", fontWeight: 600 }}>
                          {v.discountPercent}%
                        </span>
                      </div>

                      <div style={{ fontSize: 14, color: "#555" }}>
                        HSD: {new Date(v.expiryDate).toLocaleDateString()}
                      </div>

                      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <Button
                          type="primary"
                          style={{
                            background: "#f59e42",
                            border: "none",
                            borderRadius: 6,
                            fontWeight: 500,
                          }}
                          onClick={() => {
                            navigator.clipboard.writeText(v.code);
                            message.success(`Đã copy mã ${v.code}!`);
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

        {/* ------------------- Category filter ------------------- */}
        <section style={{ padding: "40px 80px" }}>
          <Title level={2} style={{ textAlign: "center", marginBottom: 24 }}>
            Product Categories
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
                  color: "#fff",
                }}
              >
                {c.name}
              </Button>
            ))}
          </div>
        </section>

        {/* ------------------- Product Grid (Tabs) ------------------- */}
        <section style={{ padding: "20px 80px" }}>
          <Tabs
            defaultActiveKey="1"
            centered
            size="large"
            items={[
              {
                key: "1",
                label: "New Product List",
                children: (
                  <>
                    <ProductGrid
                      loading={loading}
                      products={paginatedProducts}
                      addToCart={addToCart}
                      saveRecentlyViewed={saveRecentlyViewed}
                    />
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
                label: "Best Sellers",
                children: (
                  <ProductGrid
                    loading={loading}
                    products={bestSellers}
                    addToCart={addToCart}
                    saveRecentlyViewed={saveRecentlyViewed}
                  />
                ),
              },
            ]}
          />
        </section>

        <Footer />
      </div>
    </ConfigProvider>
  );
}

/* ------------------------------------------------------------------ */
/* ProductGrid component (re-used by both tabs)                       */
/* ------------------------------------------------------------------ */
function ProductGrid({
  loading,
  products,
  addToCart,
  saveRecentlyViewed,
}: {
  loading: boolean;
  products: Product[];
  addToCart: any;
  saveRecentlyViewed: (id: string) => void;
}) {
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
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
        <Col
          key={p._id}
          xs={24}
          sm={12}
          md={8}
          lg={6}
          style={{ display: "flex", justifyContent: "center" }}
        >
          <Popover
            trigger="hover"
            placement="right"
            content={
              <div style={{ width: 300, padding: 10 }}>
                <img
                  src={getFullImageURL(p.images?.[0])}
                  alt={p.name}
                  style={{
                    width: "100%",
                    height: 160,
                    objectFit: "cover",
                    borderRadius: 10,
                    marginBottom: 10,
                  }}
                />
                <h3 style={{ marginBottom: 6, fontWeight: 600, fontSize: 16 }}>
                  {p.name}
                </h3>
                <p
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: "#1677ff",
                    marginBottom: 6,
                  }}
                >
                  ${p.price.toFixed(2)}
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: p.stock ? (p.stock > 0 ? "#28a745" : "#dc3545") : "#dc3545",
                    marginBottom: 10,
                  }}
                >
                  {p.stock
                    ? p.stock > 0
                      ? `In stock: ${p.stock}`
                      : "Out of stock"
                    : "Out of stock"}
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "6px 10px",
                    marginBottom: 12,
                    fontSize: 12,
                  }}
                >
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
                  {p.description?.slice(0, 80) ||
                    "A creative LEGO set to spark imagination."}
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
                  borderRadius: 12,
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  transition: "transform .25s ease, box-shadow .25s ease",
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
                  title={<span style={{ color: "#1677ff" }}>{p.name}</span>}
                  description={
                    <div style={{ marginTop: 8 }}>
                      <b style={{ fontSize: 16 }}>${p.price.toFixed(2)}</b>
                    </div>
                  }
                />
                <Button
                  type="primary"
                  icon={<ShoppingCartOutlined />}
                  block
                  style={{ marginTop: 12, borderRadius: 8 }}
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
