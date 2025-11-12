import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Row,
  Col,
  Spin,
  Empty,
  Typography,
  message,
  Breadcrumb,
  Card,
  Button,
  Tag,
} from "antd";
import {
  HomeOutlined,
  ShoppingCartOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import themeApi, { ThemeCharacter } from "../api/theme";
import productApi, { Product } from "../api/product";
import { useCart } from "../components/context/CartContext";
import { getFullImageURL } from "../api/axiosInstance";
// Header rendered globally by App; remove local Header import to avoid duplicate headers
import Footer from "../components/common/Footer";
import "../styles/character-detail.scss";

const { Title, Paragraph, Text } = Typography;
const { Meta } = Card;

export default function CharacterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [character, setCharacter] = useState<ThemeCharacter | null>(null);
  const [themeProducts, setThemeProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    if (id) {
      fetchCharacterDetail();
    }
  }, [id]);

  const fetchCharacterDetail = async () => {
    try {
      setLoading(true);
      const response = await themeApi.getCharacterById(id!);
      const characterData = response.data.data;
      setCharacter(characterData);

      // Only fetch theme products, not character-specific products
      if (characterData) {
        const themeId =
          typeof characterData.themeId === "string"
            ? characterData.themeId
            : (characterData.themeId as any)?._id;
        if (themeId) {
          fetchThemeProducts(themeId);
        }
      }
      setLoading(false);
    } catch (error: any) {
      console.error("Error fetching character:", error);
      message.error(error.response?.data?.error || "Failed to load character");
      setLoading(false);
    }
  };

  const fetchThemeProducts = async (themeId: string) => {
    try {
      setProductsLoading(true);
      const response = await productApi.getByTheme(themeId);
      setThemeProducts(response.data.data);
    } catch (error: any) {
      console.error("Error fetching theme products:", error);
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
              <div className="product-price">${product.price.toFixed(2)}</div>
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
        <div className="character-detail-loading">
          <Spin size="large" tip="Loading character..." />
        </div>
        <Footer />
      </>
    );
  }

  if (!character) {
    return (
      <>
        <Empty
          description="Character not found"
          style={{ margin: "80px auto" }}
        />
        <Footer />
      </>
    );
  }

  return (
    <>
      <div className="character-detail-page">
        {/* Breadcrumb with Back Button */}
        {/* <div className="breadcrumb-section">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => window.history.back()}
            style={{ marginRight: 16 }}
          >
            Back
          </Button>
          <Breadcrumb>
            <Breadcrumb.Item>
              <Link to="/home">
                <HomeOutlined /> Home
              </Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <Link to="/themes">Themes</Link>
            </Breadcrumb.Item>
            {character.themeId && (
              <Breadcrumb.Item>
                <Link
                  to={`/themes/${
                    typeof character.themeId === "string"
                      ? character.themeId
                      : (character.themeId as any)._id
                  }`}
                >
                  {typeof character.themeId === "string"
                    ? "Theme"
                    : (character.themeId as any).name}
                </Link>
              </Breadcrumb.Item>
            )}
            <Breadcrumb.Item>{character.name}</Breadcrumb.Item>
          </Breadcrumb>
        </div> */}

        {/* Character Banner - Similar to Theme Banner */}
        <div
          className="character-banner"
          style={{
            // backgroundImage: character.image
            //   ? `url(${getFullImageURL(character.image)})`
            //   : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            position: "relative",
          }}
        >
          <div className="character-banner-overlay">
            <Row
              gutter={[32, 32]}
              align="middle"
              className="character-banner-content"
            >
              {/* Cột trái - Hình ảnh */}
              <Col xs={24} md={12} className="character-image-col">
                <div className="character-image-wrapper">
                  <img
                    src={
                      character.image
                        ? getFullImageURL(character.image)
                        : "/images/placeholder-character.png"
                    }
                    alt={character.name}
                  />
                </div>
              </Col>

              {/* Cột phải - Thông tin mô tả */}
              <Col xs={24} md={12} className="character-info-col">
                <Title level={1} className="character-name">
                  {character.name}
                </Title>
                {character.description && (
                  <Paragraph className="character-description">
                    {character.description}
                  </Paragraph>
                )}
              </Col>
            </Row>
          </div>
        </div>

        <div className="character-content">
          {/* Theme Products Section */}
          {themeProducts.length > 0 && (
            <div className="products-section">
              <Title level={2}>
                Products from{" "}
                {typeof character.themeId === "string"
                  ? "this theme"
                  : (character.themeId as any)?.name || "this theme"}
              </Title>
              <div className="products-container">
                {productsLoading ? (
                  <div className="products-loading">
                    <Spin size="large" />
                  </div>
                ) : (
                  <Row gutter={[24, 24]}>
                    {themeProducts.map(renderProductCard)}
                  </Row>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
