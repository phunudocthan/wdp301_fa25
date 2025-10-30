import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Input, Radio, Button, message, Modal } from "antd";
import axiosInstance from "../api/axiosInstance";
import Header from "../components/common/Header";
import { useAuth } from "../components/context/AuthContext";
import { getAddresses } from "../api/user";

export default function CheckoutReorder() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const reorderId = params.get("reorderId");

  const { user } = useAuth();

  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">("new");
  const [payment, setPayment] = useState<"COD" | "VNPay">("COD");

  const [voucherCode, setVoucherCode] = useState("");
  const [voucherInfo, setVoucherInfo] = useState<any>(null);
  const [discount, setDiscount] = useState(0);
  const [voucherLoading, setVoucherLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // Lấy danh sách địa chỉ
        const res = await getAddresses();
        if (!mounted) return;
        setAddresses(Array.isArray(res.addresses) ? res.addresses : []);
        if (res.defaultAddress && res.defaultAddress._id) {
          setSelectedAddressId(res.defaultAddress._id);
          setAddress(
            [res.defaultAddress.street, res.defaultAddress.city, res.defaultAddress.state, res.defaultAddress.country]
              .filter(Boolean)
              .join(", ")
          );
          setName(res.defaultAddress.recipientName || "");
          setPhone(res.defaultAddress.phone || "");
        }
      } catch (err) {
        console.error("Failed to load addresses", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // 👉 Fetch đơn cũ để reorder
  useEffect(() => {
    if (!reorderId) return;

    (async () => {
      try {
        const res = await axiosInstance.get(`/orders/${reorderId}/user`);
        const order = res.data.order;

        if (!order) {
          message.error("Không tìm thấy đơn hàng để reorder");
          navigate("/orders/history");
          return;
        }

        setItems(
          (order.items || []).map((it: any) => ({
            legoId: it.legoId?._id || it.legoId,
            name: it.legoId?.name || it.name,
            price: it.price,
            quantity: it.quantity,
          }))
        );

        const ship = order.shippingAddress || {};
        setName(ship.name || "");
        setPhone(ship.phone || "");
        setAddress(ship.address || "");
        setPayment(order.paymentMethod || "COD");
      } catch (err) {
        console.error("Failed to fetch reorder details", err);
        message.error("Không thể tải đơn hàng reorder");
      }
    })();
  }, [reorderId]);

  const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
  const totalAfterDiscount = Math.round(subtotal * (1 - discount / 100));

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

  const handleSubmit = async () => {
    if (!name || !phone || (!address && selectedAddressId === "new")) {
      message.error("Vui lòng điền đầy đủ thông tin giao hàng");
      return;
    }

    let customerAddress = address;
    if (selectedAddressId !== "new") {
      const found = addresses.find((a) => a._id === selectedAddressId);
      if (found) {
        customerAddress = [found.street, found.city, found.state, found.country].filter(Boolean).join(", ");
      }
    }

    const payload = {
      items: items.map((it) => ({
        legoId: it.legoId,
        quantity: it.quantity,
        price: it.price,
      })),
      shippingAddress: { name, phone, address: customerAddress },
      paymentMethod: payment,
      voucherId: voucherInfo?.id || undefined,
      reorderFrom: reorderId, // đánh dấu reorder
    };

    try {
      if (!user) {
        message.info("Vui lòng đăng nhập trước khi đặt hàng.");
        navigate("/login");
        return;
      }

      const res = await axiosInstance.post("/orders", payload);
      const savedOrder = res.data.order;

      if (payment === "VNPay") {
        const demoUrl = `http://sandbox.vnpayment.vn/tryitnow/Home/CreateOrder?orderId=${encodeURIComponent(
          savedOrder._id
        )}&amount=${encodeURIComponent(savedOrder.total)}`;
        window.open(demoUrl, "_blank");
        Modal.info({
          title: "VNPay sandbox demo",
          width: 700,
          content: (
            <div>
              <p>Đã mở VNPay sandbox. Dùng các thẻ test từ trang demo.</p>
              <a href={demoUrl} target="_blank" rel="noreferrer">
                {demoUrl}
              </a>
            </div>
          ),
        });
      } else {
        message.success("Đặt lại đơn hàng thành công!");
      }

      navigate("/order-success", { state: { order: savedOrder } });
    } catch (err: any) {
      console.error("Checkout reorder error", err);
      message.error(err?.message || "Không thể đặt lại đơn hàng.");
    }
  };

  if (!items.length) return <div className="p-6">Đang tải thông tin đơn hàng...</div>;

  return (
    <>
      <Header />
      <div style={{ padding: 24, display: "flex", gap: 24 }}>
        <div style={{ flex: 1, background: "#fff", padding: 20, borderRadius: 8 }}>
          <h2>Thông tin giao hàng</h2>
          <div style={{ marginBottom: 12 }}>
            <label>Chọn địa chỉ đã lưu</label>
            <Radio.Group
              onChange={(e) => {
                const val = e.target.value as string;
                setSelectedAddressId(val === "new" ? "new" : val);
                if (val === "new") {
                  setAddress("");
                } else {
                  const found = addresses.find((a) => a._id === val);
                  if (found) {
                    setAddress([found.street, found.city, found.state, found.country].filter(Boolean).join(", "));
                    setName(found.recipientName || name);
                    setPhone(found.phone || phone);
                  }
                }
              }}
              value={selectedAddressId}
            >
              {addresses.map((a) => (
                <Radio key={a._id} value={a._id} style={{ display: "block", marginBottom: 6 }}>
                  <strong>{a.label || "Address"}</strong> —{" "}
                  {[a.street, a.city, a.state, a.country].filter(Boolean).join(", ")}{" "}
                  {a.isDefault ? "(Default)" : ""}
                </Radio>
              ))}
              <Radio value="new">Nhập địa chỉ mới</Radio>
            </Radio.Group>
          </div>

          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Họ và tên" style={{ marginBottom: 12 }} />
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Số điện thoại" style={{ marginBottom: 12 }} />
          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Địa chỉ" style={{ marginBottom: 12 }} />

          <h3>Phương thức thanh toán</h3>
          <Radio.Group onChange={(e) => setPayment(e.target.value)} value={payment}>
            <Radio value="COD">Thanh toán khi nhận hàng (COD)</Radio>
            <Radio value="VNPay" style={{ marginLeft: 12 }}>
              VNPay
            </Radio>
          </Radio.Group>

          <div style={{ marginTop: 20 }}>
            <Button type="primary" onClick={handleSubmit}>
              Xác nhận đặt lại
            </Button>
          </div>
        </div>

        <div style={{ width: 360 }}>
          <div style={{ background: "#fff", padding: 20, borderRadius: 8 }}>
            <h3>Đơn hàng</h3>
            {items.map((it) => (
              <div
                key={it.legoId}
                style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}
              >
                <div>
                  {it.name} x {it.quantity}
                </div>
                <div>{(it.price * it.quantity).toLocaleString()} Đ</div>
              </div>
            ))}
            <hr />
            <label>Voucher</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <Input
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                placeholder="Nhập mã giảm giá"
                disabled={voucherLoading}
              />
              <Button loading={voucherLoading} type="primary" onClick={handleApplyVoucher}>
                Áp dụng
              </Button>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Tạm tính</span>
              <span>{subtotal.toLocaleString()} Đ</span>
            </div>

            {discount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", color: "#16a34a" }}>
                Giảm giá ({discount}%) <span>-{(subtotal - totalAfterDiscount).toLocaleString()} Đ</span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
              Tổng cộng <span>{totalAfterDiscount.toLocaleString()} Đ</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
