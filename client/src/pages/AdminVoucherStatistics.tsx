import { Table, Tag, Typography, Card, Row, Col, Statistic } from "antd";
import dayjs from "dayjs";
import { Bar } from '@ant-design/charts';
import { useAuth } from '../components/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import React from "react";

const { Title } = Typography;

const vouchers = [
  { code: "SALE2025", discount: 20, used: 15, expiry: "2025-12-31", status: "active" },
  { code: "WELCOME", discount: 10, used: 50, expiry: "2025-11-30", status: "expired" },
  { code: "FREESHIP", discount: 0, used: 120, expiry: "2025-12-15", status: "active" },
  { code: "VIP2025", discount: 30, used: 5, expiry: "2025-10-31", status: "expired" },
];

const columns = [
  { title: "Mã Voucher", dataIndex: "code", key: "code" },
  { title: "Giảm (%)", dataIndex: "discount", key: "discount" },
  { title: "Số lượt dùng", dataIndex: "used", key: "used" },
  {
    title: "Ngày hết hạn",
    dataIndex: "expiry",
    key: "expiry",
    render: (expiry: string) => dayjs(expiry).format("DD/MM/YYYY"),
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    key: "status",
    render: (status: string) => (
      <Tag color={status === "active" ? "green" : "red"}>
        {status === "active" ? "Đang hoạt động" : "Hết hạn"}
      </Tag>
    ),
  },
];

export default function AdminVoucherStatistics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  // Chuyển hướng nếu không phải admin
  React.useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
    }
  }, [user, navigate]);
  if (!user || user.role !== 'admin') return null;
  const barData = vouchers.map(v => ({ code: v.code, used: v.used }));
  const barConfig = {
    data: barData,
    xField: 'code',
    yField: 'used',
    color: '#1890ff',
    label: { position: 'middle', style: { fill: '#fff' } },
    xAxis: { title: { text: 'Mã Voucher' } },
    yAxis: { title: { text: 'Số lượt dùng' } },
    height: 300,
    autoFit: true,
  };
  const totalVouchers = vouchers.length;
  const totalUsed = vouchers.reduce((sum, v) => sum + v.used, 0);

  return (
    <Card style={{ maxWidth: 900, margin: "32px auto" }}>
      <Title level={3}>Thống kê Voucher (Static)</Title>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Statistic title="Tổng số voucher" value={totalVouchers} />
        </Col>
        <Col span={8}>
          <Statistic title="Tổng lượt dùng" value={totalUsed} />
        </Col>
        <Col span={8}>
          <Statistic title="Voucher đang hoạt động" value={vouchers.filter(v => v.status === "active").length} />
        </Col>
      </Row>
      <div style={{ marginBottom: 32 }}>
        <Title level={5} style={{ marginBottom: 16 }}>Biểu đồ lượt dùng từng voucher</Title>
        <Bar {...barConfig} />
      </div>
      <Table
        columns={columns}
        dataSource={vouchers}
        rowKey="code"
        pagination={false}
      />
    </Card>
  );
}
