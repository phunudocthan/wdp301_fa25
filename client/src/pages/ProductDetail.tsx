import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axiosInstance, { getFullImageURL } from "../api/axiosInstance";
import Header from "../components/common/Header";
import {
  Settings,
  User,
  Layers,
  Calendar,
  Box,
  Palette,
  Star,
} from "lucide-react";
import "../styles/productDetail.scss";
import { message } from "antd";
import { useCart } from "../components/context/CartContext";
import { ArrowLeftOutlined, HeartFilled, HeartOutlined } from "@ant-design/icons";
import { useFavorites } from "../components/context/FavoritesContext";
import { resolveAssetUrl } from "../utils/assets";
interface Product {
  _id: string;
  name: string;
  themeId?: { name: string; description: string };
  ageRangeId?: { rangeLabel: string; minAge: number; maxAge: number };
  difficultyId?: { label: string; level: number };
  pieces: number;
  price: number;
  stock: number;
  status: string;
  images?: string[];
  createdBy?: { name: string; email: string };
  description?: string;
  updatedAt?: string;
}

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [showDesc, setShowDesc] = useState(false);
  const { favoriteIds, toggleFavorite } = useFavorites();
  const [favoritePending, setFavoritePending] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axiosInstance.get(`/products/${id}`);
        const normalizedImages = Array.isArray(res.data.images)
          ? res.data.images.map((src: string) => resolveAssetUrl(src))
          : [];
        setProduct({ ...res.data, images: normalizedImages });
        setSelectedImg(normalizedImages[0] || null);
      } catch (error) {
        console.error("❌ Error loading product:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) return <p className="loading">Loading...</p>;
  if (!product) return <p className="notfound">Not found product.</p>;

  const isFavorite = favoriteIds.includes(product._id);

  const handleFavoriteToggle = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    if (favoritePending) return;

    try {
      setFavoritePending(true);
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
      setFavoritePending(false);
    }
  };

  return (
    <>
      <div className="product-detail-page">
        <button
          className="back-btn"
          onClick={() => window.history.back()}
          title="Go back"
          aria-label="Go back"
        >
          <ArrowLeftOutlined />
        </button>
        <div className="product-container">
          {/* === LEFT IMAGE === */}
          <div className="image-section">
            <div className="thumbnail-list">
              {product.images?.map((img, idx) => (
                <img
                  key={idx}
                  src={getFullImageURL(img)}
                  alt={`thumb-${idx}`}
                  className={`thumbnail ${selectedImg === img ? "active" : ""}`}
                  onClick={() => setSelectedImg(img)}
                />
              ))}
            </div>
            <div className="main-image">
              <img
                src={selectedImg || resolveAssetUrl(product.images?.[0]) || "/placeholder.png"}
                alt={product.name}
              />
            </div>
          </div>

          {/* === RIGHT INFO === */}
          <div className="info-section">
            <div className="badge-group">
              <span className="badge new">New</span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <h1 className="title" style={{ marginBottom: 0 }}>
                {product.name}
              </h1>
              <button
                type="button"
                onClick={handleFavoriteToggle}
                disabled={favoritePending}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  border: "1px solid #f0f0f0",
                  background: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                  cursor: favoritePending ? "not-allowed" : "pointer",
                  opacity: favoritePending ? 0.6 : 1,
                  transition: "transform 0.2s ease",
                }}
              >
                {isFavorite ? (
                  <HeartFilled style={{ color: "#f5222d", fontSize: 20 }} />
                ) : (
                  <HeartOutlined style={{ color: "#555", fontSize: 20 }} />
                )}
              </button>
            </div>

            {/* Optional: rating like LEGO.com */}
            <div className="rating">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={18}
                  fill={i < 4 ? "#FFD700" : "none"}
                  stroke="#FFD700"
                />
              ))}
              <span className="review-count">4.0 (7 reviews)</span>
            </div>

            <p className="price">${product.price.toFixed(2)}</p>
            <p className="stock">
              {product.stock > 0 ? "Available now" : "Out of stock"}
            </p>

            {/* Quantity + Add to Bag */}
            <div className="quantity-group">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                −
              </button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>

            <button
              className="add-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                  addToCart({
                    id: product._id,
                    name: product.name,
                    price: product.price,
                    image:
                      selectedImg ||
                      resolveAssetUrl(product.images?.[0]) ||
                      "/placeholder.png",
                    quantity,
                  });
                  message.success(`${product.name} đã được thêm vào giỏ hàng`);
                  // Redirect user to cart page so they can review items
                  navigate("/cart");
                } catch (err) {
                  console.error("Add to cart error", err);
                  message.error("Không thể thêm sản phẩm vào giỏ hàng");
                }
              }}
            >
              Add to Bag
            </button>
            {/* === Product Details beside Add to Bag === */}
            <div className="product-meta inline">
              <div className="meta-grid">
                <div className="meta-item">
                  <Palette size={16} className="icon" />
                  <div>
                    <span className="label">Theme</span>
                    <span className="value">
                      {product.themeId?.name} — {product.themeId?.description}
                    </span>
                  </div>
                </div>

                <div className="meta-item">
                  <User size={16} className="icon" />
                  <div>
                    <span className="label">Age</span>
                    <span className="value">
                      {product.ageRangeId?.rangeLabel} (
                      {product.ageRangeId?.minAge}–{product.ageRangeId?.maxAge}{" "}
                      years)
                    </span>
                  </div>
                </div>

                <div className="meta-item">
                  <Settings size={16} className="icon" />
                  <div>
                    <span className="label">Difficulty</span>
                    <span className="value">
                      {product.difficultyId?.label} (Level{" "}
                      {product.difficultyId?.level})
                    </span>
                  </div>
                </div>

                <div className="meta-item">
                  <Layers size={16} className="icon" />
                  <div>
                    <span className="label">Pieces</span>
                    <span className="value">{product.pieces}</span>
                  </div>
                </div>

                <div className="meta-item">
                  <Box size={16} className="icon" />
                  <div>
                    <span className="label">Stock</span>
                    <span className="value">{product.stock} items</span>
                  </div>
                </div>

                <div className="meta-item">
                  <Calendar size={16} className="icon" />
                  <div>
                    <span className="label">Updated</span>
                    <span className="value">
                      {new Date(product.updatedAt || "").toLocaleDateString(
                        "en-GB"
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* === Expandable Description === */}
            <div className="description-section">
              <div
                className="desc-header"
                onClick={() => setShowDesc(!showDesc)}
              >
                <h3>Product Description</h3>
                <span>{showDesc ? "▲" : "▼"}</span>
              </div>

              <div className={`desc-body ${showDesc ? "open" : "collapsed"}`}>
                <p>
                  {product.description ||
                    "This LEGO set brings creativity and fun to your collection. Build and display your masterpiece!"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
