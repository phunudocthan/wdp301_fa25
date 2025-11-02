import React, { useState, useEffect, useRef } from "react";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import categoryAdminAPI, { Category } from "../api/categoryAdmin";
import { getApiOriginURL } from "../api/axiosInstance";

interface CategoryFormProps {
  category?: Category | null;
  onClose: () => void;
  onSuccess: () => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
    order: 0,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!category;

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || "",
        isActive: category.isActive,
        order: category.order,
      });

      if (category.image) {
        setPreviewUrl(`${getApiOriginURL()}${category.image}`);
      }
    }
  }, [category]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        alert("Kích thước file không được vượt quá 5MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        alert("Chỉ được upload file hình ảnh");
        return;
      }

      setSelectedFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Tên danh mục không được để trống");
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();

      submitData.append("name", formData.name.trim());
      submitData.append("description", formData.description.trim());
      submitData.append("isActive", formData.isActive.toString());
      submitData.append("order", formData.order.toString());

      if (selectedFile) {
        submitData.append("image", selectedFile);
      }

      if (isEditing && category) {
        console.log("Category object:", category);
        console.log("Category ID:", category._id);
        console.log("Category ID type:", typeof category._id);

        // Đảm bảo ID là string
        const categoryId = category._id?.toString() || category._id;
        console.log("Processed category ID:", categoryId);

        await categoryAdminAPI.updateCategory(categoryId, submitData);
      } else {
        await categoryAdminAPI.createCategory(submitData);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error saving category:", error);
      alert(error.response?.data?.message || "Có lỗi xảy ra khi lưu danh mục");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="category-modal-overlay">
      <div className="category-modal-container">
        <div className="category-modal-header">
          <h3 className="category-modal-title">
            {isEditing ? "✏️ Sửa danh mục" : "➕ Thêm danh mục mới"}
          </h3>
          <button
            onClick={onClose}
            className="category-modal-close"
            title="Đóng"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="category-modal-form">
          {/* Name */}
          <div className="form-group">
            <label htmlFor="name" className="form-label required">
              Tên danh mục
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Nhập tên danh mục..."
              required
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Mô tả
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="form-textarea"
              placeholder="Nhập mô tả danh mục..."
            />
          </div>

          {/* Image Upload */}
          <div className="form-group">
            <label className="form-label">Hình ảnh danh mục</label>

            <div className="image-upload-section">
              {previewUrl ? (
                <div className="image-preview-container">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="image-preview"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="image-remove-btn"
                    title="Xóa hình ảnh"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="image-placeholder">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                  <span className="image-placeholder-text">
                    Chưa có hình ảnh
                  </span>
                </div>
              )}

              <div className="image-upload-controls">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="image-upload-btn"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {previewUrl ? "Thay đổi hình ảnh" : "Chọn hình ảnh"}
                </button>
                <p className="image-upload-note">
                  Kích thước tối đa: 5MB. Định dạng: JPG, PNG, GIF
                </p>
              </div>
            </div>
          </div>

          {/* Order and Status */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="order" className="form-label">
                Thứ tự hiển thị
              </label>
              <input
                type="number"
                id="order"
                name="order"
                value={formData.order}
                onChange={handleInputChange}
                min="0"
                className="form-input"
                placeholder="0"
              />
            </div>

            <div className="form-group checkbox-group">
              <div className="checkbox-container">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="form-checkbox"
                />
                <label htmlFor="isActive" className="checkbox-label">
                  Kích hoạt danh mục
                </label>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="category-modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary modal-btn"
            >
              ❌ Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary modal-btn"
            >
              {loading ? (
                <>
                  <div className="btn-spinner"></div>
                  Đang lưu...
                </>
              ) : (
                <>{isEditing ? "✅ Cập nhật" : "🎉 Tạo mới"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryForm;
