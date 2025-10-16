import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import ProductAdminAPI, { Product } from "../api/productAdmin";
import ProductForm from "../components/ProductForm";
import "../styles/AdminProductEdit.css";

const AdminProductEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleClose = () => {
    navigate(`/admin/products/${id}`);
  };

  if (loading) {
    return (
      <div className="admin-product-edit-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải thông tin sản phẩm...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="admin-product-edit-error">
        <h2>Có lỗi xảy ra</h2>
        <p>{error || "Không tìm thấy sản phẩm"}</p>
        <Link to="/admin/products" className="btn btn-primary">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-product-edit">
      <div className="edit-header">
        <div className="breadcrumb">
          <Link to="/admin/products">Quản lý sản phẩm</Link>
          <span className="separator">›</span>
          <Link to={`/admin/products/${product._id}`}>{product.name}</Link>
          <span className="separator">›</span>
          <span className="current">Chỉnh sửa</span>
        </div>
      </div>

      <div className="edit-content">
        <ProductForm product={product} onClose={handleClose} />
      </div>
    </div>
  );
};

export default AdminProductEdit;
