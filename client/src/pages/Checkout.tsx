import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../components/context/CartContext";
import { Input, Radio, Button, message, Modal } from "antd";
import axios from "axios";
import { getAddresses } from "../api/user";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../components/context/AuthContext";
import type { UserAddress } from "../types/user";
import Header from "../components/common/Header";

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">(
    "new"
  );

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
          setAddress(
            [
              res.defaultAddress.street,
              res.defaultAddress.city,
              res.defaultAddress.state,
              res.defaultAddress.country,
            ]
              .filter(Boolean)
              .join(", ")
          );
          setName(res.defaultAddress.recipientName || "");
          setPhone(res.defaultAddress.phone || "");
        }
      } catch (err) {
        console.error("Failed to load addresses in checkout", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);
  const [payment, setPayment] = useState<"COD" | "VNPay">("COD");

  const subtotal = cart.items.reduce((s, it) => s + it.price * it.quantity, 0);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherInfo, setVoucherInfo] = useState<any>(null);
  const [discount, setDiscount] = useState(0);
  const [voucherLoading, setVoucherLoading] = useState(false);
console.log(voucherInfo);

  // Xử lý áp dụng voucher
  const handleApplyVoucher = async () => {
    if (!voucherCode) {
      message.warning("Vui lòng nhập mã voucher");
      return;
    }
    setVoucherLoading(true);
    try {
      const res = await axiosInstance.get(`/vouchers/validate?code=${voucherCode}`);
      if (res.data.valid) {
        setVoucherInfo(res.data);
        setDiscount(res.data.discountPercent || 0);
        message.success(`Áp dụng voucher thành công: Giảm ${res.data.discountPercent}%`);
      } else {
        setVoucherInfo(null);
        setDiscount(0);
        message.error(res.data.message || "Voucher không hợp lệ");
      }
    } catch (err: any) {
      setVoucherInfo(null);
      setDiscount(0);
      message.error(err?.response?.data?.message || "Không thể kiểm tra voucher");
    } finally {
      setVoucherLoading(false);
    }
  };

  const totalAfterDiscount = Math.round(subtotal * (1 - discount / 100));

  const handleSubmit = async () => {
    // require either a selected saved address or entered address fields
    if (!name || !phone || (!address && selectedAddressId === "new")) {
      message.error("Vui lòng điền đầy đủ thông tin giao hàng");
      return;
    }

    // determine customer address object: use selected saved address when available
    let customerAddress = address;
    if (selectedAddressId !== "new") {
      const found = addresses.find((a) => a._id === selectedAddressId);
      if (found) {
        customerAddress = [found.street, found.city, found.state, found.country]
          .filter(Boolean)
          .join(", ");
      }
    }

    // Build payload for server
    const payload = {
      items: cart.items.map((it: any) => ({
        legoId: it.id,
        quantity: it.quantity,
        price: it.price,
      })),
      shippingAddress: { name, phone, address: customerAddress },
      paymentMethod: payment,
      voucherId: voucherInfo?.id || undefined,
    };

    try {
      // require authentication — server requires token to create orders
      if (!user) {
        message.info("Vui lòng đăng nhập trước khi đặt hàng.");
        navigate("/login");
        return;
      }
      // create order on server
      const res = await axiosInstance.post("/orders", payload);
      const savedOrder = res.data.order;

      if (payment === "VNPay") {
        // open VNPay sandbox demo (kept as convenience) — real VNPay integration requires server signing
        const demoUrl = `http://sandbox.vnpayment.vn/tryitnow/Home/CreateOrder?orderId=${encodeURIComponent(
          savedOrder._id
        )}&amount=${encodeURIComponent(savedOrder.total)}`;
        window.open(demoUrl, "_blank");
        Modal.info({
          title: "VNPay sandbox: test card info",
          width: 700,
          content: (
            <div>
              <p>
                Mở tab VNPay demo, dùng thông tin đơn/amount nếu cần, sau đó
                dùng các thẻ test từ trang demo.
              </p>
              <p>
                Link demo:{" "}
                <a href={demoUrl} target="_blank" rel="noreferrer">
                  {demoUrl}
                </a>
              </p>
            </div>
          ),
        });
        message.info("Chuyển tới VNPay sandbox. Đơn hàng đã được tạo.");
      } else {
        message.success(
          "Đặt hàng thành công. Mã đơn: " +
            (savedOrder.orderNumber || savedOrder._id)
        );
      }

      clearCart();
      navigate("/order-success", { state: { order: savedOrder } });
    } catch (err: any) {
      console.error("Checkout error", err);
      message.error(err?.message || "Không thể đặt hàng. Vui lòng thử lại.");
    }
  };

  return (
    <>
      <Header /> <button onClick={() => navigate(-1)}>Back</button>
      <div style={{ padding: 24, display: "flex", gap: 24 }}>
        <div
          style={{ flex: 1, background: "#fff", padding: 20, borderRadius: 8 }}
        >
          <h2>Thông tin giao hàng</h2>
          <div style={{ marginBottom: 12 }}>
            <label>Chọn địa chỉ đã lưu</label>
            <div>
              <Radio.Group
                onChange={(e) => {
                  const val = e.target.value as string;
                  setSelectedAddressId(val === "new" ? "new" : val);
                  if (val === "new") {
                    setAddress("");
                  } else {
                    const found = addresses.find((a) => a._id === val);
                    if (found) {
                      setAddress(
                        [found.street, found.city, found.state, found.country]
                          .filter(Boolean)
                          .join(", ")
                      );
                      setName(found.recipientName || name);
                      setPhone(found.phone || phone);
                    }
                  }
                }}
                value={selectedAddressId}
              >
                {addresses.map((a) => (
                  <Radio
                    key={a._id}
                    value={a._id}
                    style={{ display: "block", marginBottom: 6 }}
                  >
                    <strong>{a.label || "Address"}</strong> —{" "}
                    {[a.street, a.city, a.state, a.country]
                      .filter(Boolean)
                      .join(", ")}{" "}
                    {a.isDefault ? "(Default)" : ""}
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
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Số nhà, tên đường, quận, thành phố"
            />
          </div>

          <h3>Phương thức thanh toán</h3>
          <Radio.Group
            onChange={(e) => setPayment(e.target.value)}
            value={payment}
          >
            <Radio value="COD">Cash on Delivery (COD)</Radio>
            <Radio value="VNPay" style={{ marginLeft: 12 }}>
              VNPay
            </Radio>
          </Radio.Group>

          <div style={{ marginTop: 20 }}>
            <Button type="primary" onClick={handleSubmit}>
              Xác nhận và thanh toán
            </Button>
          </div>
        </div>

        <div style={{ width: 360 }}>
          <div style={{ background: "#fff", padding: 20, borderRadius: 8 }}>
            <h3>Đơn hàng</h3>
            {cart.items.map((it) => (
              <div
                key={it.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <div>
                  {it.name} x {it.quantity}
                </div>
                <div>{(it.price * it.quantity).toLocaleString()} Đ</div>
              </div>
            ))}
            <hr />
            <div style={{ marginBottom: 8 }}>
              <label>Voucher</label>
              <div style={{ display: "flex", gap: 8 }}>
                <Input
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  placeholder="Nhập mã giảm giá"
                  disabled={voucherLoading}
                />
                <Button
                  loading={voucherLoading}
                  type="primary"
                  onClick={handleApplyVoucher}
                >
                  Áp dụng
                </Button>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              Tạm tính <span>{subtotal.toLocaleString()} Đ</span>
            </div>
            {discount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", color: "#16a34a", fontWeight: 500 }}>
                Giảm giá ({discount}%) <span>-{(subtotal - totalAfterDiscount).toLocaleString()} Đ</span>
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontWeight: 700,
              }}
            >
              Tổng cộng <span>{totalAfterDiscount.toLocaleString()} Đ</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
