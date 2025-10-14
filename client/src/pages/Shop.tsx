// 📁 src/pages/Shop.tsx
import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import {
  Card,
  Row,
  Col,
  Spin,
  Empty,
  Button,
  Typography,
  Pagination,
  message,
} from "antd";
import {
  HeartFilled,
  HeartOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import "../styles/shop.scss";
import imagesDefault from "../../../client/public/images/1827380.png";
import { useCart } from "../components/context/CartContext";
import { useFavorites } from "../components/context/FavoritesContext";
import { resolveAssetUrl } from "../utils/assets";

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
  const { favoriteIds, toggleFavorite } = useFavorites();
  const [pendingFavorites, setPendingFavorites] = useState<string[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/products?search=${search}`);
        const rawProducts: Product[] = res.data.products || [];
        const normalizedProducts = rawProducts.map((product) => ({
          ...product,
          images: Array.isArray(product.images)
            ? product.images.map((src) => resolveAssetUrl(src))
            : [],
        }));
        setProducts(normalizedProducts);
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

  const setPending = (id: string, value: boolean) =>
    setPendingFavorites((prev) => {
      if (value) {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      }
      return prev.filter((item) => item !== id);
    });

  const isPending = (id: string) => pendingFavorites.includes(id);

  const handleToggleFavorite = async (
    event: React.MouseEvent<HTMLButtonElement>,
    product: Product
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (isPending(product._id)) return;

    try {
      setPending(product._id, true);
      const added = await toggleFavorite(product._id);
      message.success(
        added
          ? `${product.name} đã được thêm vào danh sách yêu thích`
          : `${product.name} đã được xóa khỏi danh sách yêu thích`
      );
    } catch (error: any) {
      const msg =
        error?.message ||
        "Không thể cập nhật danh sách yêu thích. Vui lòng thử lại.";
      const notify =
        typeof msg === "string" && msg.toLowerCase().includes("đăng nhập")
          ? message.warning
          : message.error;
      notify(msg);
    } finally {
      setPending(product._id, false);
    }
  };

  return (
    <>
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
                      position: "relative",
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
                    <button
                      type="button"
                      onClick={(event) => handleToggleFavorite(event, p)}
                      disabled={isPending(p._id)}
                      style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        border: "1px solid #f0f0f0",
                        background: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                        cursor: isPending(p._id) ? "not-allowed" : "pointer",
                        opacity: isPending(p._id) ? 0.6 : 1,
                        transition: "transform 0.2s ease",
                      }}
                    >
                      {favoriteIds.includes(p._id) ? (
                        <HeartFilled style={{ color: "#f5222d" }} />
                      ) : (
                        <HeartOutlined style={{ color: "#555" }} />
                      )}
                    </button>
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
                          message.success(
                            `${p.name} đã được thêm vào giỏ hàng`
                          );
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
            <div
              style={{
                textAlign: "center",
                marginTop: "30px",
                display: "flex",
                justifyContent: "center",
              }}
            >
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
