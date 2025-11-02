import React, { useState, useRef } from "react";
import UploadAPI from "../api/upload";

interface ImageUploadFormProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  uploadFn?: (files: File[]) => Promise<any>;
}

const ImageUploadForm: React.FC<ImageUploadFormProps> = ({
  images,
  onImagesChange,
  maxImages = 5,
  uploadFn,
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

      // Check if adding files would exceed max limit
      if (images.length + validFiles.length > maxImages) {
        alert(
          `Chỉ có thể có tối đa ${maxImages} ảnh. Hiện tại có ${images.length} ảnh.`
        );
        return;
      }

      // Upload images
  // allow consumer to provide a custom upload function (e.g. review uploads)
    const defaultUpload = (UploadAPI as any)?.uploadReviewImages || (UploadAPI as any)?.uploadProductImages;
    const fn = uploadFn ? uploadFn : defaultUpload;
    const uploadResponse = await fn(validFiles);

      if (uploadResponse.success && uploadResponse.data.images) {
        // Update images list
        const updatedImages = [...images, ...uploadResponse.data.images];
        onImagesChange(updatedImages);
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

  const handleRemoveImage = (index: number) => {
    if (window.confirm("Bạn có chắc muốn xóa ảnh này?")) {
      const updatedImages = images.filter((_, i) => i !== index);
      onImagesChange(updatedImages);
    }
  };

  const handleAddUrlInput = () => {
    // Add empty string for new URL input
    onImagesChange([...images, ""]);
  };

  const handleUrlChange = (index: number, url: string) => {
    const updatedImages = [...images];
    updatedImages[index] = url;
    onImagesChange(updatedImages);
  };

  return (
    <div className="image-upload-form">
      <div className="upload-methods">
        {/* File Upload Section */}
        <div className="upload-section">
          <h4>Upload từ máy tính</h4>
          <div
            className={`upload-dropzone ${dragOver ? "drag-over" : ""} ${
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
                    <strong>Click để chọn</strong> hoặc kéo thả ảnh
                  </p>
                  <p className="upload-hint">JPG, PNG, WEBP (max 5MB)</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* URL Input Section */}
        <div className="url-section">
          <h4>Hoặc nhập URL ảnh</h4>
          <div className="url-inputs">
            {images.map((url, index) => (
              <div key={index} className="url-input-group">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => handleUrlChange(index, e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="url-input"
                />
                {images.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="btn btn-sm btn-danger"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {images.length < maxImages && (
              <button
                type="button"
                onClick={handleAddUrlInput}
                className="btn btn-sm btn-secondary"
              >
                + Thêm URL
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Preview Images */}
      {images.length > 0 && images.some((img) => img.trim() !== "") && (
        <div className="image-preview-section">
          <h4>
            Preview ({images.filter((img) => img.trim() !== "").length} ảnh)
          </h4>
          <div className="image-preview-grid">
            {images.map(
              (imageUrl, index) =>
                imageUrl.trim() !== "" && (
                  <div key={index} className="preview-item">
                    <img
                      src={imageUrl}
                      alt={`Preview ${index + 1}`}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/images/placeholder.png";
                      }}
                    />
                    <button
                      type="button"
                      className="remove-preview-btn"
                      onClick={() => handleRemoveImage(index)}
                      title="Xóa ảnh"
                    >
                      ×
                    </button>
                  </div>
                )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadForm;
