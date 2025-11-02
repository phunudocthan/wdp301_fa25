import axios from './axiosInstance';

export const submitReview = (payload: { legoId: string; rating: number; comment?: string; images?: string[] }) => {
  return axios.post('/reviews', payload).then(r => r.data);
};

export const getProductReviews = (legoId: string, params: any = {}) => {
  return axios.get(`/reviews/product/${legoId}`, { params }).then(r => r.data);
};

export const adminGetReviews = (params: any = {}) => {
  return axios.get('/reviews/admin/list', { params }).then(r => r.data);
};

export const replyReview = (id: string, message: string) => {
  return axios.post(`/reviews/${id}/reply`, { message }).then(r => r.data);
};

export const voteReview = (id: string, vote: 'up' | 'down') => {
  return axios.post(`/reviews/${id}/vote`, { vote }).then(r => r.data);
};

export default { submitReview, getProductReviews, adminGetReviews, replyReview, voteReview };
