import React, { useState, useEffect, useRef } from "react";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import categoryAdminAPI, { Category } from "../api/categoryAdmin";

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
    parentId: "",
    isActive: true,
    order: 0,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!category;

  useEffect(() => {
    fetchParentCategories();

    if (category) {
      setFormData({
        name: category.name,
        description: category.description || "",
        parentId: category.parentId || "",
        isActive: category.isActive,
        order: category.order,
      });

      if (category.image) {
        setPreviewUrl(`http://localhost:5000${category.image}`);
      }
    }
  }, [category]);

  const fetchParentCategories = async () => {
    try {
      const response = await categoryAdminAPI.getCategories({ limit: 100 });
      setParentCategories(response.data.filter((cat) => !cat.parentId)); // Only parent categories
    } catch (error) {
      console.error("Error fetching parent categories:", error);
    }
  };

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

      if (formData.parentId) {
        submitData.append("parentId", formData.parentId);
      }

      if (selectedFile) {
        submitData.append("image", selectedFile);
      }

      if (isEditing && category) {
        await categoryAdminAPI.updateCategory(category._id, submitData);
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {isEditing ? "Sửa danh mục" : "Thêm danh mục mới"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Tên danh mục <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Nhập tên danh mục..."
              required
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Mô tả
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Nhập mô tả danh mục..."
            />
          </div>

          {/* Parent Category */}
          <div>
            <label
              htmlFor="parentId"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Danh mục cha
            </label>
            <select
              id="parentId"
              name="parentId"
              value={formData.parentId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">
                Chọn danh mục cha (để trống nếu là danh mục gốc)
              </option>
              {parentCategories.map((parentCat) => (
                <option
                  key={parentCat._id}
                  value={parentCat._id}
                  disabled={category?._id === parentCat._id} // Prevent self-selection
                >
                  {parentCat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hình ảnh danh mục
            </label>

            {previewUrl ? (
              <div className="relative inline-block">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
            )}

            <div className="mt-2">
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
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Upload className="w-4 h-4 mr-2" />
                {previewUrl ? "Thay đổi hình ảnh" : "Chọn hình ảnh"}
              </button>
              <p className="mt-1 text-xs text-gray-500">
                Kích thước tối đa: 5MB. Định dạng: JPG, PNG, GIF
              </p>
            </div>
          </div>

          {/* Order and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="order"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Thứ tự hiển thị
              </label>
              <input
                type="number"
                id="order"
                name="order"
                value={formData.order}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center">
              <div className="flex h-full items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="isActive"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Kích hoạt danh mục
                </label>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Đang lưu..." : isEditing ? "Cập nhật" : "Tạo mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryForm;
