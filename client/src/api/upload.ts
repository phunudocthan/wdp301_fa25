import axiosInstance from "./axiosInstance";

export interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    images?: string[];
    image?: string;
  };
}

class UploadAPI {
  // Upload multiple images
  static async uploadProductImages(
    files: FileList | File[]
  ): Promise<UploadResponse> {
    const formData = new FormData();

    // Convert FileList to Array if needed
    const fileArray = Array.from(files);

    fileArray.forEach((file) => {
      formData.append("images", file);
    });

    const response = await axiosInstance.post(
      "/upload/product-images",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  }

  // Upload single image
  static async uploadProductImage(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("image", file);

    const response = await axiosInstance.post(
      "/upload/product-image",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  }
}

export default UploadAPI;
