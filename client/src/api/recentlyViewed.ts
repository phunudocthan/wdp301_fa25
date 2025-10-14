import axiosInstance from './axiosInstance';

export async function addRecentlyViewed(legoId: string) {
  return axiosInstance.post('/recently-viewed/add', { legoId });
}

export async function getRecentlyViewed() {
  const res = await axiosInstance.get('/recently-viewed/list');
  return res.data?.data || [];
}
