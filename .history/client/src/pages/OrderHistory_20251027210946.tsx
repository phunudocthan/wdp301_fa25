import React, { useEffect, useState } from 'react';
import { Table, message } from 'antd';
import { ColumnsType } from 'antd/es/table';
import axiosInstance from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';

type OrderRow = {
  _id: string;
  orderNumber?: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt?: string;
};

const OrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  const fetchMyOrders = async (p = page, limit = pageSize) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/orders/my?page=${p}&limit=${limit}`);
      setOrders(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOrders(1, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns: ColumnsType<OrderRow> = [
    {
      title: 'Order #',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text, record) => (
        <a onClick={() => navigate(`/orders/${record._id}`)}>{text || record._id}</a>
      ),
    },
    { title: 'Total', dataIndex: 'total', key: 'total', render: (v) => `${v} VND` },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    { title: 'Payment', dataIndex: 'paymentStatus', key: 'paymentStatus' },
    { title: 'Created', dataIndex: 'createdAt', key: 'createdAt' },
  ];

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Đơn hàng của tôi</h2>
      <Table
        rowKey={(r) => r._id}
        columns={columns}
        dataSource={orders}
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: (p, size) => {
            setPage(p);
            setPageSize(size || 10);
            fetchMyOrders(p, size || 10);
          },
        }}
      />
    </div>
  );
};

export default OrderHistory;
