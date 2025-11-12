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
  views?: number;
}

const TrendingNews: React.FC<{ limit?: number }> = ({ limit = 5 }) => {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await newsApi.fetchTrending(limit);
        const data = res?.items || res?.data || res || [];
        if (mounted) setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load trending news", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [limit]);

  if (loading) {
    return (
      <section className="trending-section">
        <Title level={3} style={{ color: "var(--primary)" }}>🔥 Trending</Title>
        <Row gutter={[16, 16]}>
          {[1,2,3].map((i) => (
            <Col key={i} xs={24} sm={12} md={8} lg={6}>
              <Skeleton active paragraph={{ rows: 3 }} />
            </Col>
          ))}
        </Row>
      </section>
    );
  }

  if (!items.length) {
    return (
      <section className="trending-section">
        <Title level={3} style={{ color: "var(--primary)" }}>🔥 Trending</Title>
        <Empty description="No trending news" />
      </section>
    );
  }

  const hero = items[0];
  const topRight = items[1];
  // hero + topRight + three small = up to 5
  const bottoms = items.slice(2, 5);

  return (
    <section className="trending-section">
      <div className="trending-inner">
        <div className="trending-header">
        <Title level={3} style={{ margin: 0, color: "var(--primary)" }}>🔥 Trending</Title>
        <p className="lead">Most-read articles this week based on views and engagement.</p>
      </div>

      {/* Top row: two equal cards side-by-side */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          {hero && (
            <article className="trending-top-card" onClick={() => navigate(`/news/${hero._id}`)}>
              <div className="top-media">
                <img src={getFullImageURL(hero.images?.[0])} alt={hero.title} />
              </div>
              <div className="top-body">
                <h3 className="top-title">{hero.title}</h3>
                <p className="top-excerpt">{hero.excerpt}</p>
                <div className="top-meta">{typeof hero.views === 'number' ? `${hero.views} views` : ''}</div>
              </div>
            </article>
          )}
        </Col>

        <Col xs={24} lg={12}>
          {topRight && (
            <article className="trending-top-card" onClick={() => navigate(`/news/${topRight._id}`)}>
              <div className="top-media">
                <img src={getFullImageURL(topRight.images?.[0])} alt={topRight.title} />
              </div>
              <div className="top-body">
                <h3 className="top-title">{topRight.title}</h3>
                <p className="top-excerpt">{topRight.excerpt}</p>
                <div className="top-meta">{typeof topRight.views === 'number' ? `${topRight.views} views` : ''}</div>
              </div>
            </article>
          )}
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {bottoms.map((it) => (
          <Col key={it._id} xs={24} sm={8} lg={8}>
            <div className="trending-small-card" onClick={() => navigate(`/news/${it._id}`)}>
              <div className="small-media">
                <img src={getFullImageURL(it.images?.[0])} alt={it.title} />
              </div>
              <div className="small-body">
                <div className="small-title">{it.title}</div>
                <div className="small-meta">{typeof it.views === 'number' ? `${it.views} views` : ''}</div>
              </div>
            </div>
          </Col>
        ))}
      </Row>
      </div>
    </section>
  );
};

export default TrendingNews;
