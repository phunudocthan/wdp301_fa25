import React from "react";
import { Link } from "react-router-dom";
import { Product } from "../api/productAdmin";

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  loading: boolean;
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  onEdit,
  onDelete,
  onStatusChange,
  loading,
}) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { className: "badge-success", text: "Hoạt động" },
      inactive: { className: "badge-danger", text: "Không hoạt động" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <span className={`badge ${config.className}`}>{config.text}</span>;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price || 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  if (loading) {
    return (
      <div className="products-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải sản phẩm...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="no-products">
        <p>Không có sản phẩm nào được tìm thấy.</p>
      </div>
    );
  }

  return (
    <div className="products-list">
      <div className="products-table-responsive">
        <table className="products-table">
          <thead>
            <tr>
              <th>Hình ảnh</th>
              <th>Tên sản phẩm</th>
              <th>Theme</th>
              <th>Danh mục</th>
              <th>Giá</th>
              <th>Tồn kho</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id}>
                <td>
                  <div className="product-image">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/images/placeholder.png";
                        }}
                      />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="product-info">
                    <h4>{product.name}</h4>
                    <p>{product.pieces} pieces</p>
                  </div>
                </td>
                <td>{product.themeId?.name || "Chưa phân loại"}</td>
                <td>
                  <div className="product-categories">
                    {product.categories && product.categories.length > 0 ? (
                      <div className="categories-container">
                        <div className="categories-display">
                          {product.categories.length === 1 ? (
                            <span className="single-category">
                              {product.categories[0].name}
                            </span>
                          ) : (
                            <select
                              className="category-dropdown"
                              defaultValue=""
                              title={product.categories
                                .map((cat) => cat.name)
                                .join(", ")}
                            >
                              <option value="" disabled>
                                {product.categories.length} danh mục
                              </option>
                              {product.categories.map((category) => (
                                <option key={category._id} value={category._id}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        {product.categories.length > 1 && (
                          <div className="categories-tooltip">
                            {product.categories.map((category) => (
                              <div
                                key={category._id}
                                className="tooltip-category"
                              >
                                {category.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="no-categories">Chưa phân loại</span>
                    )}
                  </div>
                </td>
                <td className="price">{formatPrice(product.price)}</td>
                <td>
                  <span className={product.stock < 10 ? "low-stock" : ""}>
                    {product.stock}
                  </span>
                </td>
                <td>
                  <select
                    value={product.status}
                    onChange={(e) =>
                      onStatusChange(product._id, e.target.value)
                    }
                    className="status-select"
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Không hoạt động</option>
                  </select>
                  {getStatusBadge(product.status)}
                </td>
                <td>{formatDate(product.createdAt)}</td>
                <td>
                  <div className="action-buttons">
                    <Link
                      to={`/admin/products/${product._id}`}
                      className="btn btn-sm btn-info"
                      title="Xem chi tiết"
                    >
                      👁️
                    </Link>
                    <button
                      onClick={() => onEdit(product)}
                      className="btn btn-sm btn-primary"
                      title="Chỉnh sửa"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDelete(product._id)}
                      className="btn btn-sm btn-danger"
                      title="Xóa"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductList;
