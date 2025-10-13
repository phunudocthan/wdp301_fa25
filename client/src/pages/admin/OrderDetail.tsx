import React, { useEffect, useState } from 'react';
import { Card, Descriptions, List, Button, message, Tag } from 'antd';
import axiosInstance from '../../api/axiosInstance';
import { useParams, useNavigate } from 'react-router-dom';

const OrderDetail: React.FC = () => {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchOrder = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/orders/${id}`);
      setOrder(res.data.order || res.data);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to fetch order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleUpdate = async (changes: any) => {
    try {
      await axiosInstance.patch(`/orders/${id}`, changes);
      message.success('Order updated');
      fetchOrder();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to update order');
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (!order) return <div className="p-4">Order not found</div>;

  return (
    <div className="admin-container p-4">
      <Button onClick={() => navigate('/admin/orders')}>Back to orders</Button>
      <h2 className="text-xl font-semibold my-4">Order {order.orderNumber || order._id}</h2>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={1} bordered>
          <Descriptions.Item label="Customer">{order.user?.name} ({order.user?.email})</Descriptions.Item>
          <Descriptions.Item label="Shipping">{order.shippingAddress?.address}</Descriptions.Item>
          <Descriptions.Item label="Payment">{order.paymentMethod} - {order.paymentStatus}</Descriptions.Item>
          <Descriptions.Item label="Status">
            {(() => {
              const s = order.status;
              const color = s === 'pending' ? 'orange' : s === 'shipped' ? 'blue' : s === 'canceled' ? 'red' : 'green';
              return <Tag color={color}>{s}</Tag>;
            })()}
          </Descriptions.Item>
          <Descriptions.Item label="Total">{order.total} VND</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Items" style={{ marginBottom: 16 }}>
        <List
          dataSource={order.items || []}
          renderItem={(item: any) => (
            <List.Item>
              <div className="flex items-center gap-4">
                <img src={item.image} alt={item.name} style={{ width: 72, height: 72, objectFit: 'cover' }} />
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div>Qty: {item.quantity}</div>
                  <div>Price: {item.price} VND</div>
                </div>
              </div>
            </List.Item>
          )}
        />
      </Card>

      <Card title="Actions">
        <Button onClick={() => handleUpdate({ status: 'shipped' })} style={{ marginRight: 8 }}>Mark shipped</Button>
        <Button danger onClick={() => handleUpdate({ status: 'canceled' })}>Cancel order</Button>
      </Card>
    </div>
  );
};

export default OrderDetail;
