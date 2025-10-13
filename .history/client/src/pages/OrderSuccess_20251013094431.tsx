import { useLocation, Link } from 'react-router-dom';

export default function OrderSuccess() {
  const { state } = useLocation();
  const order = state?.order;

  return (
    <div style={{ padding: 40 }}>
      <h2>Đặt hàng thành công</h2>
      {order ? (
        <div>
          <p>Mã đơn: <strong>{order.id}</strong></p>
          <p>Tổng tiền: <strong>{order.subtotal?.toLocaleString()} Đ</strong></p>
          <p>Phương thức: <strong>{order.paymentMethod}</strong></p>
          <Link to="/shop">Tiếp tục mua sắm</Link>
        </div>
      ) : (
        <div>
          <p>Không tìm thấy thông tin đơn hàng.</p>
          <Link to="/shop">Quay về cửa hàng</Link>
        </div>
      )}
    </div>
  );
}
