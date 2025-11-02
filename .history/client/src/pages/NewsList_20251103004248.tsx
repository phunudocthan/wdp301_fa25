import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import newsApi from '../api/news';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import ImageModal from '../components/common/ImageModal';
import '../styles/news.scss';

const NewsList: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);
  const perPage = 8;
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const pagedItems = items.slice(page * perPage, (page + 1) * perPage);

  useEffect(() => {
    setLoading(true);
    newsApi
      .fetchNewsList({ limit: 12 })
      .then((res) => setItems(res.items || []))
      .finally(() => setLoading(false));
  }, []);


  return (
    <div>
      <div className="news-page container mt-4">
      <header className="news-header">
        <button className="back-btn btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)}>&larr; Back</button>
        <div className="news-header-center">
          <h1>Latest News</h1>
          <p className="lead">Updates, announcements and highlights from our LEGOs store</p>
        </div>
      </header>

      {loading ? (
        <div className="news-loading">Loading news...</div>
      ) : (
        <div>
          <section className="news-grid">
            {pagedItems.map((n) => (
              <article key={n._id} className="news-card modern">
                <div className="news-media">
                  {n.images?.[0] ? (
                    <img src={n.images[0]} alt={n.title} role="button" onClick={() => setSelectedImage(n.images[0])} />
                  ) : (
                    <div className="news-placeholder">NEWS</div>
                  )}
                </div>
                <div className="news-body">
                  <h3 className="news-title"><Link to={`/news/${n._id}`}>{n.title}</Link></h3>
                  <p className="news-excerpt">{n.excerpt}</p>
                  <div className="news-meta">
                    <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </article>
            ))}
          </section>
          <div className="news-pagination">
            <button className="page-btn" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>&larr; Prev</button>
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button key={idx} className={`page-btn ${idx === page ? 'active' : ''}`} onClick={() => setPage(idx)}>{idx + 1}</button>
            ))}
            <button className="page-btn" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>Next &rarr;</button>
          </div>
        </div>
      )}
      </div>
        <Footer />
        {selectedImage && (
          <ImageModal src={selectedImage} alt="News image" onClose={() => setSelectedImage(null)} />
        )}
    </div>
  );
};

export default NewsList;
