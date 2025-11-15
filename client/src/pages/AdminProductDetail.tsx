import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import ProductAdminAPI, { Product } from "../api/productAdmin";
import ImageUpload from "../components/ImageUpload";
import "../styles/AdminProductDetail.css";
import "../styles/ImageUpload.css";

const AdminProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const productData = await ProductAdminAPI.getProductById(id!);
      setProduct(productData);
    } catch (err: any) {
      setError(err.response?.data?.message || "Có lỗi xảy ra khi tải sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!product) return;

    try {
      await ProductAdminAPI.updateProductStatus(product._id, newStatus);
      setProduct({
        ...product,
        status: newStatus as "pending" | "active" | "inactive",
      });
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Có lỗi xảy ra khi cập nhật trạng thái"
      );
    }
  };

  const handleDeleteProduct = async () => {
    if (!product) return;

    if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;

    try {
      await ProductAdminAPI.deleteProduct(product._id);
      navigate("/admin/products");
    } catch (err: any) {
      setError(err.response?.data?.message || "Có lỗi xảy ra khi xóa sản phẩm");
    }
  };

  const handleImagesUpdated = (newImages: string[]) => {
    if (product) {
      setProduct({
        ...product,
        images: newImages,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { className: "badge-success", text: "Hoạt động" },
      pending: { className: "badge-warning", text: "Chờ duyệt" },
      inactive: { className: "badge-danger", text: "Không hoạt động" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <span className={`badge ${config.className}`}>{config.text}</span>;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const nextImage = () => {
    if (product?.images && product.images.length > 1) {
      setCurrentImageIndex((prev) =>
        prev === product.images!.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (product?.images && product.images.length > 1) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? product.images!.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <div className="admin-product-detail-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải chi tiết sản phẩm...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="admin-product-detail-error">
        <h2>Có lỗi xảy ra</h2>
        <p>{error || "Không tìm thấy sản phẩm"}</p>
        <Link to="/admin/products" className="btn btn-primary">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-product-detail">
      {/* Header */}
      <div className="detail-header">
        <div className="breadcrumb">
          <Link to="/admin/products">Quản lý sản phẩm</Link>
          <span className="separator">›</span>
          <span className="current">{product.name}</span>
        </div>
        <div className="header-actions">
          <Link
            to={`/admin/products/edit/${product._id}`}
            className="btn btn-primary"
          >
            ✏️ Chỉnh sửa
          </Link>
          <button onClick={handleDeleteProduct} className="btn btn-danger">
            🗑️ Xóa sản phẩm
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="detail-content">
        {/* Product Images */}
        <div className="product-images-section">
          <div className="main-image-container">
            {product.images && product.images.length > 0 ? (
              <>
                <img
                  src={product.images[currentImageIndex]}
                  alt={product.name}
                  className="main-image"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/images/placeholder.png";
                  }}
                />
                {product.images.length > 1 && (
                  <>
                    <button className="image-nav prev" onClick={prevImage}>
                      ❮
                    </button>
                    <button className="image-nav next" onClick={nextImage}>
                      ❯
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="no-image-placeholder">
                <span>Không có hình ảnh</span>
              </div>
            )}
          </div>

          {product.images && product.images.length > 1 && (
            <div className="image-thumbnails">
              {product.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`${product.name} ${index + 1}`}
                  className={`thumbnail ${
                    index === currentImageIndex ? "active" : ""
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/images/placeholder.png";
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="product-info-section">
          <div className="info-card">
            <h1 className="product-title">{product.name}</h1>

            <div className="status-section">
              <label htmlFor="status-select">Trạng thái:</label>
              <div className="status-controls">
                <select
                  id="status-select"
                  value={product.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="status-select"
                >
                  <option value="pending">Chờ duyệt</option>
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Không hoạt động</option>
                </select>
                {getStatusBadge(product.status)}
              </div>
            </div>

            <div className="info-grid">
              <div className="info-item">
                <span className="label">Giá:</span>
                <span className="value price">
                  {formatPrice(product.price)}
                </span>
              </div>

              <div className="info-item">
                <span className="label">Số lượng tồn kho:</span>
                <span
                  className={`value ${product.stock < 10 ? "low-stock" : ""}`}
                >
                  {product.stock} {product.stock < 10 && "(Sắp hết hàng)"}
                </span>
              </div>

              <div className="info-item">
                <span className="label">Số mảnh ghép:</span>
                <span className="value">{product.pieces || 0} pieces</span>
              </div>

              <div className="info-item">
                <span className="label">Chủ đề:</span>
                <span className="value">
                  {product.themeId?.name || "Chưa phân loại"}
                </span>
              </div>

              <div className="info-item">
                <span className="label">Độ tuổi:</span>
                <span className="value">
                  {product.ageRangeId?.rangeLabel || "Chưa xác định"}
                  {product.ageRangeId &&
                    product.ageRangeId.minAge &&
                    product.ageRangeId.maxAge && (
                      <span className="age-detail">
                        ({product.ageRangeId.minAge}-{product.ageRangeId.maxAge}{" "}
                        tuổi)
                      </span>
                    )}
                </span>
              </div>

              <div className="info-item">
                <span className="label">Độ khó:</span>
                <span className="value">
                  {product.difficultyId?.label || "Chưa xác định"}
                  {product.difficultyId && product.difficultyId.level && (
                    <span className="difficulty-level">
                      (Level {product.difficultyId.level})
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <ImageUpload
            productId={product._id}
            currentImages={product.images || []}
            onImagesUpdated={handleImagesUpdated}
          />

          {/* Creation Info */}
          <div className="creation-info-card">
            <h3>Thông tin tạo</h3>
            <div className="creation-details">
              <div className="info-item">
                <span className="label">Được tạo bởi:</span>
                <span className="value">
                  {product.createdBy?.username || "Không xác định"}
                  {product.createdBy?.email && (
                    <span className="email">({product.createdBy.email})</span>
                  )}
                </span>
              </div>

              <div className="info-item">
                <span className="label">Ngày tạo:</span>
                <span className="value">{formatDate(product.createdAt)}</span>
              </div>

              <div className="info-item">
                <span className="label">Cập nhật lần cuối:</span>
                <span className="value">{formatDate(product.updatedAt)}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions-card">
            <h3>Thao tác nhanh</h3>
            <div className="action-buttons">
              <button
                onClick={() => handleStatusChange("active")}
                className="btn btn-success"
                disabled={product.status === "active"}
              >
                Kích hoạt
              </button>
              <button
                onClick={() => handleStatusChange("inactive")}
                className="btn btn-warning"
                disabled={product.status === "inactive"}
              >
                Vô hiệu hóa
              </button>
              <Link
                to={`/admin/products/edit/${product._id}`}
                className="btn btn-primary"
              >
                Chỉnh sửa
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProductDetail;
