import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./../styles/home.scss";

interface Product {
  _id: string;
  name: string;
  price: number;
  status: string;
  images?: string[];
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const search = params.get("search") || "";

  const handleAvatarClick = () => {
    navigate("/profile");
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const url = search
          ? `http://localhost:5000/api/products?search=${encodeURIComponent(search)}`
          : "http://localhost:5000/api/products";
        const res = await axios.get(url);
        setProducts(res.data.products || []);
      } catch (err) {
        console.error("❌ Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [search]);

  return (
    <div className="homepage">
      {/* Avatar góc phải dẫn tới /profile */}
      <div className="fixed top-4 right-4 z-50">
        <div
          onClick={handleAvatarClick}
          className="bg-blue-600 text-white rounded-full h-10 w-10 flex items-center justify-center cursor-pointer hover:bg-blue-700"
          title="Trang cá nhân"
        >
          
        </div>
      </div>

      {/* Hero Banner */}
      <section className="hero">
        <div className="hero-content">
          <h2>Chào mừng bạn đến với LEGOs!</h2>
          <p>Khám phá thế giới lắp ráp đầy sáng tạo – nơi trí tưởng tượng không có giới hạn.</p>
        </div>
        <div className="hero-image">
          <img src="/banner-transformers.png" alt="Transformers" />
        </div>
      </section>

      {/* Tabs nổi bật */}
      <section className="trending">
        <div className="trending-tabs">
          <button className="active">Nổi bật</button>
          <button>Chủ đề</button>
          <button>Tuổi</button>
        </div>
        <div className="trending-grid">
          <div className="trending-card">Trang Chủ</div>
          <div className="trending-card">Ưu đãi</div>
          <div className="trending-card">Tất cả</div>
          <div className="trending-card">Gaming</div>
        </div>
      </section>

      {/* Sản phẩm */}
      <section className="perfect-set">
        <h2>Find the perfect set</h2>
        <div className="set-tabs">
          <button className="active">Featured</button>
          <button>Popular</button>
          <button>Gaming</button>
        </div>

        <div className="product-grid">
          {loading ? (
            <p>Loading products...</p>
          ) : products.length > 0 ? (
            products.map((p) => (
              <div key={p._id} className="product-card">
                <img src={p.images?.[0] || "/placeholder.png"} alt={p.name} />
                <h4>{p.name}</h4>
                <p className="price">${p.price.toFixed(2)}</p>
                <p>Status: {p.status}</p>
                <button className="btn">Add to Bag</button>
              </div>
            ))
          ) : (
            <p>No products found.</p>
          )}
        </div>
      </section>
    </div>
  );
}
