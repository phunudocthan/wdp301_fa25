import React, { useCallback, useEffect, useState } from 'react';
import { Table, Button, Popconfirm, Tag, notification, message, Select } from 'antd';
import { ColumnsType } from 'antd/es/table';
import axiosInstance from '../../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { EyeOutlined, CloseOutlined, SwapRightOutlined, ShoppingOutlined } from '@ant-design/icons';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

type Order = {
  _id: string;
  orderNumber?: string;
  user?: { name?: string; email?: string } | string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt?: string;
};

const STATUS_OPTIONS = [
  { label: 'All statuses', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'canceled' },
  { label: 'Refunded', value: 'refunded' },
];

const OrdersList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const navigate = useNavigate();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page,
        limit: pageSize,
      };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const res = await axiosInstance.get('/orders', { params });
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
  }, [page, pageSize, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleChangeStatus = async (id: string, nextStatus: string) => {
    try {
      setProcessing((s) => ({ ...s, [id]: true }));
      const res = await axiosInstance.patch(`/orders/${id}`, { status: nextStatus });
      const updated = res.data.order || res.data;
      notification.success({
        message: `Order ${updated.orderNumber || id} updated`,
        description: `Status changed to ${updated.status}`,
        placement: 'topRight',
        duration: 3,
      });
      fetchOrders();
    } catch (err: any) {
      notification.error({
        message: 'Update failed',
        description: err.response?.data?.message || err.message || 'Failed to update order',
        placement: 'topRight',
      });
    } finally {
      setProcessing((s) => ({ ...s, [id]: false }));
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
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (value: number) => currencyFormatter.format(value || 0),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    render: (s) => {
      // show canceled orders in red, pending orange, shipped blue, others green
      const color = s === 'pending' ? 'orange' : s === 'shipped' ? 'blue' : s === 'canceled' ? 'red' : 'green';
      return <Tag color={color}>{s}</Tag>;
    },
    },
    { title: 'Payment', dataIndex: 'paymentStatus', key: 'paymentStatus' },
    { title: 'Created', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: any) => {
        const status = record.status;

        const actions: React.ReactNode[] = [];

        // always allow view
        actions.push(
          <Button size="small" key="view" onClick={() => navigate(`/admin/orders/${record._id}`)} icon={<EyeOutlined />}>
            View
          </Button>
        );

        // define allowed client-side actions to match server allowedTransitions
        if (status === 'pending') {
          actions.push(
            <Popconfirm key="confirm" title="Confirm this order?" onConfirm={() => handleChangeStatus(record._id, 'confirmed')}>
              <Button size="small" type="primary" loading={!!processing[record._id]}>Confirm</Button>
            </Popconfirm>
          );
          actions.push(
            <Popconfirm key="cancel" title="Cancel this order?" onConfirm={() => handleChangeStatus(record._id, 'canceled')}>
              <Button danger size="small" loading={!!processing[record._id]} icon={<CloseOutlined />}>Cancel</Button>
            </Popconfirm>
          );
        } else if (status === 'confirmed') {
          actions.push(
            <Popconfirm key="ship" title="Mark as shipped?" onConfirm={() => handleChangeStatus(record._id, 'shipped')}>
              <Button size="small" type="default" loading={!!processing[record._id]} icon={<ShoppingOutlined />}>Ship</Button>
            </Popconfirm>
          );
          actions.push(
            <Popconfirm key="cancel2" title="Cancel this order?" onConfirm={() => handleChangeStatus(record._id, 'canceled')}>
              <Button danger size="small" loading={!!processing[record._id]} icon={<CloseOutlined />}>Cancel</Button>
            </Popconfirm>
          );
        } else if (status === 'shipped') {
          actions.push(
            <Popconfirm key="deliver" title="Mark as delivered?" onConfirm={() => handleChangeStatus(record._id, 'delivered')}>
              <Button size="small" type="primary" loading={!!processing[record._id]} icon={<SwapRightOutlined />}>Deliver</Button>
            </Popconfirm>
          );
        }

        return <div className="flex gap-2">{actions}</div>;
      },
    },
  ];

  const handleStatusFilterChange = (value: string) => {
    setPage((prev) => (prev === 1 ? prev : 1));
    setStatusFilter(value);
  };

  return (
    <div className="admin-container p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-semibold">Orders</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Filter by status:</span>
          <Select
            value={statusFilter}
            style={{ width: 180 }}
            onChange={handleStatusFilterChange}
            options={STATUS_OPTIONS}
          />
        </div>
      </div>
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
          },
        }}
      />
    </div>
  );
};

export default OrdersList;
