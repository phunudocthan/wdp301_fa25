import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Power,
  Upload,
  Image as ImageIcon,
  Palette,
  Eye,
  X,
  Calendar,
  User,
  Layout as LayoutIcon,
} from "lucide-react";
import themeApi, { Theme } from "../api/theme";
import { getFullImageURL } from "../api/axiosInstance";
import "../styles/AdminThemeManagement.css";

const AdminThemeManagement: React.FC = () => {
  console.log("🎨 AdminThemeManagement component rendered!");

  // States
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalThemes, setTotalThemes] = useState(0);
  const [totalActiveThemes, setTotalActiveThemes] = useState(0);
  const itemsPerPage = 5; // Giảm xuống 5 để dễ test pagination

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    layout: "classic",
    isActive: true,
  });
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [previewBanner, setPreviewBanner] = useState<string>("");

  // Detail modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailTheme, setDetailTheme] = useState<Theme | null>(null);

  // Fetch themes
  useEffect(() => {
    fetchThemes();
  }, [currentPage, searchTerm, statusFilter]);

  // Fetch total active themes count
  useEffect(() => {
    fetchTotalActiveThemes();
  }, []);

  const fetchTotalActiveThemes = async () => {
    try {
      const response = await themeApi.getAll({
        page: 1,
        limit: 1,
        isActive: true,
      });
      setTotalActiveThemes(response.data.pagination.total || 0);
    } catch (error) {
      console.error("Error fetching total active themes:", error);
    }
  };

  const fetchThemes = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        isActive:
          statusFilter === "all" ? undefined : statusFilter === "active",
      };

      const response = await themeApi.getAll(params);

      setThemes(response.data.data || []);
      setTotalPages(response.data.pagination.pages || 1);
      setTotalThemes(response.data.pagination.total || 0);

      // Update total active count after any CRUD operation
      fetchTotalActiveThemes();
    } catch (error) {
      console.error("Error fetching themes:", error);
      alert("Không thể tải danh sách theme");
    } finally {
      setLoading(false);
    }
  };

  // Handle create/edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("description", formData.description);
      data.append("layout", formData.layout);
      data.append("isActive", String(formData.isActive));

      if (bannerFile) {
        data.append("banner", bannerFile);
      }

      if (editingTheme) {
        await themeApi.update(editingTheme._id, data);
        alert("Cập nhật theme thành công!");
      } else {
        await themeApi.create(data);
        alert("Tạo theme mới thành công!");
      }

      handleCloseModal();
      await fetchThemes();
    } catch (error: any) {
      console.error("Error saving theme:", error);
      alert(
        error.response?.data?.error || error.message || "Lỗi khi lưu theme"
      );
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa theme này?")) return;

    try {
      await themeApi.delete(id);
      alert("Xóa theme thành công!");
      fetchThemes();
    } catch (error: any) {
      console.error("Error deleting theme:", error);
      alert(error.message || "Không thể xóa theme này");
    }
  };

  // Handle toggle active status
  const handleToggleStatus = async (id: string) => {
    try {
      await themeApi.toggleActive(id);
      await fetchThemes();
    } catch (error: any) {
      console.error("Error toggling status:", error);
      alert(
        error.response?.data?.error ||
          error.message ||
          "Không thể thay đổi trạng thái"
      );
    }
  };

  // Handle open modal for create
  const handleCreate = () => {
    setEditingTheme(null);
    setFormData({
      name: "",
      description: "",
      layout: "classic",
      isActive: true,
    });
    setBannerFile(null);
    setPreviewBanner("");
    setShowModal(true);
  };

  // Handle open modal for edit
  const handleEdit = (theme: Theme) => {
    setEditingTheme(theme);
    setFormData({
      name: theme.name,
      description: theme.description || "",
      layout: (theme as any).layout || "classic",
      isActive: theme.isActive,
    });
    setBannerFile(null);
    setPreviewBanner(theme.banner ? getFullImageURL(theme.banner) : "");
    setShowModal(true);
  };

  // Handle view detail
  const handleViewDetail = (theme: Theme) => {
    setDetailTheme(theme);
    setShowDetailModal(true);
  };

  // Handle close detail modal
  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setDetailTheme(null);
  };

  // Handle close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTheme(null);
    setFormData({
      name: "",
      description: "",
      layout: "classic",
      isActive: true,
    });
    setBannerFile(null);
    setPreviewBanner("");
  };

  // Handle banner file change
  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewBanner(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="admin-theme-management">
      <div className="page-header">
        <div>
          <h1>Quản lý Theme</h1>
          <p className="subtitle">Quản lý theme và giao diện website</p>
        </div>
        <button className="btn-primary" onClick={handleCreate}>
          <Plus size={20} />
          Thêm Theme
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên theme..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="status-filter"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="inactive">Không hoạt động</option>
        </select>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#e0e7ff" }}>
            <Palette size={24} color="#4f46e5" />
          </div>
          <div>
            <div className="stat-value">{totalThemes}</div>
            <div className="stat-label">Tổng số theme</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#dcfce7" }}>
            <Power size={24} color="#16a34a" />
          </div>
          <div>
            <div className="stat-value">{totalActiveThemes}</div>
            <div className="stat-label">Theme đang hoạt động</div>
          </div>
        </div>
      </div>

      {/* Themes Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-state">Đang tải...</div>
        ) : themes.length === 0 ? (
          <div className="empty-state">
            <Palette size={48} />
            <p>Chưa có theme nào</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Banner</th>
                <th>Tên Theme</th>
                <th>Mô tả</th>
                <th>Layout</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {themes.map((theme) => {
                // Ensure _id is string
                const themeId = String(theme._id || (theme as any).id || "");
                console.log("Theme data:", {
                  originalId: theme._id,
                  convertedId: themeId,
                  name: theme.name,
                  isActive: theme.isActive,
                });

                if (!themeId) {
                  console.error("⚠️ Theme missing ID:", theme);
                  return null;
                }

                return (
                  <tr key={themeId}>
                    <td>
                      {theme.banner ? (
                        <img
                          src={getFullImageURL(theme.banner)}
                          alt={theme.name}
                          className="theme-banner-thumb"
                        />
                      ) : (
                        <div className="no-banner">
                          <ImageIcon size={20} />
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="theme-name">{theme.name}</div>
                    </td>
                    <td>
                      <div className="theme-description">
                        {theme.description || "-"}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-layout">
                        {(theme as any).layout || "classic"}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`status-badge ${
                          theme.isActive ? "active" : "inactive"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log(
                            "Clicking toggle for theme:",
                            themeId,
                            theme.name
                          );
                          handleToggleStatus(themeId);
                        }}
                        title="Click để thay đổi trạng thái"
                      >
                        <Power size={16} />
                        {theme.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td>
                      {theme.createdAt
                        ? new Date(theme.createdAt).toLocaleDateString("vi-VN")
                        : "-"}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon btn-view"
                          onClick={() => handleViewDetail(theme)}
                          title="Xem chi tiết"
                        >
                          <Eye size={20} />
                        </button>
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => handleEdit(theme)}
                          title="Chỉnh sửa"
                        >
                          <Edit size={20} />
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDelete(themeId)}
                          title="Xóa"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalThemes > 0 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{" "}
            {Math.min(currentPage * itemsPerPage, totalThemes)} trong tổng số{" "}
            {totalThemes} theme{totalThemes > 1 ? "s" : ""}
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                title="Trang đầu"
              >
                ««
              </button>
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                title="Trang trước"
              >
                ‹
              </button>

              {/* Page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  // Show first page, last page, current page, and 1 page around current
                  return (
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1
                  );
                })
                .map((page, index, array) => {
                  // Add ellipsis if there's a gap
                  const prevPage = array[index - 1];
                  const showEllipsis = prevPage && page - prevPage > 1;

                  return (
                    <React.Fragment key={page}>
                      {showEllipsis && (
                        <span className="pagination-ellipsis">...</span>
                      )}
                      <button
                        className={`pagination-btn ${
                          currentPage === page ? "active" : ""
                        }`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                className="pagination-btn"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                title="Trang sau"
              >
                ›
              </button>
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                title="Trang cuối"
              >
                »»
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal Create/Edit */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTheme ? "Chỉnh sửa Theme" : "Tạo Theme mới"}</h2>
              <button className="btn-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="theme-form">
              {/* Basic Info */}
              <div className="form-section">
                <h3>Thông tin cơ bản</h3>

                <div className="form-group">
                  <label>
                    Tên Theme <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    placeholder="Nhập tên theme"
                  />
                </div>

                <div className="form-group">
                  <label>Mô tả</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Nhập mô tả theme"
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Layout</label>
                  <select
                    value={formData.layout}
                    onChange={(e) =>
                      setFormData({ ...formData, layout: e.target.value })
                    }
                  >
                    <option value="classic">Classic</option>
                    <option value="modern">Modern</option>
                    <option value="minimal">Minimal</option>
                    <option value="creative">Creative</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                    />
                    Kích hoạt theme
                  </label>
                </div>
              </div>

              {/* Banner Upload */}
              <div className="form-section">
                <h3>Banner</h3>
                <div className="banner-upload">
                  {previewBanner ? (
                    <div className="banner-preview">
                      <img src={previewBanner} alt="Banner preview" />
                      <button
                        type="button"
                        className="btn-remove-banner"
                        onClick={() => {
                          setBannerFile(null);
                          setPreviewBanner("");
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  ) : (
                    <label className="banner-upload-label">
                      <Upload size={32} />
                      <p>Click để upload banner</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerChange}
                        hidden
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCloseModal}
                >
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  {editingTheme ? "Cập nhật" : "Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail */}
      {showDetailModal && detailTheme && (
        <div className="modal-overlay" onClick={handleCloseDetailModal}>
          <div
            className="modal-content modal-detail"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Chi tiết Theme</h2>
              <button className="btn-close" onClick={handleCloseDetailModal}>
                <X size={24} />
              </button>
            </div>

            <div className="detail-content">
              {/* Banner */}
              {detailTheme.banner && (
                <div className="detail-banner">
                  <img
                    src={getFullImageURL(detailTheme.banner)}
                    alt={detailTheme.name}
                  />
                </div>
              )}

              {/* Info Grid */}
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-label">
                    <Palette size={18} />
                    <span>Tên Theme</span>
                  </div>
                  <div className="detail-value">{detailTheme.name}</div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">
                    <LayoutIcon size={18} />
                    <span>Layout</span>
                  </div>
                  <div className="detail-value">
                    <span className="badge badge-layout">
                      {(detailTheme as any).layout || "classic"}
                    </span>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">
                    <Power size={18} />
                    <span>Trạng thái</span>
                  </div>
                  <div className="detail-value">
                    <span
                      className={`status-badge ${
                        detailTheme.isActive ? "active" : "inactive"
                      }`}
                    >
                      <Power size={14} />
                      {detailTheme.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">
                    <Calendar size={18} />
                    <span>Ngày tạo</span>
                  </div>
                  <div className="detail-value">
                    {detailTheme.createdAt
                      ? new Date(detailTheme.createdAt).toLocaleString("vi-VN")
                      : "-"}
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">
                    <Calendar size={18} />
                    <span>Ngày cập nhật</span>
                  </div>
                  <div className="detail-value">
                    {detailTheme.updatedAt
                      ? new Date(detailTheme.updatedAt).toLocaleString("vi-VN")
                      : "-"}
                  </div>
                </div>

                {(detailTheme as any).createdBy && (
                  <div className="detail-item">
                    <div className="detail-label">
                      <User size={18} />
                      <span>Người tạo</span>
                    </div>
                    <div className="detail-value">
                      {typeof (detailTheme as any).createdBy === "object"
                        ? (detailTheme as any).createdBy.email ||
                          (detailTheme as any).createdBy.username ||
                          "N/A"
                        : "N/A"}
                    </div>
                  </div>
                )}

                <div className="detail-item detail-item-full">
                  <div className="detail-label">
                    <span>Mô tả</span>
                  </div>
                  <div className="detail-value detail-description">
                    {detailTheme.description || "Không có mô tả"}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="detail-actions">
                <button
                  className="btn-secondary"
                  onClick={handleCloseDetailModal}
                >
                  Đóng
                </button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    handleCloseDetailModal();
                    handleEdit(detailTheme);
                  }}
                >
                  <Edit size={18} />
                  Chỉnh sửa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminThemeManagement;
