import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import newsApi from '../api/news';
import Footer from '../components/common/Footer';
import ImageModal from '../components/common/ImageModal';
import '../styles/news.scss';

const NewsDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [news, setNews] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    (async () => {
      try {
        setError(null);
        const res = await newsApi.fetchNewsDetail(id);
        // Normalize response: some endpoints return { news: {...} }, others return the object directly
        const payload = (res && (res.news || res.data)) || res;
        setNews(payload || null);
      } catch (err: any) {
        console.error('Failed to load news detail', err);
        setError(err?.message || 'Failed to load news');
        setNews(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="news-detail container mt-4">Loading...</div>;
  if (error) return <div className="news-detail container mt-4">Error: {error}</div>;
  if (!news) return <div className="news-detail container mt-4">News not found</div>;

  return (
    <div>
      <div className="news-detail container mt-4">
        <button className="btn btn-link mb-3" onClick={() => navigate(-1)}>&larr; Back</button>

        <article className="news-article modern-article">
          <div className="article-hero">
            {news.images && news.images.length > 0 ? (
              <img src={news.images[0]} alt={news.title} onClick={() => setSelectedImage(news.images[0])} />
            ) : null}
            <div className="article-hero-body">
              <h1 className="article-title">{news.title}</h1>
              <div className="article-meta-row">
                <div className="author">
                  {news.author?.avatar ? (
                    <img className="author-avatar" src={news.author.avatar} alt={news.author?.name || 'Author'} />
                  ) : (
                    <div className="author-avatar placeholder">{(news.author?.name || '').split(' ').map((s: string) => s[0]).slice(0,2).join('').toUpperCase()}</div>
                  )}
                  <div className="author-name">{news.author?.name || 'Author'}</div>
                </div>
                <div className="article-meta">
                  <span className="date">{news.createdAt ? new Date(news.createdAt).toLocaleString() : ''}</span>
                  {/* Tags removed from article meta — tags are no longer shown */}
                </div>
              </div>
            </div>
          </div>

          <div className="news-article-content modern-content">
            {/* Prefer full HTML content; fall back to excerpt or plain text */}
            {news.content || news.excerpt ? (
              <div dangerouslySetInnerHTML={{ __html: String(news.content || (`<p>${(news.excerpt || '').replace(/\n/g, '<br/>')}</p>`)) }} />
            ) : (
              <p className="lead">No content available.</p>
            )}
          </div>
        </article>
      </div>
      <Footer />
      {selectedImage && (
        <ImageModal src={selectedImage} alt={news.title} onClose={() => setSelectedImage(null)} />
      )}
    </div>
  );
};

export default NewsDetail;
