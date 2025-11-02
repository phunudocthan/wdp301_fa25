import React, { useEffect, useState } from "react";
import { Row, Col, Typography, Skeleton, Empty } from "antd";
import { useNavigate } from "react-router-dom";
import newsApi from "../../api/news";
import { getFullImageURL } from "../../api/axiosInstance";
import "../../styles/news.scss";

const { Title } = Typography;

interface NewsItem {
  _id: string;
  title: string;
  excerpt?: string;
  images?: string[];
  createdAt?: string;
  isHighlighted?: boolean;
  tags?: string[];
}

const HighlightNews: React.FC<{ limit?: number }> = ({ limit = 4 }) => {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  // current index into the highlighted items (0 = first)
  // we'll show up to three highlighted items in a single row

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await newsApi.fetchHighlighted(limit);
        const data = res?.items || res?.data || res || [];
        if (mounted) setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load highlighted news", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [limit]);

  // reset index when items change (e.g. new highlights fetched)
  // no currentIndex needed for the 3-column layout; keep hook order stable

  // Loading skeleton
  if (loading) {
    return (
      <section style={{ padding: "24px 80px" }}>
        <Title level={3} style={{ color: "#1890ff" }}>📰 Highlights</Title>
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Skeleton.Image style={{ width: "100%", height: 300 }} active />
            <Skeleton active paragraph={{ rows: 2 }} />
          </Col>
          <Col xs={24} lg={8}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1,2,3].map((k) => (
                <div key={k} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Skeleton.Avatar active size={64} />
                  <div style={{ flex: 1 }}>
                    <Skeleton active paragraph={{ rows: 1 }} />
                  </div>
                </div>
              ))}
            </div>
          </Col>
        </Row>
      </section>
    );
  }

  if (!items.length) {
    return (
      <section style={{ padding: "24px 80px" }}>
        <Title level={3} style={{ color: "#1890ff" }}>📰 Highlights</Title>
        <Empty description="No highlighted news" />
      </section>
    );
  }

  // Render up to 3 highlight cards in a single row
  const display = items.slice(0, 3);

  return (
    <section className="highlight-spotlight">
      <div className="spotlight-header">
        <h2>This week's spotlight</h2>
        <p className="lead">A closer look at LEGOs® moments worth discovering – from seasonal fun to special moments.</p>
      </div>

      <div className="spotlight-grid">
        {display.map((it, idx) => (
          <article key={it._id || idx} className="spotlight-card" onClick={() => navigate(`/news/${it._id}`)}>
            <div className="card-media">
              <img src={getFullImageURL(it?.images?.[0])} alt={it?.title || 'Highlight'} />
            </div>
            <div className="card-overlay">
              {/* Tags removed from highlights — we no longer show tags in the spotlight */}
              <h3 className="spotlight-card-title">{it.title}</h3>
              <p className="spotlight-card-excerpt">{it.excerpt}</p>
              {/* CTA removed per design: card is clickable */}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default HighlightNews;
