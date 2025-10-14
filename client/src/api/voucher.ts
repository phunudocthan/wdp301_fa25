import axiosInstance from './axiosInstance';

export async function validateVoucher(code: string) {
  const res = await axiosInstance.get('/vouchers/validate', { params: { code } });
  return res.data; // { valid, code, discountPercent }
}
