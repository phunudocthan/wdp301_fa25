import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Button } from 'antd';

export default function OrderSuccess() {
  const { state } = useLocation();
  const order = state?.order;
  const navigate = useNavigate();

  return (
    <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
      <div style={{ maxWidth: 960, width: '100%', display: 'flex', gap: 24 }}>
        <div style={{ flex: 1, background: '#fff', padding: 28, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h1 style={{ marginTop: 0, marginBottom: 8 }}>Đặt hàng thành công</h1>
          <p style={{ color: '#666', marginTop: 0 }}>Cảm ơn bạn đã mua sắm — đơn hàng của bạn đã được ghi nhận.</p>

          {order ? (
            <div style={{ marginTop: 18 }}>
              <div style={{ marginBottom: 12 }}><strong>Mã đơn:</strong> {order.id}</div>
              <div style={{ marginBottom: 12 }}><strong>Tổng tiền:</strong> {order.subtotal?.toLocaleString()} Đ</div>
              <div style={{ marginBottom: 12 }}><strong>Phương thức:</strong> {order.paymentMethod}</div>

              {Array.isArray(order.items) && order.items.length > 0 && (
                <div style={{ marginTop: 18 }}>
                  <h4 style={{ marginBottom: 8 }}>Mặt hàng</h4>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {order.items.map((it: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ maxWidth: '70%' }}>{it.name} x {it.quantity}</div>
                        <div style={{ fontWeight: 700 }}>{(it.price * it.quantity).toLocaleString()} Đ</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
                <Button type="primary" onClick={() => navigate('/shop')}>Tiếp tục mua sắm</Button>
                <Button onClick={() => navigate('/user/orders')}>Xem đơn hàng</Button>
              </div>
            </div>
          ) : (
            <div>
              <p>Không tìm thấy thông tin đơn hàng.</p>
              <div style={{ marginTop: 12 }}>
                <Button type="primary" onClick={() => navigate('/shop')}>Quay về cửa hàng</Button>
              </div>
            </div>
          )}
        </div>

        <div style={{ width: 320 }}>
          <div style={{ background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <h3 style={{ marginTop: 0 }}>Tóm tắt đơn</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>Tổng tiền <strong>{order?.subtotal?.toLocaleString() || '0'} Đ</strong></div>
            <div style={{ color: '#666', fontSize: 13 }}>Trạng thái thanh toán: <strong>{order?.paymentStatus || '—'}</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}
