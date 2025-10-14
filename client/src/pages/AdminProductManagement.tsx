import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProductAdminAPI, {
  Product,
  ProductStatsResponse,
} from "../api/productAdmin";
import categoryAdminAPI, { Category } from "../api/categoryAdmin";
import ProductList from "../components/ProductList";
import ProductForm from "../components/ProductForm";
import ProductStats from "../components/ProductStats";
import "../styles/AdminProductManagement.css";

const AdminProductManagement: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<ProductStatsResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Load products and stats
  const loadData = async () => {
    try {
      setLoading(true);
      const [productsResponse, statsResponse] = await Promise.all([
        ProductAdminAPI.getProducts({
          page: currentPage,
          limit: 10,
          search: searchTerm,
          status: filterStatus,
          category: filterCategory,
          sortBy,
          sortOrder,
        }),
        ProductAdminAPI.getProductStats(),
      ]);

      setProducts(productsResponse.data.products);
      setTotalPages(productsResponse.data.pagination.totalPages);
      setStats(statsResponse.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Có lỗi xảy ra khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [
    currentPage,
    searchTerm,
    filterStatus,
    filterCategory,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await categoryAdminAPI.getCategories({ limit: 100 });
      setCategories(response.data);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadData();
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;

    try {
      await ProductAdminAPI.deleteProduct(id);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Có lỗi xảy ra khi xóa sản phẩm");
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await ProductAdminAPI.updateProductStatus(id, status);
      loadData();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Có lỗi xảy ra khi cập nhật trạng thái"
      );
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProduct(null);
    loadData();
  };

  if (loading && !products.length) {
    return (
      <div className="admin-products-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="admin-products">
      {/* Back Button */}
      <div className="mb-4">
        <button
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-gray-700"
          onClick={() => navigate('/admin/dashboard')}
        >
          ← Quay về Admin Dashboard
        </button>
      </div>
      <div className="admin-products-header">
        <h1>Quản lý sản phẩm</h1>
        <button className="btn btn-primary" onClick={handleCreateProduct}>
          + Thêm sản phẩm
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {stats && <ProductStats stats={stats} />}

      <div className="products-controls">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn btn-secondary">
            Tìm kiếm
          </button>
        </form>

        <div className="filters">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Không hoạt động</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="filter-select"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={`${sortBy}_${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split("_");
              setSortBy(field);
              setSortOrder(order as "asc" | "desc");
            }}
            className="sort-select"
          >
            <option value="createdAt_desc">Mới nhất</option>
            <option value="createdAt_asc">Cũ nhất</option>
            <option value="name_asc">Tên A-Z</option>
            <option value="name_desc">Tên Z-A</option>
            <option value="price_asc">Giá thấp đến cao</option>
            <option value="price_desc">Giá cao đến thấp</option>
            <option value="stock_asc">Tồn kho ít nhất</option>
          </select>
        </div>
      </div>

      <ProductList
        products={products}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
        onStatusChange={handleStatusChange}
        loading={loading}
      />

      {totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="btn btn-secondary"
          >
            Trước
          </button>

          <span className="pagination-info">
            Trang {currentPage} / {totalPages}
          </span>

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="btn btn-secondary"
          >
            Sau
          </button>
        </div>
      )}

      {showForm && (
        <ProductForm product={editingProduct} onClose={handleFormClose} />
      )}
    </div>
  );
};

export default AdminProductManagement;
