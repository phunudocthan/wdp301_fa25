import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { Card, List, Button, message, Tag, Popconfirm, Descriptions } from 'antd';
import { useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'VND',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const OrderHistoryListUser: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/orders//my-order-history`);
      setOrders(res.data.items || []);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancel = async (id: string) => {
    try {
      setProcessingId(id);
      await axiosInstance.patch(`/orders/${id}`, { status: 'canceled' });
      message.success('Order canceled');
      fetchOrders();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  if (!orders.length) return <div className="p-4">You don’t have any orders yet.</div>;

  return (
    <> <Header />
    <div className="p-4"> 
     
      <h2 className="text-xl font-semibold mb-4">My Orders</h2>

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
                    order.status === 'pending'
                      ? 'orange'
                      : order.status === 'confirmed'
                      ? 'blue'
                      : order.status === 'delivered'
                      ? 'green'
                      : 'red'
                  }
                >
                  {order.status}
                </Tag>
              </div>
            }
            extra={
              <Button type="link" onClick={() => navigate(`/orders/${order._id}`)}>
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

            {order.status === 'pending' && (
              <div className="mt-3">
                <Popconfirm
                  title="Are you sure you want to cancel this order?"
                  onConfirm={() => handleCancel(order._id)}
                >
                  <Button danger loading={processingId === order._id}>
                    Cancel order
                  </Button>
                </Popconfirm>
              </div>
            )}
          </Card>
        )}
      />
    </div>
    </>
  );
};

export default OrderHistoryListUser;
