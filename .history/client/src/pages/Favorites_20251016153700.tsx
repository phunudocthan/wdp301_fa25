import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Spin,
  Empty,
  Button,
  Typography,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  HeartFilled,
  HeartOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import { useFavorites } from "../components/context/FavoritesContext";
import { useCart } from "../components/context/CartContext";
import type { FavoriteProduct } from "../api/favorites";
import imagesDefault from "../../../client/public/images/1827380.png";
import { resolveAssetUrl } from "../utils/assets";
// ArrowLeftRightIcon was unused and removed
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";

const { Title } = Typography;
const { Meta } = Card;

const containerStyle: CSSProperties = {
  padding: "100px 40px 40px",
  minHeight: "calc(100vh - 80px)",
};

const cardStyle: CSSProperties = {
  width: 260,
  position: "relative",
  borderRadius: 12,
  overflow: "hidden",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
};

const favoriteButtonStyle: CSSProperties = {
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
  transition: "transform 0.2s ease",
};

const FavoritesPage = () => {
  const { favorites, favoriteIds, loading, initialized, toggleFavorite } =
    useFavorites();
  const { addToCart } = useCart();
  const [pendingIds, setPendingIds] = useState<string[]>([]);

  const favoriteSet = useMemo(
    () => new Set(favoriteIds),
    [favoriteIds]
  );

  const setPending = (id: string, value: boolean) =>
    setPendingIds((prev) => {
      if (value) {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      }
      return prev.filter((item) => item !== id);
    });

  const isPending = (id: string) => pendingIds.includes(id);

  const handleToggleFavorite = async (product: FavoriteProduct) => {
    if (isPending(product.id)) return;

    try {
      setPending(product.id, true);
      const added = await toggleFavorite(product.id);
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
      setPending(product.id, false);
    }
  };

  const handleAddToCart = (product: FavoriteProduct) => {
    try {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price || 0,
        image: resolveAssetUrl(product.images?.[0]) || imagesDefault,
        quantity: 1,
        stock: (product as any).stock,
      });
      message.success(`${product.name} đã được thêm vào giỏ hàng`);
    } catch (err) {
      console.error("Add to cart error", err);
      message.error("Không thể thêm sản phẩm vào giỏ hàng");
    }
  };

  if (!initialized || loading) {
    return (
      <div
        style={{
          ...containerStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin tip="Đang tải danh sách yêu thích..." size="large" />
      </div>
    );
  }

  const hasFavorites = favorites.length > 0;

  return (
    <>
      <Header />

      <div style={containerStyle}>
        <Button type="link" style={{ marginBottom: 24 }} onClick={() => window.history.back()}>
          <ArrowLeftOutlined />

        </Button>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Title level={2}>Danh sách yêu thích</Title>
          <p style={{ color: "#666", maxWidth: 520, margin: "0 auto" }}>
            Lưu lại các bộ LEGO bạn yêu thích để tiện theo dõi và mua sắm sau.
          </p>
        </div>

        {hasFavorites ? (
          <Row gutter={[24, 24]}>
            {favorites.map((item) => (
              <Col
                key={item.id}
                xs={24}
                sm={12}
                md={8}
                lg={6}
                style={{ display: "flex", justifyContent: "center" }}
              >
                <Card
                  hoverable
                  style={cardStyle}
                  cover={
                    <Link to={`/product/${item.id}`}>
                      <img
                        alt={item.name}
                        src={resolveAssetUrl(item.images?.[0]) || imagesDefault}
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
                      <Link to={`/product/${item.id}`}>
                        <span style={{ color: "#1677ff" }}>{item.name}</span>
                      </Link>
                    }
                    description={
                      <div style={{ marginTop: "8px" }}>
                        <b style={{ fontSize: "16px", color: "#000" }}>
                          ${Number(item.price || 0).toFixed(2)}
                        </b>
                      </div>
                    }
                  />
                  <button
                    type="button"
                    onClick={() => handleToggleFavorite(item)}
                    disabled={isPending(item.id)}
                    style={{
                      ...favoriteButtonStyle,
                      cursor: isPending(item.id) ? "not-allowed" : "pointer",
                      opacity: isPending(item.id) ? 0.6 : 1,
                    }}
                  >
                    {favoriteSet.has(item.id) ? (
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
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handleAddToCart(item);
                    }}
                  >
                    Thêm vào giỏ
                  </Button>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "50vh",
            }}
          >
            <Empty description="Bạn chưa có sản phẩm yêu thích nào." />
          </div>
        )}
      </div>      <Footer />

    </>
  );
};

export default FavoritesPage;
