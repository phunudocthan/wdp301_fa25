import React, { useState, useEffect } from "react";
import ProductAdminAPI, {
  Product,
  ProductCreateData,
  ProductUpdateData,
} from "../api/productAdmin";
import HelperAPI, { Theme, AgeRange, Difficulty } from "../api/helpers";
import categoryAdminAPI, { Category } from "../api/categoryAdmin";
import ImageUploadForm from "./ImageUploadForm";
import "../styles/ImageUploadForm.css";

interface ProductFormProps {
  product?: Product | null;
  onClose: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onClose }) => {
  const [formData, setFormData] = useState<ProductCreateData>({
    name: "",
    themeId: "",
    ageRangeId: "",
    difficultyId: "",
    pieces: 0,
    price: 0,
    stock: 0,
    status: "active",
    images: [],
    categories: [],
  });

  const [themes, setThemes] = useState<Theme[]>([]);
  const [ageRanges, setAgeRanges] = useState<AgeRange[]>([]);
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([""]);

  const isEditing = !!product;

  useEffect(() => {
    loadFormData();
  }, []);

  useEffect(() => {
    if (product) {
      console.log("Product data for editing:", product);
      console.log("Product categories:", product.categories);
      setFormData({
        name: product.name,
        themeId: product.themeId?._id || "",
        ageRangeId: product.ageRangeId?._id || "",
        difficultyId: product.difficultyId?._id || "",
        pieces: product.pieces || 0,
        price: product.price,
        stock: product.stock,
        status: product.status,
        images: product.images || [],
        categories: product.categories?.map((cat) => cat._id) || [],
      });
      const categoryIds = product.categories?.map((cat) => cat._id) || [];
      console.log("Setting selectedCategories to:", categoryIds);
      setSelectedCategories(categoryIds);
      setImageUrls(
        product.images && product.images.length > 0 ? product.images : [""]
      );
    }
  }, [product]);

  // Sync selectedCategories with formData
  useEffect(() => {
    console.log("selectedCategories changed:", selectedCategories);
    // Filter out empty strings before setting to formData
    const validCategories = selectedCategories.filter(
      (cat) => cat && cat.trim() !== ""
    );
    console.log("validCategories after filter:", validCategories);
    setFormData((prev) => ({
      ...prev,
      categories: validCategories,
    }));
  }, [selectedCategories]);

  const loadFormData = async () => {
    try {
      const [themesData, ageRangesData, difficultiesData, categoriesData] =
        await Promise.all([
          HelperAPI.getThemes(),
          HelperAPI.getAgeRanges(),
          HelperAPI.getDifficulties(),
          categoryAdminAPI.getCategories({ limit: 100 }),
        ]);

      setThemes(themesData);
      setAgeRanges(ageRangesData);
      setDifficulties(difficultiesData);
      setCategories(categoriesData.data);
      console.log("Loaded categories:", categoriesData.data);
    } catch (err: any) {
      setError("Không thể tải dữ liệu form");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "pieces" || name === "stock"
          ? parseInt(value) || 0
          : name === "price"
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log("Form data before submit:", formData);
      console.log("Selected categories:", selectedCategories);

      // Đảm bảo categories được cập nhật vào formData trước khi gửi
      const finalFormData = {
        ...formData,
        categories: selectedCategories.filter(
          (cat) => cat && cat.trim() !== ""
        ),
      };

      console.log("Final form data with categories:", finalFormData);

      if (isEditing && product) {
        await ProductAdminAPI.updateProduct(
          product._id,
          finalFormData as ProductUpdateData
        );
      } else {
        await ProductAdminAPI.createProduct(finalFormData);
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Có lỗi xảy ra khi lưu sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-form-overlay">
      <div className="product-form-modal">
        <div className="form-header">
          <h2>{isEditing ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}</h2>
          <button onClick={onClose} className="close-btn">
            ×
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Tên sản phẩm *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Nhập tên sản phẩm"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="themeId">Theme *</label>
              <select
                id="themeId"
                name="themeId"
                value={formData.themeId}
                onChange={handleInputChange}
                required
              >
                <option value="">Chọn theme</option>
                {themes.map((theme) => (
                  <option key={theme._id} value={theme._id}>
                    {theme.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="ageRangeId">Độ tuổi *</label>
              <select
                id="ageRangeId"
                name="ageRangeId"
                value={formData.ageRangeId}
                onChange={handleInputChange}
                required
              >
                <option value="">Chọn độ tuổi</option>
                {ageRanges.map((ageRange) => (
                  <option key={ageRange._id} value={ageRange._id}>
                    {ageRange.rangeLabel}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="difficultyId">Độ khó *</label>
              <select
                id="difficultyId"
                name="difficultyId"
                value={formData.difficultyId}
                onChange={handleInputChange}
                required
              >
                <option value="">Chọn độ khó</option>
                {difficulties.map((difficulty) => (
                  <option key={difficulty._id} value={difficulty._id}>
                    {difficulty.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="categories">Danh mục sản phẩm</label>
              <div className="category-dropdown-container">
                <select
                  id="categories"
                  className="category-dropdown-select"
                  value=""
                  onChange={(e) => {
                    const selectedValue = e.target.value.trim();
                    if (
                      selectedValue &&
                      !selectedCategories.includes(selectedValue)
                    ) {
                      setSelectedCategories((prev) => [...prev, selectedValue]);
                    }
                    e.target.value = ""; // Reset dropdown
                  }}
                >
                  <option value="">Chọn danh mục để thêm</option>
                  {categories
                    .filter(
                      (category) => !selectedCategories.includes(category._id)
                    )
                    .map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                </select>

                <div className="selected-categories-display">
                  <strong>Danh mục đã chọn:</strong>
                  {selectedCategories.length > 0 ? (
                    <div className="selected-categories-tags">
                      {selectedCategories.map((categoryId) => {
                        const category = categories.find(
                          (c) => c._id === categoryId
                        );
                        return category ? (
                          <span
                            key={categoryId}
                            className="selected-category-tag"
                          >
                            {category.name}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCategories((prev) =>
                                  prev.filter(
                                    (id) =>
                                      id &&
                                      id.trim() !== "" &&
                                      id !== categoryId
                                  )
                                );
                              }}
                              className="remove-category"
                            >
                              ×
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  ) : (
                    <span className="no-categories">
                      Chưa chọn danh mục nào
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pieces">Số miếng</label>
              <input
                type="number"
                id="pieces"
                name="pieces"
                value={formData.pieces}
                onChange={handleInputChange}
                min="0"
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="price">Giá (VND) *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                placeholder="Ví dụ: 159.99"
                title="Nhập giá sản phẩm bằng USD, có thể sử dụng số thập phân (ví dụ: 159.99)"
              />
              <small className="form-help">
                Nhập giá bằng USD, có thể sử dụng số thập phân (ví dụ: 159.99)
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="stock">Tồn kho</label>
              <input
                type="number"
                id="stock"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                min="0"
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="status">Trạng thái</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Hình ảnh</label>
            <ImageUploadForm
              images={imageUrls}
              onImagesChange={(newImages) => {
                setImageUrls(newImages);
                setFormData((prev) => ({
                  ...prev,
                  images: newImages.filter((img) => img.trim() !== ""),
                }));
              }}
              maxImages={5}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Đang lưu..." : isEditing ? "Cập nhật" : "Tạo mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
