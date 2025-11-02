import axios from './axiosInstance';

export const uploadProductImage = (file: File) => {
  const fd = new FormData();
  fd.append('image', file);
  return axios.post('/upload/product-image', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);
};

export const uploadProductImages = (files: File[]) => {
  const fd = new FormData();
  files.forEach((f) => fd.append('images', f));
  return axios.post('/upload/product-images', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);
};

export const uploadReviewImage = (file: File) => {
  const fd = new FormData();
  fd.append('image', file);
  return axios.post('/upload/review-image', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);
};

export const uploadReviewImages = (files: File[]) => {
  const fd = new FormData();
  files.forEach((f) => fd.append('images', f));
  return axios.post('/upload/review-images', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);
};

export default { uploadProductImage, uploadProductImages, uploadReviewImage, uploadReviewImages };
