import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import {
  Card,
  List,
  Button,
  message,
  Tag,
  Descriptions,
  Result,
  Skeleton,
  Space,
  Modal,
  Upload,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../components/common/Header";
import ReviewAPI from "../api/review";
import UploadAPI from "../api/upload";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const OrderHistoryListUser: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewModal, setReviewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Form đánh giá
  const [form, setForm] = useState({
    rating: 5,
    comment: "",
    images: [] as any[],
  });

  const query = new URLSearchParams(location.search);
  const status = query.get("status");

  useEffect(() => {
    if (status === "success") {
      message.success("Thanh toán thành công!");
    } else if (status === "failed") {
      message.error("Thanh toán thất bại. Vui lòng thử lại.");
    }
  }, [status]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/orders/my-order-history`);
      setOrders(res.data.items || []);
    } catch (err: any) {
      message.error(err.response?.data?.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openReviewModal = (order: any) => {
    setSelectedOrder(order);
    setReviewModal(true);
  };
const handleSubmitReview = async () => {
  try {
    // Determine product id to review. If the order has items, use the first item's legoId.
    const legoId = selectedOrder?.items?.[0]?.legoId || selectedOrder?._id;

    // Upload images first (server expects image URLs)
    const imageFiles = form.images.map((f: any) => f.originFileObj).filter(Boolean);
    let uploadedUrls: string[] = [];
    if (imageFiles.length > 0) {
      const res = await UploadAPI.uploadReviewImages(imageFiles);
      // upload API returns { success, message, data: { images: [...] } }
      uploadedUrls = res?.data?.images || res?.images || [];
    }

    await ReviewAPI.submitReview({
      legoId,
      rating: form.rating,
      comment: form.comment,
      images: uploadedUrls,
    });

    // Navigate to product page (use legoId)
    navigate("/product/" + legoId);
    message.success("Gửi đánh giá thành công!");
    setForm({ rating: 5, comment: "", images: [] });
    setReviewModal(false);
  } catch (err: any) {
    console.error(err);
    message.error(err?.response?.data?.message || "Không thể gửi đánh giá!");
  }
};

  if (loading)
    return (
      <div className="p-6">
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    );

  if (!orders.length)
    return (
      <div className="p-6">
        <Result
          status="info"
          title="Bạn chưa có đơn hàng nào"
          subTitle="Hãy mua sắm để tạo đơn hàng đầu tiên."
          extra={
            <Space>
              <Button type="primary" onClick={() => navigate("/shop")}>
                Bắt đầu mua sắm
              </Button>
              <Button onClick={() => navigate("/home")}>Về trang chủ</Button>
            </Space>
          }
        />
      </div>
    );

  return (
    <>
      <Header />
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Lịch sử đơn hàng</h2>

        <List
          dataSource={orders}
          renderItem={(order) => (
            <Card
              key={order._id}
              style={{ marginBottom: 16 }}
              title={
                <div className="flex justify-between items-center">
                  <span>Order {order.orderNumber}</span>
                  <Tag
                    color={
                      order.status === "pending"
                        ? "orange"
                        : order.status === "confirmed"
                        ? "blue"
                        : order.status === "delivered"
                        ? "green"
                        : "red"
                    }
                  >
                    {order.status}
                  </Tag>
                </div>
              }
              extra={
                <Button
                  type="link"
                  onClick={() => navigate(`/orders/detail/${order._id}`)}
                >
                  View Details
                </Button>
              }
            >
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Total">
                  {currencyFormatter.format(order.total || 0)}
                </Descriptions.Item>
                <Descriptions.Item label="Payment">
                  {order.paymentMethod} - {order.paymentStatus}
                </Descriptions.Item>
                <Descriptions.Item label="Shipping">
                  {order.shippingAddress?.address}
                </Descriptions.Item>
              </Descriptions>

              <div className="mt-3 flex gap-2">
                <Button
                  type="primary"
                  onClick={() => navigate(`/checkout-reorder/${order._id}`)}
                >
                  Reorder
                </Button>
                <Button onClick={() => openReviewModal(order)}>Review</Button>
              </div>
            </Card>
          )}
        />

        {/* 🔹 Modal Review */}
        <Modal
          open={reviewModal}
          onCancel={() => setReviewModal(false)}
          title="Submit your review"
          onOk={handleSubmitReview}
          okText="Submit"
        >
          <div style={{ marginBottom: 8 }}>
            <label>Rating:</label>
            <div className="rating" style={{ marginTop: 4 }}>
              {[1, 2, 3, 4, 5].map((r) => (
                <span
                  key={r}
                  onClick={() => setForm({ ...form, rating: r })}
                  style={{
                    cursor: "pointer",
                    fontSize: "24px",
                    color: r <= form.rating ? "#FFD700" : "#ccc",
                    marginRight: "5px",
                  }}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          <textarea
            value={form.comment}
            onChange={(e) =>
              setForm({ ...form, comment: e.target.value })
            }
            placeholder="Write your review..."
            rows={4}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ddd",
              marginBottom: "12px",
            }}
          />

          <Upload
            listType="picture-card"
            fileList={form.images}
            beforeUpload={(file) => {
              const isImage = file.type.startsWith("image/");
              if (!isImage) {
                message.error("Chỉ được upload file ảnh!");
              }
              return false; // không upload tự động
            }}
            onChange={({ fileList }) => setForm({ ...form, images: fileList })}
          >
            {form.images.length >= 4 ? null : (
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            )}
          </Upload>
        </Modal>
      </div>
    </>
  );
};

export default OrderHistoryListUser;
