import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import Header from "../components/common/Header";
import HeroSlider from "../components/HeroSlider/HeroSlider";
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
          ? `/products?search=${encodeURIComponent(search)}`
          : "/products";
        const res = await axiosInstance.get(url);
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
      {/* Header */}
      <Header />

    
      {/* 🔥 Hero Slider (banner tự động chạy) */}
      <HeroSlider />

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

      {/* Danh sách sản phẩm */}
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
