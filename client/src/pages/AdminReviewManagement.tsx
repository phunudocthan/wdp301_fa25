import { useEffect, useState } from "react";
import ReviewAPI from "../api/review";
import axios from "../api/axiosInstance";
import {
  message,
  Table,
  Input,
  Select,
  Button,
  Tag,
  Space,
  Modal,
  Card,
  Spin,
} from "antd";

const { Search } = Input;
const { Option } = Select;
const { confirm } = Modal;

export default function AdminReviewManagement() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({ status: "", q: "" });

  // 🧭 Load data khi filter thay đổi
  useEffect(() => {
    loadReviews();
  }, [filter]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const res = await ReviewAPI.adminGetReviews(filter);
      setReviews(res.data || []);
    } catch (err) {
      console.error("Admin load reviews", err);
      message.error("Không thể tải đánh giá");
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (id: string) => {
    let replyText = "";
    Modal.confirm({
      title: "Trả lời đánh giá",
      content: (
        <Input.TextArea
          rows={3}
          placeholder="Nhập nội dung trả lời..."
          onChange={(e) => (replyText = e.target.value)}
        />
      ),
      okText: "Gửi",
      cancelText: "Hủy",
      onOk: async () => {
        if (!replyText.trim()) return message.warning("Vui lòng nhập nội dung!");
        try {
          await ReviewAPI.replyReview(id, replyText.trim());
          message.success("Đã trả lời đánh giá");
          loadReviews();
        } catch (err) {
          message.error("Lỗi khi trả lời");
        }
      },
    });
  };

  const changeStatus = async (id: string, status: string) => {
    confirm({
      title: "Xác nhận thay đổi trạng thái",
      content: `Bạn có chắc muốn chuyển trạng thái đánh giá này sang "${status}"?`,
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await axios.patch(`/reviews/${id}/status`, { status });
          message.success("Cập nhật trạng thái thành công");
          loadReviews();
        } catch (err) {
          message.error("Không thể cập nhật trạng thái");
        }
      },
    });
  };

  const columns = [
    {
      title: "Người dùng",
      dataIndex: ["userId", "name"],
      key: "user",
      render: (name: string) => name || "Unknown",
    },
    {
      title: "Sản phẩm",
      dataIndex: ["legoId", "name"],
      key: "lego",
      render: (name: string) => name || "N/A",
    },
    {
      title: "Bình luận",
      dataIndex: "comment",
      key: "comment",
      render: (text: string) => (
        <div style={{ whiteSpace: "pre-line" }}>{text}</div>
      ),
    },
    {
      title: "Phản hồi",
      key: "replies",
      render: (r: any) =>
        r.replies && r.replies.length > 0 ? (
          <div style={{ fontSize: 13 }}>
            {r.replies.map((reply: any, i: number) => (
              <div key={i} style={{ marginBottom: 4 }}>
                💬 <b>Admin:</b> {reply.message}{" "}
                <span style={{ color: "#999" }}>
                  ({new Date(reply.createdAt).toLocaleDateString()})
                </span>
              </div>
            ))}
          </div>
        ) : (
          <Tag color="default">Chưa trả lời</Tag>
        ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const color =
          status === "visible"
            ? "green"
            : status === "hidden"
            ? "red"
            : status === "reported"
            ? "orange"
            : "default";
        return <Tag color={color}>{status || "N/A"}</Tag>;
      },
    },
    {
      title: "Hành động",
      key: "action",
      render: (r: any) => (
        <Space>
          <Button type="primary" onClick={() => handleReply(r._id)}>
            Trả lời
          </Button>
          {/* <Button onClick={() => changeStatus(r._id, "visible")}>Hiện</Button>
          <Button danger onClick={() => changeStatus(r._id, "hidden")}>
            Ẩn
          </Button> */}
        </Space>
      ),
    },
  ];

  return (
    <Card title="📝 Quản lý đánh giá" bordered style={{ margin: 20 }}>
      {/* 🔍 Thanh search và filter */}
      <Space style={{ marginBottom: 16 }}>
        <Search
          placeholder="Tìm kiếm theo nội dung..."
          allowClear
          onSearch={(value) => setFilter({ ...filter, q: value })}
          onChange={(e) => setFilter({ ...filter, q: e.target.value })}
          style={{ width: 250 }}
        />
        <Select
          placeholder="Lọc trạng thái"
          value={filter.status}
          onChange={(value) => setFilter({ ...filter, status: value })}
          style={{ width: 180 }}
          allowClear
        >
          <Option value="">Tất cả</Option>
          {/* <Option value="visible">Hiển thị</Option>
          <Option value="hidden">Ẩn</Option>
          <Option value="reported">Báo cáo</Option> */}
        </Select>
        <Button type="primary" onClick={loadReviews}>
          Làm mới
        </Button>
      </Space>

      {/* 🧾 Bảng dữ liệu */}
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={reviews}
          rowKey="_id"
          pagination={{ pageSize: 6 }}
          bordered
        />
      </Spin>
    </Card>
  );
}
