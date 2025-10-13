import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import { useCart } from '../components/context/CartContext';
import { Input, Radio, Button, message } from 'antd';

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [payment, setPayment] = useState<'COD' | 'VNPay'>('COD');

  const subtotal = cart.items.reduce((s, it) => s + it.price * it.quantity, 0);

  const handleSubmit = async () => {
    if (!name || !phone || !address) {
      message.error('Vui lòng điền đầy đủ thông tin giao hàng');
      return;
    }

    // Mock order payload
    const order = {
      id: `ORD-${Date.now()}`,
      customer: { name, phone, address },
      items: cart.items,
      subtotal,
      paymentMethod: payment,
      paymentStatus: payment === 'COD' ? 'unpaid' : 'pending',
    };

    try {
      if (payment === 'COD') {
        // Mock create order -> success
        clearCart();
        message.success('Đặt hàng thành công. Mã đơn: ' + order.id);
        navigate('/order-success', { state: { order } });
      } else {
        // VNPay: open mock payment URL (replace with real backend when available)
        const mockUrl = `https://example.com/vnpay?orderId=${order.id}&amount=${subtotal}`;
        window.open(mockUrl, '_blank');
        // still create order locally and clear cart
        clearCart();
        message.info('Chuyển tới VNPay (mock). Đơn hàng đã được tạo tạm thời.');
        navigate('/order-success', { state: { order } });
      }
    } catch (err) {
      console.error('Checkout error', err);
      message.error('Không thể đặt hàng. Vui lòng thử lại.');
    }
  };

  return (
    <>
      <Header />
      <div style={{ padding: 24, display: 'flex', gap: 24 }}>
        <div style={{ flex: 1, background: '#fff', padding: 20, borderRadius: 8 }}>
          <h2>Thông tin giao hàng</h2>
          <div style={{ marginBottom: 12 }}>
            <label>Họ và tên</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Số điện thoại</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Địa chỉ</label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <h3>Phương thức thanh toán</h3>
          <Radio.Group onChange={(e) => setPayment(e.target.value)} value={payment}>
            <Radio value="COD">Cash on Delivery (COD)</Radio>
            <Radio value="VNPay" style={{ marginLeft: 12 }}>VNPay</Radio>
          </Radio.Group>

          <div style={{ marginTop: 20 }}>
            <Button type="primary" onClick={handleSubmit}>Xác nhận và thanh toán</Button>
          </div>
        </div>

        <div style={{ width: 360 }}>
          <div style={{ background: '#fff', padding: 20, borderRadius: 8 }}>
            <h3>Đơn hàng</h3>
            {cart.items.map((it) => (
              <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>{it.name} x {it.quantity}</div>
                <div>{(it.price * it.quantity).toLocaleString()} Đ</div>
              </div>
            ))}
            <hr />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>Tổng cộng <span>{subtotal.toLocaleString()} Đ</span></div>
          </div>
        </div>
      </div>
    </>
  );
}
