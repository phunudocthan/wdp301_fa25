import React, { useEffect, useState } from 'react';
import { Descriptions, List, Button, Popconfirm, message } from 'antd';
import axiosInstance from '../api/axiosInstance';
import { useParams, useNavigate } from 'react-router-dom';

type Item = { _id?: string; legoId: any; quantity: number; price: number };

const OrderDetailUser: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  const fetchOrder = async () => {
    if (!id) return;
    try {
      const res = await axiosInstance.get(`/orders/${id}`);
      setOrder(res.data.order);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to fetch order');
    } finally {
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
      message.success('Đơn hàng đã được hủy');
      fetchOrder();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setProcessing(false);
    }
  };

  if (!order) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Chi tiết đơn hàng</h2>
      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="Order #">{order.orderNumber || order._id}</Descriptions.Item>
        <Descriptions.Item label="Status">{order.status}</Descriptions.Item>
        <Descriptions.Item label="Payment">{order.paymentStatus}</Descriptions.Item>
        <Descriptions.Item label="Total">{order.total} VND</Descriptions.Item>
        <Descriptions.Item label="Shipping">{JSON.stringify(order.shippingAddress)}</Descriptions.Item>
      </Descriptions>

      <h3 className="mt-4">Items</h3>
      <List
        dataSource={order.items || []}
        renderItem={(it: Item) => (
          <List.Item>
            <div className="flex items-center gap-4">
              <div>{it.legoId?.name || it.legoId}</div>
              <div>Qty: {it.quantity}</div>
              <div>Price: {it.price} VND</div>
            </div>
          </List.Item>
        )}
      />

      <div className="mt-4">
        {order.status === 'pending' && (
          <Popconfirm title="Bạn có chắc muốn hủy đơn này?" onConfirm={handleCancel}>
            <Button danger loading={processing}>Hủy đơn</Button>
          </Popconfirm>
        )}
        <Button className="ml-2" onClick={() => navigate(-1)}>Quay lại</Button>
      </div>
    </div>
  );
};

export default OrderDetailUser;
