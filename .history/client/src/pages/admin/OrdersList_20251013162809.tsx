import React, { useEffect, useState } from 'react';
import { Table, Button, Popconfirm, message, Tag } from 'antd';
import { ColumnsType } from 'antd/es/table';
import axiosInstance from '../../api/axiosInstance';
import { useNavigate } from 'react-router-dom';

type Order = {
  _id: string;
  orderNumber?: string;
  user?: { name?: string; email?: string } | string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt?: string;
};

const OrdersList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  const fetchOrders = async (p = page, limit = pageSize) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/orders?page=${p}&limit=${limit}`);
      // server returns { items, total, page, pageSize }
      const items = res.data.items || [];
      // normalize customer field: if userId present show id or name/email if available
      const normalized = items.map((it: any) => ({
        ...it,
        user: it.user || it.userId || it.userId?._id || (typeof it.userId === 'object' ? it.userId : it.userId),
      }));
      setOrders(normalized);
      setTotal(res.data.total || 0);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChangeStatus = async (id: string, nextStatus: string) => {
    try {
      await axiosInstance.patch(`/orders/${id}`, { status: nextStatus });
      message.success('Order updated');
      fetchOrders(page, pageSize);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to update order');
    }
  };

  const columns: ColumnsType<Order> = [
    {
      title: 'Order #',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text, record) => (
        <a onClick={() => navigate(`/admin/orders/${record._id}`)}>{text || record._id}</a>
      ),
    },
    {
      title: 'Customer',
      dataIndex: 'user',
      key: 'user',
      render: (u) => (typeof u === 'string' ? u : `${u?.name || ''} (${u?.email || ''})`),
    },
    { title: 'Total', dataIndex: 'total', key: 'total', render: (v) => `${v} VND` },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s) => <Tag color={s === 'pending' ? 'orange' : s === 'shipped' ? 'blue' : 'green'}>{s}</Tag>,
    },
    { title: 'Payment', dataIndex: 'paymentStatus', key: 'paymentStatus' },
    { title: 'Created', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div className="flex gap-2">
          <Button size="small" onClick={() => navigate(`/admin/orders/${record._id}`)}>
            View
          </Button>
          <Popconfirm
            title="Mark as shipped?"
            onConfirm={() => handleChangeStatus(record._id, 'shipped')}
          >
            <Button size="small">Ship</Button>
          </Popconfirm>
          <Popconfirm
            title="Cancel this order?"
            onConfirm={() => handleChangeStatus(record._id, 'canceled')}
          >
            <Button danger size="small">
              Cancel
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-container p-4">
      <h2 className="text-xl font-semibold mb-4">Orders</h2>
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
            fetchOrders(p, size || 10);
          },
        }}
      />
    </div>
  );
};

export default OrdersList;
