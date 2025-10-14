import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import { useCart } from '../components/context/CartContext';
import { Input, Radio, Button, message, Modal } from 'antd';
import { getAddresses } from '../api/user';
import type { UserAddress } from '../types/user';

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | 'new'>('new');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getAddresses();
        if (!mounted) return;
        setAddresses(Array.isArray(res.addresses) ? res.addresses : []);
        // if there is a default address, preselect it
        if (res.defaultAddress && res.defaultAddress._id) {
          setSelectedAddressId(res.defaultAddress._id);
          setAddress([res.defaultAddress.street, res.defaultAddress.city, res.defaultAddress.state, res.defaultAddress.country].filter(Boolean).join(', '));
          setName(res.defaultAddress.recipientName || '');
          setPhone(res.defaultAddress.phone || '');
        }
      } catch (err) {
        console.error('Failed to load addresses in checkout', err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);
  const [payment, setPayment] = useState<'COD' | 'VNPay'>('COD');

  const subtotal = cart.items.reduce((s, it) => s + it.price * it.quantity, 0);
  const [voucherCode, setVoucherCode] = useState('');

  const handleSubmit = async () => {
    // require either a selected saved address or entered address fields
    if (!name || !phone || (!address && selectedAddressId === 'new')) {
      message.error('Vui lòng điền đầy đủ thông tin giao hàng');
      return;
    }

    // determine customer address object: use selected saved address when available
    let customerAddress = address;
    if (selectedAddressId !== 'new') {
      const found = addresses.find((a) => a._id === selectedAddressId);
      if (found) {
        customerAddress = [found.street, found.city, found.state, found.country]
          .filter(Boolean)
          .join(', ');
      }
    }

    // Mock order payload
    const order = {
      id: `ORD-${Date.now()}`,
      customer: { name, phone, address: customerAddress },
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
        // VNPay: open sandbox demo CreateOrder page so you can test with demo cards
        // The demo page accepts simple query params for convenience (orderId, amount)
        const demoUrl = `http://sandbox.vnpayment.vn/tryitnow/Home/CreateOrder?orderId=${encodeURIComponent(order.id)}&amount=${encodeURIComponent(subtotal)}`;
        window.open(demoUrl, '_blank');
        // show a modal with demo card info/instructions so user can copy for testing
        Modal.info({
          title: 'VNPay sandbox: test card info',
          width: 700,
          content: (
            <div>
              <p>Mở tab VNPay demo, dán thông tin đơn/amount nếu cần, sau đó dùng các thẻ test dưới đây khi thanh toán:</p>
              <ul>
                <li>Thẻ thử (ví dụ): 9704198526191432198</li>
                <li>OTP (ví dụ): 123456</li>
                <li>Nội dung demo phụ thuộc vào trang sandbox; bạn có thể thử nhiều thẻ từ trang demo.</li>
              </ul>
              <p>Link demo: <a href={demoUrl} target="_blank" rel="noreferrer">{demoUrl}</a></p>
            </div>
          ),
        });
        // still create order locally and clear cart (mocked)
        clearCart();
        message.info('Chuyển tới VNPay sandbox. Đơn hàng đã được tạo tạm thời.');
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
            <label>Chọn địa chỉ đã lưu</label>
            <div>
              <Radio.Group
                onChange={(e) => {
                  const val = e.target.value as string;
                  setSelectedAddressId(val === 'new' ? 'new' : val);
                  if (val === 'new') {
                    setAddress('');
                  } else {
                    const found = addresses.find((a) => a._id === val);
                    if (found) {
                      setAddress([found.street, found.city, found.state, found.country].filter(Boolean).join(', '));
                      setName(found.recipientName || name);
                      setPhone(found.phone || phone);
                    }
                  }
                }}
                value={selectedAddressId}
              >
                {addresses.map((a) => (
                  <Radio key={a._id} value={a._id} style={{ display: 'block', marginBottom: 6 }}>
                    <strong>{a.label || 'Address'}</strong> — {[a.street, a.city, a.state, a.country].filter(Boolean).join(', ')} {a.isDefault ? '(Default)' : ''}
                  </Radio>
                ))}
                <Radio value="new">Nhập địa chỉ mới</Radio>
              </Radio.Group>
            </div>
          </div>
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
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Số nhà, tên đường, quận, thành phố" />
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
              <div style={{ marginBottom: 8 }}>
                <label>Voucher</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Input value={voucherCode} onChange={(e) => setVoucherCode(e.target.value)} placeholder="Nhập mã giảm giá" />
                  <Button onClick={() => {
                    // Placeholder: voucher application will be implemented by dev later
                    message.info('Khu vực mã giảm giá: dev sẽ tích hợp sau.');
                  }}>Áp dụng</Button>
                </div>
                <div style={{ marginTop: 8, color: '#666' }}>Khu vực để dev tích hợp voucher (hiện là placeholder)</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>Tạm tính <span>{subtotal.toLocaleString()} Đ</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>Tổng cộng <span>{subtotal.toLocaleString()} Đ</span></div>
          </div>
        </div>
      </div>
    </>
  );
}
