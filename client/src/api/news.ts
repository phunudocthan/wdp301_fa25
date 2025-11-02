import axios from './axiosInstance';

export const fetchNewsList = (params = {}) =>
  axios.get('/news/list', { params }).then((r) => r.data);

export const fetchNewsDetail = (id: string) =>
  axios.get(`/news/${id}`).then((r) => r.data);

export const fetchHighlighted = (limit = 5) =>
  axios.get('/news/highlighted', { params: { limit } }).then((r) => r.data);

export const fetchTrending = (limit = 6) =>
  axios.get('/news/trending', { params: { limit } }).then((r) => r.data);

export const createNews = (payload: any) =>
  axios.post('/news', payload).then((r) => r.data);

export const updateNews = (id: string, payload: any) =>
  axios.put(`/news/${id}`, payload).then((r) => r.data);

export const deleteNews = (id: string) =>
  axios.delete(`/news/${id}`).then((r) => r.data);

export const restoreNews = (id: string) =>
  axios.post(`/news/${id}/restore`).then((r) => r.data);

export default {
  fetchNewsList,
  fetchNewsDetail,
  fetchHighlighted,
  fetchTrending,
  createNews,
  updateNews,
  deleteNews,
  restoreNews,
};
