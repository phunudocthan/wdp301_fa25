import axios from './axiosInstance';

export const uploadSingle = (file: File) => {
  const fd = new FormData();
  fd.append('image', file);
  return axios.post('/upload/product-image', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);
};

export const uploadMultiple = (files: File[]) => {
  const fd = new FormData();
  files.forEach((f) => fd.append('images', f));
  return axios.post('/upload/product-images', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);
};

export default { uploadSingle, uploadMultiple };
