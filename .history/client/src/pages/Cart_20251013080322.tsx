import { } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import { useCart } from '../components/context/CartContext';
import '../styles/cart.scss';
import { Button, InputNumber, Divider } from 'antd';

export default function Cart() {
  const { cart, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();

  const subtotal = cart.items.reduce((s, it) => s + it.price * it.quantity, 0);
  const shipping = subtotal > 0 ? 0 : 0; // free shipping like in screenshot
  const total = subtotal - 0 + shipping;

  return (
    <>
      <Header />
      <div className="cart-page" style={{ padding: '20px 50px' }}>
        <div className="cart-left">
          <div className="breadcrumb">Giỏ Hàng &gt; Thông Tin &gt; Vận Chuyển &gt; Thanh Toán</div>
          <h3 className="free-shipping">Bạn được miễn phí ship</h3>

          {cart.items.length === 0 ? (
            <div className="empty">Giỏ hàng trống. <Link to="/shop">Tiếp tục mua sắm</Link></div>
          ) : (
            <div>
              {cart.items.map((it) => (
                <div key={it.id} className="cart-item">
                  <img src={it.image} alt={it.name} className="item-image" />
                  <div className="item-info">
                    <div className="item-name">{it.name}</div>
                    <div className="item-controls">
                      <div className="qty-label">Số lượng</div>
                      <div className="qty-controls">
                        <Button onClick={() => updateQuantity(it.id, Math.max(1, it.quantity - 1))}>-</Button>
                        <InputNumber min={1} value={it.quantity} onChange={(val) => updateQuantity(it.id, Number(val))} />
                        <Button onClick={() => updateQuantity(it.id, it.quantity + 1)}>+</Button>
                      </div>
                      <div className="remove" onClick={() => removeFromCart(it.id)}>Xóa</div>
                    </div>
                  </div>
                  <div className="item-price">{it.price.toLocaleString()} Đ</div>
                </div>
              ))}
              <Divider />
              <div className="cart-summary-line">Tổng cộng: <strong>{cart.items.length} Sản phẩm</strong></div>
            </div>
          )}
        </div>

        <div className="cart-right">
          <div className="summary-box">
            <div className="summary-row"><span>Tiền hàng hoá</span><span>{subtotal.toLocaleString()} Đ</span></div>
            <div className="summary-row"><span>Giảm giá</span><span>0</span></div>
            <div className="summary-row total"><span>Tổng cộng</span><span>{total.toLocaleString()} Đ</span></div>

            <div className="agree">
              <input type="checkbox" id="agree" />
              <label htmlFor="agree">Tôi đã đọc và đồng ý với <Link to="#">Chính sách bảo mật</Link> và <Link to="#">Điều kiện thanh toán</Link></label>
            </div>

            <Button type="primary" className="checkout-btn" block onClick={() => navigate('/checkout')}>Thanh toán ngay</Button>

            <div className="signin-cta">Đăng nhập Hoặc Đăng ký để mua hàng với nhiều ưu đãi hơn</div>
          </div>
        </div>
      </div>
    </>
  );
}
