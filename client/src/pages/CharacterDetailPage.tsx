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
  Breadcrumb,
} from "antd";
import {
  ShoppingCartOutlined,
  EyeOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import themeApi, { ThemeCharacter } from "../api/theme";
import productApi, { Product } from "../api/product";
import { getFullImageURL } from "../api/axiosInstance";
import { useCart } from "../components/context/CartContext";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import "../styles/character-detail.scss";

const { Title, Paragraph, Text } = Typography;
const { Meta } = Card;

export default function CharacterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [character, setCharacter] = useState<ThemeCharacter | null>(null);
  const [characterProducts, setCharacterProducts] = useState<Product[]>([]);
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

      // Fetch products after getting character data
      if (characterData) {
        fetchCharacterProducts();
        // Fetch theme products if character has themeId
        const themeId =
          typeof characterData.themeId === "string"
            ? characterData.themeId
            : (characterData.themeId as any)?._id;
        if (themeId) {
          fetchThemeProducts(themeId);
        }
      }
    } catch (error: any) {
      console.error("Error fetching character:", error);
      message.error(error.response?.data?.error || "Failed to load character");
      setLoading(false);
    }
  };

  const fetchCharacterProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await productApi.getByCharacter(id!);
      setCharacterProducts(response.data.data);
    } catch (error: any) {
      console.error("Error fetching character products:", error);
      message.error(
        error.response?.data?.message || "Failed to load character products"
      );
    } finally {
      setProductsLoading(false);
      setLoading(false);
    }
  };

  const fetchThemeProducts = async (themeId: string) => {
    try {
      const response = await productApi.getByTheme(themeId);
      // Filter out products that are already in characterProducts
      const characterProductIds = characterProducts.map((p) => p._id);
      const filteredThemeProducts = response.data.data.filter(
        (p: Product) => !characterProductIds.includes(p._id)
      );
      setThemeProducts(filteredThemeProducts);
    } catch (error: any) {
      console.error("Error fetching theme products:", error);
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
        <Header />
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
        <Header />
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
      <Header />
      <div className="character-detail-page">
        {/* Breadcrumb */}
        <div className="breadcrumb-section">
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
        </div>

        {/* Character Banner */}
        <div className="character-banner">
          <Row gutter={[32, 32]} align="middle">
            <Col xs={24} md={10}>
              <div className="character-image-wrapper">
                <img
                  alt={character.name}
                  src={getFullImageURL(character.image)}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/images/placeholder-character.png";
                  }}
                />
              </div>
            </Col>
            <Col xs={24} md={14}>
              <div className="character-info">
                <Title level={1}>{character.name}</Title>
                {character.description && (
                  <Paragraph className="character-description">
                    {character.description}
                  </Paragraph>
                )}
              </div>
            </Col>
          </Row>
        </div>

        <div className="character-content">
          {/* Character-specific Products Section */}
          <div className="products-section">
            <Title level={2}>{character.name} Products</Title>
            <div className="products-container">
              {productsLoading ? (
                <div className="products-loading">
                  <Spin size="large" />
                </div>
              ) : characterProducts.length === 0 ? (
                <Empty
                  description={`No character-specific products found for ${character.name}`}
                />
              ) : (
                <Row gutter={[24, 24]}>
                  {characterProducts.map(renderProductCard)}
                </Row>
              )}
            </div>
          </div>

          {/* Theme Products Section */}
          {themeProducts.length > 0 && (
            <div className="products-section">
              <Title level={2}>
                More from{" "}
                {typeof character.themeId === "string"
                  ? "this theme"
                  : (character.themeId as any)?.name || "this theme"}
              </Title>
              <div className="products-container">
                <Row gutter={[24, 24]}>
                  {themeProducts.map(renderProductCard)}
                </Row>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
