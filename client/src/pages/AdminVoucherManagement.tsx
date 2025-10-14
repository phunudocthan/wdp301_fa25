import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import {
    Table,
    Button,
    Modal,
    Form,
    Input,
    Select,
    message,
    Space,
    Card,
    Typography,
    DatePicker,
} from "antd";
// ...existing code...
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
} from "@ant-design/icons";
import VoucherAdminAPI from "../api/voucherAdmin";

const { Option } = Select;
const { Title } = Typography;

const AdminVoucherManagement = () => {
    const [vouchers, setVouchers] = useState<any[]>([]); // Nếu có type Voucher thì dùng: useState<Voucher[]>([])
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingVoucher, setEditingVoucher] = useState(null);
    const [form] = Form.useForm();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);

    // Fetch vouchers
    const fetchVouchers = async (currentPage = 1) => {
        try {
            setLoading(true);
            const res = await VoucherAdminAPI.getVouchers({
                search: searchTerm,
                status: statusFilter === "all" ? undefined : statusFilter,
                page: currentPage,
                limit: pageSize,
            });
            setVouchers(res.data.vouchers || []);
            setTotal(res.data.pagination?.totalVouchers || 0);
        } catch (err) {
            console.error(err);
            message.error("Failed to load vouchers!");
        } finally {
            setLoading(false);
        }
    };

// ...existing code...

    useEffect(() => {
        fetchVouchers();
    }, [statusFilter]);

    const handleSearch = () => {
        fetchVouchers(1);
    };

    const openModal = (voucher = null) => {
        setEditingVoucher(voucher);
        if (typeof voucher === 'object' && voucher !== null) {
            const values = { ...voucher };
            if (values.expiryDate) {
                values.expiryDate = dayjs(values.expiryDate);
            }
            form.setFieldsValue(values);
        } else {
            form.resetFields();
        }
        setIsModalVisible(true);
    };

    const handleDelete = async (id: string) => {
        Modal.confirm({
            title: "Are you sure you want to delete this voucher?",
            onOk: async () => {
                try {
                    await VoucherAdminAPI.deleteVoucher(id);
                    message.success("Voucher deleted successfully!");
                    fetchVouchers(page);
                } catch (err) {
                    console.error(err);
                    message.error("Failed to delete voucher!");
                }
            },
        });
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            // Convert DatePicker value to ISO string
            if (values.expiryDate && values.expiryDate.toISOString) {
                values.expiryDate = values.expiryDate.toISOString();
            }
            // Ensure correct field names
            const payload = {
                code: String(values.code).toUpperCase().trim(),
                discountPercent: Number(values.discountPercent),
                usageLimit: Number(values.usageLimit),
                status: values.status,
                expiryDate: values.expiryDate,
            };
            if (editingVoucher && (editingVoucher as any)._id) {
                await VoucherAdminAPI.updateVoucher((editingVoucher as any)._id, payload);
                message.success("Voucher updated successfully!");
            } else {
                await VoucherAdminAPI.createVoucher(payload);
                message.success("Voucher created successfully!");
            }
            setIsModalVisible(false);
            fetchVouchers();
        } catch (err: any) {
            console.error(err);
            if (err?.response?.data?.message) {
                message.error(err.response.data.message);
            } else {
                message.error("Failed to save voucher!");
            }
        }
    };

    const handleStatusChange = async (id: string, status: string) => {
        try {
            await VoucherAdminAPI.updateVoucherStatus(id, status);
            message.success("Status updated!");
            fetchVouchers(page);
        } catch (err) {
            console.error(err);
            message.error("Failed to update status!");
        }
    };

    const columns = [
        { title: "Code", dataIndex: "code", key: "code" },
        { title: "Discount (%)", dataIndex: "discountPercent", key: "discountPercent" },
        { title: "Usage Limit", dataIndex: "usageLimit", key: "usageLimit" },
        { title: "Status", dataIndex: "status", key: "status",
            render: (text: string, record: any) => (
                <Select
                    value={text}
                    style={{ width: 120 }}
                    onChange={status => handleStatusChange(record._id, status)}
                >
                    <Option value="active">Active</Option>
                    <Option value="expired">Expired</Option>
                    <Option value="disabled">Disabled</Option>
                </Select>
            )
        },
        { title: "Expiry Date", dataIndex: "expiryDate", key: "expiryDate" },
        {
            title: "Actions",
            key: "actions",
            render: (_: any, record: any) => (
                <Space>
                    <Button
                        icon={<EditOutlined />}
                        type="link"
                        onClick={() => openModal(record)}
                    />
                    <Button
                        icon={<DeleteOutlined />}
                        danger
                        type="link"
                        onClick={() => handleDelete(record._id)}
                    />
                </Space>
            ),
        },
    ];

    const navigate = useNavigate();
    return (
        <div style={{ background: "#f5f6fa", minHeight: "100vh", padding: "24px 0" }}>
            {/* Back Button */}
            <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
                <Button
                    onClick={() => navigate('/admin/dashboard')}
                    style={{ background: '#e5e7eb', color: '#374151', borderRadius: 6 }}
                >
                    ← Quay về Admin Dashboard
                </Button>
                <Button
                    onClick={() => navigate('/admin/voucher-statistics')}
                    style={{ background: '#e5e7eb', color: '#374151', borderRadius: 6 }}
                >
                    Xem thống kê voucher
                </Button>
            </div>
            <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px" }}>
                <Card style={{ borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                    <Title level={4} style={{ marginBottom: 24 }}>
                        Voucher Management
                    </Title>
                    <div style={{ marginBottom: 16, color: '#555' }}>Total vouchers: {total}</div>
                    <Space style={{ marginBottom: 16, flexWrap: "wrap" }}>
                        <Input
                            placeholder="Search by code"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            suffix={<SearchOutlined onClick={handleSearch} />}
                            onPressEnter={handleSearch}
                            allowClear
                            style={{ width: 220 }}
                        />
                        <Select
                            value={statusFilter}
                            onChange={(v) => setStatusFilter(v)}
                            style={{ width: 140 }}
                        >
                            <Option value="all">All</Option>
                            <Option value="active">Active</Option>
                            <Option value="expired">Expired</Option>
                            <Option value="disabled">Disabled</Option>
                        </Select>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => openModal()}
                        >
                            Create Voucher
                        </Button>
                    </Space>
                    <Table
                        columns={columns}
                        dataSource={vouchers}
                        loading={loading}
                        rowKey="_id"
                        size="middle"
                        bordered={false}
                        pagination={{
                            current: page,
                            pageSize,
                            total,
                            showSizeChanger: true,
                            onChange: (p, s) => {
                                setPage(p);
                                setPageSize(s);
                                fetchVouchers(p);
                            },
                        }}
                    />
                </Card>
            </div>
            {/* Modal */}
            <Modal
                title={editingVoucher ? "Edit Voucher" : "Create Voucher"}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={handleSubmit}
                okText="Save"
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="code"
                        label="Code"
                        rules={[{ required: true, message: "Please enter code" }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="discountPercent"
                        label="Discount (%)"
                        rules={[{ required: true, message: "Please enter discount" }, {
                            validator: (_, value) => {
                                const num = Number(value);
                                if (isNaN(num)) return Promise.reject("Discount must be a number");
                                if (num < 0 || num > 100) return Promise.reject("Discount must be 0-100");
                                return Promise.resolve();
                            }
                        }]}
                    >
                        <Input type="number" min={0} max={100} />
                    </Form.Item>
                    <Form.Item
                        name="usageLimit"
                        label="Usage Limit"
                        rules={[{ required: true, message: "Please enter usage limit" }]}
                    >
                        <Input type="number" min={1} />
                    </Form.Item>
                    <Form.Item
                        name="status"
                        label="Status"
                        rules={[{ required: true, message: "Please select status" }]}
                    >
                        <Select>
                            <Option value="active">Active</Option>
                            <Option value="expired">Expired</Option>
                            <Option value="disabled">Disabled</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="expiryDate"
                        label="Expiry Date"
                        rules={[
                            { required: true, message: "Please enter expiry date" },
                            {
                                validator: (_, value) => {
                                    if (!value) return Promise.resolve();
                                    const today = new Date();
                                    const expDate = value && value.toDate ? value.toDate() : new Date(value);
                                    if (expDate.getTime() < today.setHours(0, 0, 0, 0)) {
                                        return Promise.reject("Expiry date cannot be in the past");
                                    }
                                    return Promise.resolve();
                                }
                            }
                        ]}
                    >
                        <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" disabledDate={d => d && d.isBefore(new Date(), 'day')} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default AdminVoucherManagement;
