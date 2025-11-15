import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Spin,
  Empty,
  Typography,
  Tag,
  Button,
  message,
} from "antd";
import { ShoppingCartOutlined, EyeOutlined } from "@ant-design/icons";
import themeApi, { ThemeCharacter } from "../api/theme";
import productApi, { Product } from "../api/product";
import { getFullImageURL } from "../api/axiosInstance";
import { useCart } from "../components/context/CartContext";
// Header is provided by App globally; remove local Header import
import Footer from "../components/common/Footer";
import "../styles/theme-detail.scss";

const { Title, Paragraph, Text } = Typography;
const { Meta } = Card;

interface ThemeDetail {
  _id: string;
  name: string;
  description?: string;
  banner?: string;
  characters: ThemeCharacter[];
}

export default function ThemeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [theme, setTheme] = useState<ThemeDetail | null>(null);
  const [themeProducts, setThemeProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    if (id) {
      fetchThemeDetail();
      fetchThemeProducts();
    }
  }, [id]);

  const fetchThemeDetail = async () => {
    try {
      setLoading(true);
      const response = await themeApi.getById(id!);
      setTheme(response.data.data);
    } catch (error: any) {
      console.error("Error fetching theme:", error);
      message.error(error.response?.data?.error || "Failed to load theme");
    } finally {
      setLoading(false);
    }
  };

  const fetchThemeProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await productApi.getByTheme(id!);
      setThemeProducts(response.data.data);
    } catch (error: any) {
      console.error("Error fetching theme products:", error);
      message.error(error.response?.data?.message || "Failed to load products");
    } finally {
      setProductsLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    try {
      addToCart({
        id: product._id,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || "",
        quantity: 1,
      });
      message.success(`${product.name} added to cart!`);
    } catch (error) {
      message.error("Failed to add to cart");
    }
  };

  const renderProductCard = (product: Product) => (
    <Col xs={24} sm={12} md={8} lg={6} key={product._id}>
      <Card
        hoverable
        className="product-card"
        cover={
          <Link to={`/product/${product._id}`}>
            <img
              alt={product.name}
              src={
                product.images?.[0]
                  ? getFullImageURL(product.images[0])
                  : "/images/placeholder-product.png"
              }
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/images/placeholder-product.png";
              }}
            />
          </Link>
        }
        actions={[
          <Button
            type="primary"
            icon={<ShoppingCartOutlined />}
            onClick={() => handleAddToCart(product)}
            disabled={product.stock === 0}
            key="add-to-cart"
          >
            {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
          </Button>,
          <Link to={`/product/${product._id}`} key="view">
            <Button icon={<EyeOutlined />}>View</Button>
          </Link>,
        ]}
      >
        <Meta
          title={product.name}
          description={
            <>
              <div className="product-price">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(product.price)}</div>
              {product.pieces && (
                <Text type="secondary">{product.pieces} pieces</Text>
              )}
            </>
          }
        />
        {product.stock !== undefined &&
          product.stock < 10 &&
          product.stock > 0 && (
            <Tag color="orange" style={{ marginTop: 8 }}>
              Only {product.stock} left
            </Tag>
          )}
      </Card>
    </Col>
  );

  if (loading) {
    return (
      <>
        <div className="theme-detail-loading">
          <Spin size="large" tip="Loading theme..." />
        </div>
        <Footer />
      </>
    );
  }

  if (!theme) {
    return (
      <>
        <Empty description="Theme not found" style={{ margin: "80px auto" }} />
        <Footer />
      </>
    );
  }

  return (
    <>
      <div className="theme-detail-page">
        {/* Theme Banner */}
        <div
          className="theme-banner"
          style={{
            backgroundImage: theme.banner
              ? `url(${getFullImageURL(theme.banner)})`
              : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          }}
        >
          <div className="theme-banner-overlay">
            <h1>{theme.name}</h1>
            {theme.description && (
              <p className="theme-description">{theme.description}</p>
            )}
          </div>
        </div>

        <div className="theme-content">
          {/* Theme Description */}
          {/* {theme.description && (
            <div className="theme-description-section">
              <Card>
                <Title level={3}>About {theme.name}</Title>a{" "}
                <Paragraph style={{ fontSize: "16px", lineHeight: 1.8 }}>
                  {theme.description}
                </Paragraph>
              </Card>
            </div>
          )} */}

          {/* Characters Section */}
          {theme.characters && theme.characters.length > 0 && (
            <div className="characters-section">
              <Title level={2}>Characters</Title>
              <Row gutter={[16, 16]} className="characters-grid">
                {theme.characters.map((character) => (
                  <Col xs={12} sm={8} md={6} lg={4} key={character._id}>
                    <Link
                      to={`/characters/${character._id}`}
                      style={{ display: "block" }}
                    >
                      <Card
                        hoverable
                        className="character-card"
                        cover={
                          <img
                            alt={character.name}
                            src={getFullImageURL(character.image)}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/images/placeholder-character.png";
                            }}
                          />
                        }
                      >
                        <Meta
                          title={character.name}
                          description={
                            character.description
                              ? character.description.length > 50
                                ? `${character.description.substring(0, 50)}...`
                                : character.description
                              : ""
                          }
                          // title={character.name}
                          // description={character.description || ""}
                        />
                      </Card>
                    </Link>
                  </Col>
                ))}
              </Row>
            </div>
          )}

          {/* Products Section */}
          <div className="products-section">
            <Title level={2}>Products</Title>
            <div className="products-container">
              {productsLoading ? (
                <div className="products-loading">
                  <Spin size="large" />
                </div>
              ) : themeProducts.length === 0 ? (
                <Empty description="No products found for this theme" />
              ) : (
                <Row gutter={[24, 24]}>
                  {themeProducts.map(renderProductCard)}
                </Row>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
