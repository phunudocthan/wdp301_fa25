import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Tabs, Card, Button, Row, Col, Spin, Tag, Empty, Typography, Pagination, message } from "antd";
import axiosInstance, { getFullImageURL } from "../api/axiosInstance";
import Header from "../components/common/Header";
import HeroSlider from "../components/HeroSlider/HeroSlider";
import "../styles/home.scss";

const { Meta } = Card;
const { Title } = Typography;

interface Product {
  _id: string;
  name: string;
  price: number;
  status: string;
  images?: string[];
}

interface Category {
  _id: string;
  name: string;
}

export default function Home() {
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const search = params.get("search") || "";

  // 🆕 Fetch New Products
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

  // 🔥 Fetch Best Sellers
  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        const res = await axiosInstance.get("/products/best-sell");
        const products = extractArray(res.data);
        setBestSellers(products);
      } catch (err) {
        console.error("❌ Error fetching best sellers:", err);
      }
    };
    fetchBestSellers();
  }, []);

  // 🧩 Fetch All Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axiosInstance.get(`/categories`);
        const cats = extractArray(res.data);
        setCategories(cats);
      } catch (err) {
        console.error("❌ Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // 🔍 Fetch products by category
  const fetchProductByCategory = async (categoryId: string | null) => {
    try {
      setLoading(true);
      setSelectedCategory(categoryId);
      setCurrentPage(1);

      if (!categoryId) {
        // 🟢 Load all products when clicking "All"
        const res = await axiosInstance.get("/products");
        const products =  res.data?.data?.products
        setFilteredProducts(products);
        return;
      }

      const res = await axiosInstance.get(`/products/caterory_list/${categoryId}`);
      const products = res.data?.data
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

  // ✅ Helper: always extract array safely
  const extractArray = (data: any): any[] => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.products)) return data.products;
    return [];
  };
  useEffect(() => {
    fetchProductByCategory(null);
  }, []);
  // 🔹 Pagination
  const safeProducts = Array.isArray(filteredProducts) ? filteredProducts : [];
  const paginatedProducts = safeProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="homepage">
      <Header />
      <HeroSlider />

      {/* 🧭 CATEGORY FILTER SECTION */}
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
          {/* ✅ Button ALL */}
          <Button
            key="all"
            type={!selectedCategory ? "primary" : "default"}
            onClick={() => fetchProductByCategory(null)}
            style={{
              borderRadius: 10,
              padding: "10px 16px",
              flexShrink: 0, width: 140,
              height: 180,
              fontWeight: 500,
            }}
          >
            All
          </Button>

          {/* Render categories */}
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
                color: "#fff",
                // Set background image using inline style
                backgroundImage: `url(${getFullImageURL(c.image)})`, // Use the proper CSS syntax for background-image
                backgroundSize: 'cover',  // Optional, to cover the button area with the image
                backgroundPosition: 'center', // Optional, to center the image within the button
                fontWeight: 500,
              }}
            >
              {c.name}
            </Button>
          ))}

        </div>
      </section>

      {/* 🛍️ PRODUCT GRID */}
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
    </div>
  );
}

// 💡 Product display component
function ProductGrid({
  loading,
  products,
}: {
  loading: boolean;
  products: Product[];
}) {
  if (loading) {
    return (
      <div className="loading-center">
        <Spin size="large" tip="Loading products..." />
      </div>
    );
  }

  if (!products.length) {
    return <Empty description="No products available." />;
  }

  return (
    <Row gutter={[24, 24]}>
      {products.map((p) => (
        <Col xs={24} sm={12} md={8} lg={6} key={p._id}>
          <Card
            hoverable
            cover={
              <img
                alt={p.name}
                src={getFullImageURL(p.images?.[0])}

                style={{ height: 220, objectFit: "cover" }}
              />
            }
            actions={[<Button type="primary" block>Add to cart</Button>]}
          >
            <Meta
              title={
                <Link to={`/product/${p._id}`} style={{ color: "#1677ff" }}>
                  {p.name}
                </Link>
              }
              description={
                <>
                  <p style={{ marginBottom: 6, fontWeight: 500 }}>
                    ${p.price.toFixed(2)}
                  </p>
                  <Tag
                    color={p.status === "active" ? "green" : "orange"}
                    style={{ marginTop: 4 }}
                  >
                    {p.status.toUpperCase()}
                  </Tag>
                </>
              }
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
}
