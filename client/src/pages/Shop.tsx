// === 📁 src/pages/Shop.tsx ===
import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import "./../styles/home.scss"; // hoặc tạo file shop.scss nếu muốn tách riêng
import Header from "../components/common/Header";
import "./../styles/shop.scss";


interface Product {
  _id: string;
  name: string;
  price: number;
  status: string;
  images?: string[];
}

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const search = queryParams.get("search") || "";

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/products?search=${search}`);
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
    <>
      <Header />
      <div className="shop-page container">
        <h2>Shop</h2>

        {loading ? (
          <p>Loading products...</p>
        ) : products.length > 0 ? (
          <div className="product-grid">
            {products.map((p) => (
              <div key={p._id} className="product-card">
                <Link to={`/product/${p._id}`}>
                  <img src={p.images?.[0] || "/placeholder.png"} alt={p.name} />
                  <h4>{p.name}</h4>
                  <p className="price">${p.price.toFixed(2)}</p>
                  <p>Status: {p.status}</p>
                </Link>
                <button className="btn">Add to Bag</button>
              </div>
            ))}
          </div>
        ) : (
          <p>Không tìm thấy sản phẩm nào.</p>
        )}
      </div>
    </>
  );
}
