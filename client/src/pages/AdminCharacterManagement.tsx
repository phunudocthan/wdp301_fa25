import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Search,
  Image as ImageIcon,
  X,
  Eye,
  Calendar,
  User,
  Palette,
  Edit,
} from "lucide-react";
import themeApi, { Theme, ThemeCharacter } from "../api/theme";
import { getFullImageURL } from "../api/axiosInstance";
import "../styles/AdminThemeManagement.css";

const AdminCharacterManagement: React.FC = () => {
  // States
  const [characters, setCharacters] = useState<ThemeCharacter[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCharacters, setTotalCharacters] = useState(0);
  const itemsPerPage = 10;

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "detail" | "edit">(
    "create"
  );
  const [selectedCharacter, setSelectedCharacter] =
    useState<ThemeCharacter | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    themeId: "",
    isActive: true,
    order: 0,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string>("");

  // Fetch themes on mount
  useEffect(() => {
    fetchThemes();
  }, []);

  // Fetch characters when filters change
  useEffect(() => {
    fetchCharacters();
  }, [currentPage, searchTerm, selectedTheme]);

  const fetchThemes = async () => {
    try {
      const response = await themeApi.getAll({ limit: 1000 });
      setThemes(response.data.data || []);
    } catch (error) {
      console.error("Error fetching themes:", error);
    }
  };

  const fetchCharacters = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
      };

      let response;
      if (selectedTheme) {
        response = await themeApi.getCharacters(selectedTheme, params);
        setCharacters(response.data.data || []);
        setTotalPages(response.data.pagination.pages || 1);
        setTotalCharacters(response.data.pagination.total || 0);
      } else {
        // Fetch all characters from all themes
        const allThemes = await themeApi.getAll({ limit: 1000 });
        const allCharactersMap = new Map<string, ThemeCharacter>(); // Sử dụng Map để tránh trùng lặp

        for (const theme of allThemes.data.data) {
          try {
            const charRes = await themeApi.getCharacters(theme._id, {
              limit: 1000,
            });
            // Chỉ thêm nếu chưa tồn tại (tránh trùng lặp)
            charRes.data.data.forEach((char) => {
              if (!allCharactersMap.has(char._id)) {
                allCharactersMap.set(char._id, char);
              }
            });
          } catch (err) {
            console.error(`Error fetching characters for theme ${theme._id}`);
          }
        }

        // Chuyển Map thành Array
        const allCharacters = Array.from(allCharactersMap.values());

        // Filter by search term
        let filtered = allCharacters;
        if (searchTerm) {
          filtered = allCharacters.filter(
            (char) =>
              char.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              char.description?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        // Paginate
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedCharacters = filtered.slice(startIndex, endIndex);

        setCharacters(paginatedCharacters);
        setTotalCharacters(filtered.length);
        setTotalPages(Math.ceil(filtered.length / itemsPerPage));
      }
    } catch (error) {
      console.error("Error fetching characters:", error);
      alert("Không thể tải danh sách nhân vật");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (characterId: string) => {
    try {
      setLoading(true);
      const response = await themeApi.getCharacterById(characterId);
      setSelectedCharacter(response.data.data);
      setModalMode("detail");
      setShowModal(true);
    } catch (error) {
      console.error("Error fetching character detail:", error);
      alert("Không thể tải chi tiết nhân vật");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      name: "",
      description: "",
      themeId: "",
      isActive: true,
      order: 0,
    });
    setImageFile(null);
    setPreviewImage("");
    setSelectedCharacter(null);
    setModalMode("create");
    setShowModal(true);
  };

  const handleEdit = async (character: ThemeCharacter) => {
    setSelectedCharacter(character);

    // Lấy themeId đúng cách (có thể là string hoặc object)
    const themeIdValue =
      typeof character.themeId === "string"
        ? character.themeId
        : (character.themeId as any)?._id || character.themeId;

    setFormData({
      name: character.name,
      description: character.description || "",
      themeId: themeIdValue,
      isActive: character.isActive,
      order: character.order,
    });
    setImageFile(null);
    setPreviewImage(getFullImageURL(character.image));
    setModalMode("edit");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCharacter(null);
    setImageFile(null);
    setPreviewImage("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Vui lòng nhập tên nhân vật");
      return;
    }

    if (!formData.themeId) {
      alert("Vui lòng chọn theme");
      return;
    }

    if (!imageFile && modalMode === "create") {
      alert("Vui lòng chọn ảnh nhân vật");
      return;
    }

    try {
      setLoading(true);
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name.trim());
      formDataToSend.append("themeId", formData.themeId);
      formDataToSend.append("description", formData.description.trim());
      formDataToSend.append("isActive", formData.isActive.toString());
      formDataToSend.append("order", formData.order.toString());

      if (imageFile) {
        formDataToSend.append("image", imageFile);
      }

      if (modalMode === "edit" && selectedCharacter) {
        await themeApi.updateCharacter(selectedCharacter._id, formDataToSend);
        alert("Cập nhật nhân vật thành công!");
      } else {
        await themeApi.addCharacter(formData.themeId, formDataToSend);
        alert("Tạo nhân vật thành công!");
      }

      handleCloseModal();
      fetchCharacters();
    } catch (error: any) {
      console.error("Error saving character:", error);
      alert(
        error.response?.data?.error ||
          `Không thể ${
            modalMode === "edit" ? "cập nhật" : "tạo"
          } nhân vật. Vui lòng thử lại!`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (characterId: string, characterName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa nhân vật "${characterName}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await themeApi.deleteCharacter(characterId);
      alert("Xóa nhân vật thành công!");
      fetchCharacters();
    } catch (error: any) {
      console.error("Error deleting character:", error);
      alert(
        error.response?.data?.error ||
          "Không thể xóa nhân vật. Vui lòng thử lại!"
      );
    } finally {
      setLoading(false);
    }
  };

  // Generate pagination buttons
  const getPaginationButtons = () => {
    const buttons = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        buttons.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) buttons.push(i);
        buttons.push("...");
        buttons.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        buttons.push(1);
        buttons.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) buttons.push(i);
      } else {
        buttons.push(1);
        buttons.push("...");
        buttons.push(currentPage - 1);
        buttons.push(currentPage);
        buttons.push(currentPage + 1);
        buttons.push("...");
        buttons.push(totalPages);
      }
    }

    return buttons;
  };

  return (
    <div className="admin-theme-management">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>
            <Palette style={{ display: "inline", marginRight: "0.5rem" }} />
            Quản Lý Nhân Vật
          </h1>
          <p className="subtitle">
            Quản lý nhân vật trong các theme của shop •{" "}
            <span className="active-count">{totalCharacters} nhân vật</span>
          </p>
        </div>
        <button className="btn-primary" onClick={handleCreate}>
          <Plus size={20} />
          Tạo Nhân Vật Mới
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div
            className="stat-icon"
            style={{ background: "#dbeafe", color: "#1e40af" }}
          >
            <Palette size={24} />
          </div>
          <div>
            <div className="stat-value">{totalCharacters}</div>
            <div className="stat-label">Tổng Nhân Vật</div>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-icon"
            style={{ background: "#fce7f3", color: "#be185d" }}
          >
            <ImageIcon size={24} />
          </div>
          <div>
            <div className="stat-value">{themes.length}</div>
            <div className="stat-label">Số Theme</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên nhân vật..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <select
          value={selectedTheme}
          onChange={(e) => {
            setSelectedTheme(e.target.value);
            setCurrentPage(1);
          }}
          className="status-filter"
        >
          <option value="">Tất cả Theme</option>
          {themes.map((theme) => (
            <option key={theme._id} value={theme._id}>
              {theme.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-state">Đang tải...</div>
      ) : characters.length === 0 ? (
        <div className="empty-state">
          <ImageIcon size={48} />
          <p>Không tìm thấy nhân vật nào</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ảnh</th>
                  <th>Tên Nhân Vật</th>
                  <th>Theme</th>
                  <th>Mô Tả</th>
                  <th>Thứ Tự</th>
                  <th>Trạng Thái</th>
                  <th>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {characters.map((character) => (
                  <tr key={character._id}>
                    <td>
                      <img
                        src={getFullImageURL(character.image)}
                        alt={character.name}
                        className="theme-banner-thumb"
                      />
                    </td>
                    <td>
                      <strong className="theme-name">{character.name}</strong>
                    </td>
                    <td>
                      {(() => {
                        // Lấy themeId đúng cách
                        const themeIdValue =
                          typeof character.themeId === "string"
                            ? character.themeId
                            : (character.themeId as any)?._id ||
                              character.themeId;

                        const theme = themes.find(
                          (t) => t._id === themeIdValue
                        );
                        return theme?.name || "N/A";
                      })()}
                    </td>
                    <td>
                      <div className="theme-description">
                        {character.description || "Chưa có mô tả"}
                      </div>
                    </td>
                    <td>{character.order}</td>
                    <td>
                      <span
                        className={`badge ${
                          character.isActive ? "badge-layout" : "badge-layout"
                        }`}
                        style={{
                          background: character.isActive
                            ? "#dcfce7"
                            : "#fee2e2",
                          color: character.isActive ? "#16a34a" : "#dc2626",
                        }}
                      >
                        {character.isActive ? "Hoạt động" : "Không hoạt động"}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon btn-view"
                          onClick={() => handleViewDetail(character._id)}
                          title="Xem chi tiết"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => handleEdit(character)}
                          title="Chỉnh sửa"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() =>
                            handleDelete(character._id, character.name)
                          }
                          title="Xóa"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <div className="pagination-info">
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{" "}
                {Math.min(currentPage * itemsPerPage, totalCharacters)} trong
                tổng số {totalCharacters} nhân vật
              </div>

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

                {getPaginationButtons().map((page, index) =>
                  page === "..." ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="pagination-ellipsis"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      className={`pagination-btn ${
                        currentPage === page ? "active" : ""
                      }`}
                      onClick={() => setCurrentPage(page as number)}
                    >
                      {page}
                    </button>
                  )
                )}

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
            </div>
          )}
        </>
      )}

      {/* Modal Detail */}
      {showModal && modalMode === "detail" && selectedCharacter && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div
            className="modal-content modal-detail"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Chi Tiết Nhân Vật</h2>
              <button className="btn-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>

            <div className="detail-content">
              {/* Character Image */}
              <div className="detail-banner">
                <img
                  src={getFullImageURL(selectedCharacter.image)}
                  alt={selectedCharacter.name}
                />
              </div>

              {/* Character Info */}
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-label">
                    <User size={16} />
                    Tên Nhân Vật
                  </div>
                  <div className="detail-value">{selectedCharacter.name}</div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">
                    <Palette size={16} />
                    Theme
                  </div>
                  <div className="detail-value">
                    {(() => {
                      const themeIdValue =
                        typeof selectedCharacter.themeId === "string"
                          ? selectedCharacter.themeId
                          : (selectedCharacter.themeId as any)?._id ||
                            selectedCharacter.themeId;

                      const theme = themes.find((t) => t._id === themeIdValue);
                      return theme?.name || "N/A";
                    })()}
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">Thứ Tự</div>
                  <div className="detail-value">{selectedCharacter.order}</div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">Trạng Thái</div>
                  <div className="detail-value">
                    <span
                      className="badge-layout"
                      style={{
                        background: selectedCharacter.isActive
                          ? "#dcfce7"
                          : "#fee2e2",
                        color: selectedCharacter.isActive
                          ? "#16a34a"
                          : "#dc2626",
                      }}
                    >
                      {selectedCharacter.isActive
                        ? "Hoạt động"
                        : "Không hoạt động"}
                    </span>
                  </div>
                </div>

                {selectedCharacter.description && (
                  <div className="detail-item detail-item-full">
                    <div className="detail-label">Mô Tả</div>
                    <div className="detail-description">
                      {selectedCharacter.description}
                    </div>
                  </div>
                )}

                <div className="detail-item">
                  <div className="detail-label">
                    <Calendar size={16} />
                    Ngày Tạo
                  </div>
                  <div className="detail-value">
                    {selectedCharacter.createdAt
                      ? new Date(selectedCharacter.createdAt).toLocaleString(
                          "vi-VN"
                        )
                      : "N/A"}
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">
                    <Calendar size={16} />
                    Cập Nhật Lần Cuối
                  </div>
                  <div className="detail-value">
                    {selectedCharacter.updatedAt
                      ? new Date(selectedCharacter.updatedAt).toLocaleString(
                          "vi-VN"
                        )
                      : "N/A"}
                  </div>
                </div>
              </div>

              <div className="detail-actions">
                <button className="btn-secondary" onClick={handleCloseModal}>
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Create/Edit */}
      {showModal && (modalMode === "create" || modalMode === "edit") && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {modalMode === "edit"
                  ? "Chỉnh Sửa Nhân Vật"
                  : "Tạo Nhân Vật Mới"}
              </h2>
              <button className="btn-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="theme-form">
              {/* Image Upload */}
              <div className="form-section">
                <h3>Ảnh Nhân Vật</h3>
                <div className="form-group">
                  <label>
                    Ảnh{" "}
                    {modalMode === "create" && (
                      <span className="required">*</span>
                    )}
                    {modalMode === "edit" && (
                      <small style={{ color: "#6b7280", fontWeight: 400 }}>
                        {" "}
                        (Để trống nếu không muốn thay đổi)
                      </small>
                    )}
                  </label>
                  <div className="banner-upload">
                    {previewImage ? (
                      <div className="banner-preview">
                        <img src={previewImage} alt="Preview" />
                        <button
                          type="button"
                          className="btn-remove-banner"
                          onClick={() => {
                            setImageFile(null);
                            setPreviewImage("");
                          }}
                        >
                          <X size={16} style={{ marginRight: "0.25rem" }} />
                          Xóa ảnh
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="image-upload"
                        className="banner-upload-label"
                      >
                        <ImageIcon size={48} />
                        <p>Click để chọn ảnh nhân vật</p>
                        <small>PNG, JPG, GIF (Max 5MB)</small>
                      </label>
                    )}
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: "none" }}
                    />
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="form-section">
                <h3>Thông tin cơ bản</h3>

                <div className="form-group">
                  <label>
                    Tên Nhân Vật <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Nhập tên nhân vật..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Theme <span className="required">*</span>
                  </label>
                  <select
                    value={formData.themeId}
                    onChange={(e) =>
                      setFormData({ ...formData, themeId: e.target.value })
                    }
                    required
                  >
                    <option value="">-- Chọn Theme --</option>
                    {themes.map((theme) => (
                      <option key={theme._id} value={theme._id}>
                        {theme.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Mô Tả</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Mô tả về nhân vật..."
                    rows={4}
                  />
                </div>

                <div className="form-group">
                  <label>Thứ Tự Hiển Thị</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        order: parseInt(e.target.value),
                      })
                    }
                    min={0}
                  />
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
                    <span>Kích hoạt nhân vật</span>
                  </label>
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
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading
                    ? modalMode === "edit"
                      ? "Đang cập nhật..."
                      : "Đang tạo..."
                    : modalMode === "edit"
                    ? "Cập Nhật"
                    : "Tạo Nhân Vật"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCharacterManagement;
