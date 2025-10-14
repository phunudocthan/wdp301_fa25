// 📁 src/pages/Shop.tsx
import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import Header from "../components/common/Header";
import { Card, Row, Col, Spin, Empty, Button, Typography, Pagination, message } from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";
import "../styles/shop.scss";
import imagesDefault from "../../../client/public/images/1827380.png";
import { useCart } from "../components/context/CartContext";

const { Title } = Typography;
const { Meta } = Card;

interface Product {
  _id: string;
  name: string;
  price: number;
  status: string;
  images?: string[];
}

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(8); // số sản phẩm mỗi trang
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const search = queryParams.get("search") || "";
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/products?search=${search}`);
        setProducts(res.data.products || []);
      } catch (err) {
        console.error("❌ Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [search]);
  // Tính toán các sản phẩm cho trang hiện tại
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const displayedProducts = products.slice(startIndex, endIndex);
  return (
    <>
      <Header />
      <div className="shop-container" style={{ padding: "20px 50px" }}>
        <Title level={2} style={{ textAlign: "center", marginBottom: "30px" }}>
          List products
        </Title>

        {loading ? (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <Spin size="large" tip="Đang tải sản phẩm..." />
          </div>
        ) : products.length > 0 ? (
          <>
            <Row gutter={[24, 24]}>
              {displayedProducts.map((p) => (
                <Col
                  key={p._id}
                  xs={24}
                  sm={12}
                  md={8}
                  lg={6}
                  style={{ display: "flex", justifyContent: "center" }}
                >
                  <Card
                    hoverable
                    style={{
                      width: 260,
                      borderRadius: 12,
                      overflow: "hidden",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                    cover={
                      <Link to={`/product/${p._id}`}>
                        <img
                          alt={p.name}
                          src={p.images?.[0] || imagesDefault}
                          style={{
                            height: 220,
                            objectFit: "cover",
                            width: "100%",
                          }}
                        />
                      </Link>
                    }
                  >
                    <Meta
                      title={
                        <Link to={`/product/${p._id}`}>
                          <span style={{ color: "#1677ff" }}>{p.name}</span>
                        </Link>
                      }
                      description={
                        <div style={{ marginTop: "8px" }}>
                          <b style={{ fontSize: "16px", color: "#000" }}>
                            ${p.price.toFixed(2)}
                          </b>
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
                          });
                          message.success(`${p.name} đã được thêm vào giỏ hàng`);
                        } catch (err) {
                          console.error("Add to cart error", err);
                          message.error("Không thể thêm sản phẩm vào giỏ hàng");
                        }
                      }}
                    >
                      Add carts
                    </Button>
                  </Card>
                </Col>
              ))}
            </Row>
            <div style={{ textAlign: "center", marginTop: "30px", display: 'flex', justifyContent: 'center' }}>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={products.length}
                onChange={(page) => setCurrentPage(page)}
                showSizeChanger={false}
              />
            </div>
          </>
        ) : (
          <Empty
            description="Not found products."
            style={{ marginTop: "50px" }}
          />
        )}
      </div>
    </>
  );
}
