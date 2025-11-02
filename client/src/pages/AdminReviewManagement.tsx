import { useEffect, useState } from 'react';
import ReviewAPI from '../api/review';
import axios from '../api/axiosInstance';
import { message } from 'antd';

export default function AdminReviewManagement() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({ status: '', q: '' });

  const loadReviews = async () => {
    try {
      setLoading(true);
      const res = await ReviewAPI.adminGetReviews(filter);
      setReviews(res.data || []);
    } catch (err) {
      console.error('Admin load reviews', err);
      message.error('Không thể tải đánh giá');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReviews(); }, []);

  const handleReply = async (id: string) => {
    const text = window.prompt('Reply message');
    if (!text) return;
    try {
      await ReviewAPI.replyReview(id, text);
      message.success('Đã trả lời');
      loadReviews();
    } catch (err) { message.error('Lỗi khi trả lời'); }
  };

  const changeStatus = async (id: string, status: string) => {
    try {
      await axios.patch(`/reviews/${id}/status`, { status });
      message.success('Status updated');
      loadReviews();
    } catch (err) { message.error('Cannot update status'); }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Admin Review Management</h2>
        <div style={{ marginBottom: 12 }}>
        <input placeholder="Search..." value={filter.q} onChange={(e) => setFilter({ ...filter, q: e.target.value })} />
        <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
          <option value="">Any</option>
          <option value="visible">Visible</option>
          <option value="hidden">Hidden</option>
          <option value="reported">Reported</option>
        </select>
  <button onClick={loadReviews}>Filter</button>
      </div>

      {loading ? <p>Loading...</p> : (
        <div>
          {reviews.map(r => (
            <div key={r._id} style={{ border: '1px solid #eee', padding: 12, marginBottom: 8 }}>
              <div><strong>{r.userId?.name}</strong> — {r.legoId?.name}</div>
              <div>{r.comment}</div>
              <div>Status: {r.status}</div>
              <div style={{ marginTop: 8 }}>
                <button onClick={() => handleReply(r._id)}>Reply</button>
                <button onClick={() => changeStatus(r._id, 'hidden')}>Hide</button>
                <button onClick={() => changeStatus(r._id, 'visible')}>Show</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
