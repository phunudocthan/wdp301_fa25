import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import {
  Card,
  Descriptions,
  List,
  Button,
  message,
  Tag,
  Popconfirm,
  Result,
  Empty,
  Skeleton,
  Space,
  Row,
  Col,
  Typography,
} from "antd";
import { useParams, useNavigate } from "react-router-dom";
import Header from '../components/common/Header';

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "VND",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const OrderDetailUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const fetchOrder = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/orders/${id}/user`);
      setOrder(res.data?.order || null);
    } catch (err) {
      console.error("Failed to fetch order", err);
      message.error(err?.response?.data?.error || "Failed to fetch order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleCancel = async () => {
    if (!order) return;
    setProcessing(true);
    try {
      await axiosInstance.patch(`/orders/${order._id}`, { status: "canceled" });
      message.success("Order canceled");
      fetchOrder();
    } catch (err) {
      console.error("Cancel failed", err);
      message.error(err?.response?.data?.error || "Failed to cancel order");
    } finally {
      setProcessing(false);
    }
  };

  if (loading)
    return (
      <div className="p-6">
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    );

  if (!order)
    return (
      <div className="p-6">
        <Result
          status="404"
          title="Order not found"
          subTitle="We couldn't find this order in your history. It may have been removed or the link is invalid."
          extra={
            <Space>
              <Button onClick={() => navigate(-1)}>Go back</Button>
              <Button type="primary" onClick={() => navigate('/orders')}
              >
                View my orders
              </Button>
            </Space>
          }
        />
      </div>
    );

  return (
    <>
     
      <div className="admin-container p-4">
        <Button onClick={() => navigate(-1)} style={{ marginBottom: 12 }}>
          Back
        </Button>

        <div className="mb-4">
          <Typography.Title level={4} className="m-0">
            Order {order.orderNumber || order._id}
          </Typography.Title>
          <Typography.Text type="secondary">
            Created at: {new Date(order.createdAt).toLocaleString()}
          </Typography.Text>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Card style={{ marginBottom: 16 }}>
              <Descriptions column={1} bordered>
                <Descriptions.Item label="Shipping">
                  {order.shippingAddress?.fullName ? (
                    <div>
                      <div style={{ fontWeight: 600 }}>{order.shippingAddress.fullName}</div>
                      <div>{order.shippingAddress.phone}</div>
                      <div>
                        {order.shippingAddress.street}, {order.shippingAddress.ward || ""} {order.shippingAddress.district || ""}, {order.shippingAddress.city || ""}
                      </div>
                      {order.shippingAddress.note && (
                        <div>Note: {order.shippingAddress.note}</div>
                      )}
                    </div>
                  ) : (
                    <Empty description="No shipping address" />
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Payment">
                  {order.paymentMethod} - {order.paymentStatus}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  {(() => {
                    const s = order.status;
                    const color =
                      s === "pending"
                        ? "orange"
                        : s === "shipped"
                        ? "blue"
                        : s === "canceled"
                        ? "red"
                        : "green";
                    return <Tag color={color}>{s}</Tag>;
                  })()}
                </Descriptions.Item>
                <Descriptions.Item label="Total">
                  {currencyFormatter.format(order.total || 0)}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="Items" style={{ marginBottom: 16 }}>
              {(!order.items || order.items.length === 0) && <Empty description="No items" />}
              <List
                dataSource={order.items || []}
                renderItem={(item) => (
                  <List.Item>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{ width: 72, height: 72, objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{ width: 72, height: 72, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography.Text type="secondary">No image</Typography.Text>
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {item.name || item.legoId?.name || String(item.legoId)}
                        </div>
                        <div>Qty: {item.quantity}</div>
                        <div>Price: {currencyFormatter.format(item.price || 0)}</div>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card title="Actions">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Order total</div>
                  <div style={{ fontSize: 18 }}>{currencyFormatter.format(order.total || 0)}</div>
                </div>

                {order.status === "pending" && (
                  <Popconfirm
                    title="Are you sure you want to cancel this order?"
                    onConfirm={handleCancel}
                  >
                    <Button danger loading={processing} block>
                      Cancel order
                    </Button>
                  </Popconfirm>
                )}

                <Button onClick={() => navigate(-1)} block>
                  Back
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default OrderDetailUser;
