import React, { useEffect, useState } from 'react';
import { Descriptions, List, Button, Popconfirm, message } from 'antd';
import axiosInstance from '../api/axiosInstance';
import React, { useEffect, useState } from 'react';
import { Card, Descriptions, List, Button, message, Tag, Popconfirm } from 'antd';
import axiosInstance from '../api/axiosInstance';
import { useParams, useNavigate } from 'react-router-dom';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'VND',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const OrderDetailUser: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

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

  const handleCancel = async () => {
    if (!id) return;
    try {
      setProcessing(true);
      await axiosInstance.patch(`/orders/${id}`, { status: 'canceled' });
      message.success('Order canceled');
      fetchOrder();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (!order) return <div className="p-4">Order not found</div>;

  return (
    <div className="admin-container p-4">
      <Button onClick={() => navigate('/orders')}>Back to orders</Button>
      <h2 className="text-xl font-semibold my-4">Order {order.orderNumber || order._id}</h2>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={1} bordered>
          <Descriptions.Item label="Shipping">{order.shippingAddress?.address || JSON.stringify(order.shippingAddress)}</Descriptions.Item>
          <Descriptions.Item label="Payment">{order.paymentMethod} - {order.paymentStatus}</Descriptions.Item>
          <Descriptions.Item label="Status">
            {(() => {
              const s = order.status;
              const color = s === 'pending' ? 'orange' : s === 'shipped' ? 'blue' : s === 'canceled' ? 'red' : 'green';
              return <Tag color={color}>{s}</Tag>;
            })()}
          </Descriptions.Item>
          <Descriptions.Item label="Total">{currencyFormatter.format(order.total || 0)}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Items" style={{ marginBottom: 16 }}>
        <List
          dataSource={order.items || []}
          renderItem={(item: any) => (
            <List.Item>
              <div className="flex items-center gap-4">
                {item.image && (
                  <img src={item.image} alt={item.name} style={{ width: 72, height: 72, objectFit: 'cover' }} />
                )}
                <div>
                  <div className="font-medium">{item.name || item.legoId?.name || item.legoId}</div>
                  <div>Qty: {item.quantity}</div>
                  <div>Price: {currencyFormatter.format(item.price || 0)}</div>
                </div>
              </div>
            </List.Item>
          )}
        />
      </Card>

      <Card title="Actions">
        {order.status === 'pending' && (
          <Popconfirm title="Are you sure you want to cancel this order?" onConfirm={handleCancel}>
            <Button danger loading={processing}>Cancel order</Button>
          </Popconfirm>
        )}
      </Card>
    </div>
  );
};

export default OrderDetailUser;
