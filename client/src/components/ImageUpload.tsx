import React, { useState, useRef } from "react";
import UploadAPI from "../api/upload";
import ProductAdminAPI from "../api/productAdmin";

interface ImageUploadProps {
  productId: string;
  currentImages: string[];
  onImagesUpdated: (newImages: string[]) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  productId,
  currentImages,
  onImagesUpdated,
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    try {
      setUploading(true);

      // Validate files
      const validFiles = Array.from(files).filter((file) => {
        const isImage = file.type.startsWith("image/");
        const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
        return isImage && isValidSize;
      });

      if (validFiles.length === 0) {
        alert("Vui lòng chọn file ảnh hợp lệ (jpg, png, webp) và nhỏ hơn 5MB");
        return;
      }

      // Upload images
      const uploadResponse = await UploadAPI.uploadProductImages(validFiles);

      if (uploadResponse.success && uploadResponse.data.images) {
        // Update product with new images
        const updatedImages = [...currentImages, ...uploadResponse.data.images];

        await ProductAdminAPI.updateProduct(productId, {
          images: updatedImages,
        });

        onImagesUpdated(updatedImages);
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(error.response?.data?.message || "Có lỗi xảy ra khi upload ảnh");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const handleRemoveImage = async (index: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa ảnh này?")) return;

    try {
      const updatedImages = currentImages.filter((_, i) => i !== index);

      await ProductAdminAPI.updateProduct(productId, {
        images: updatedImages,
      });

      onImagesUpdated(updatedImages);
    } catch (error: any) {
      console.error("Remove image error:", error);
      alert(error.response?.data?.message || "Có lỗi xảy ra khi xóa ảnh");
    }
  };

  return (
    <div className="image-upload-container">
      <h3>Quản lý hình ảnh</h3>

      {/* Upload Area */}
      <div
        className={`upload-area ${dragOver ? "drag-over" : ""} ${
          uploading ? "uploading" : ""
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleButtonClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInputChange}
          style={{ display: "none" }}
        />

        <div className="upload-content">
          {uploading ? (
            <div className="upload-loading">
              <div className="loading-spinner"></div>
              <p>Đang upload...</p>
            </div>
          ) : (
            <>
              <div className="upload-icon">📷</div>
              <p className="upload-text">
                <strong>Click để chọn ảnh</strong> hoặc kéo thả ảnh vào đây
              </p>
              <p className="upload-hint">
                Hỗ trợ: JPG, PNG, WEBP (tối đa 5MB mỗi file)
              </p>
            </>
          )}
        </div>
      </div>

      {/* Current Images */}
      {currentImages.length > 0 && (
        <div className="current-images">
          <h4>Ảnh hiện tại ({currentImages.length})</h4>
          <div className="images-grid">
            {currentImages.map((imageUrl, index) => (
              <div key={index} className="image-item">
                <img
                  src={imageUrl}
                  alt={`Product ${index + 1}`}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/images/placeholder.png";
                  }}
                />
                <button
                  className="remove-image-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage(index);
                  }}
                  title="Xóa ảnh"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
