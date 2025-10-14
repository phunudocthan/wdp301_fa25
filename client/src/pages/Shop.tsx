import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import axiosInstance, { getFullImageURL } from "../api/axiosInstance";
import Header from "../components/common/Header";
import {
  Card,
  Row,
  Col,
  Spin,
  Empty,
  Button,
  Input,
  Typography,
  Pagination,
  Select,
  Space,
  Slider,
  message,
  Modal,
  Popover,
} from "antd";
import {
  ArrowLeftOutlined,
  HeartFilled,
  HeartOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import "../styles/shop.scss";
import imagesDefault from "../../../client/public/images/1827380.png";
import { useCart } from "../components/context/CartContext";
import { useFavorites } from "../components/context/FavoritesContext";
import { resolveAssetUrl } from "../utils/assets";
import { Box, Layers, Palette, Settings, Star, User } from "lucide-react";
import Footer from "../components/common/Footer";

const { Title } = Typography;
const { Meta } = Card;
const { Option } = Select;

interface Product {
  _id: string;
  name: string;
  price: number;
  images?: string[];
}

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(8);

  // --- Filter/sort/search ---
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>();
  const [theme, setTheme] = useState<string>();
  const [category, setCategory] = useState<string>();
  const [themes, setThemes] = useState<any[]>([]);
  const [ageRanges, setAgeRanges] = useState<any[]>([]);
  const [difficulties, setDifficulties] = useState<any[]>([]);

  const [difficulty, setDifficulty] = useState<string>();
  const [ageRange, setAgeRange] = useState<string>();
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const search = queryParams.get("search") || "";
  const { addToCart } = useCart();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const [pendingFavorites, setPendingFavorites] = useState<string[]>([]);

  // --- Fetch Products ---
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      // Lấy từ khóa từ URL nếu có
      const urlSearch = new URLSearchParams(location.search).get("search") || "";
      const finalSearch = searchTerm || urlSearch;

      if (finalSearch) params.append("search", finalSearch);
      if (theme) params.append("theme", theme);
      if (category) params.append("category", category);
      if (difficulty) params.append("difficulty", difficulty);
      if (ageRange) params.append("ageRange", ageRange);

      // Xử lý sort
      if (sortBy === "price_asc") {
        params.append("sortBy", "price");
        params.append("sortOrder", "asc");
      } else if (sortBy === "price_desc") {
        params.append("sortBy", "price");
        params.append("sortOrder", "desc");
      } else if (sortBy === "name_asc") {
        params.append("sortBy", "name");
        params.append("sortOrder", "asc");
      } else if (sortBy === "name_desc") {
        params.append("sortBy", "name");
        params.append("sortOrder", "desc");
      } else if (sortBy === "newest") {
        params.append("sortBy", "createdAt");
        params.append("sortOrder", "desc");
      }

      // Lọc theo giá
      if (priceRange[0] > 0) params.append("minPrice", priceRange[0].toString());
      if (priceRange[1] < 1000)
        params.append("maxPrice", priceRange[1].toString());

      const res = await axiosInstance.get(`/products?${params.toString()}`);

      // Dữ liệu BE trả về dạng { success, data: { products, pagination } }
      setProducts(res.data?.data?.products || []);
    } catch (err) {
      console.error("❌ Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- Get Filters Meta ---
  useEffect(() => {
    const fetchFilterMeta = async () => {
      try {
        const res = await axiosInstance.get("/products/filters/meta");
        setThemes(res.data.data.themes || []);
        setAgeRanges(res.data.data.ageRanges || []);
        setDifficulties(res.data.data.difficulties || []);
      } catch (err) {
        console.error("❌ Error fetching filter meta:", err);
      }
    };
    fetchFilterMeta();
  }, []);

  // --- Gọi API mỗi khi filter/search/sort thay đổi ---
  useEffect(() => {
    const delay = setTimeout(() => {
      fetchProducts();
    }, 400);
    return () => clearTimeout(delay);
  }, [searchTerm, sortBy, theme, category, difficulty, ageRange, priceRange, location.search]);

  // --- Pagination ---
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const displayedProducts = products.slice(startIndex, endIndex);

  const setPending = (id: string, value: boolean) =>
    setPendingFavorites((prev) => {
      if (value) {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      }
      return prev.filter((item) => item !== id);
    });

  const isPending = (id: string) => pendingFavorites.includes(id);

  const handleToggleFavorite = async (
    event: React.MouseEvent<HTMLButtonElement>,
    product: Product
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (isPending(product._id)) return;

    try {
      setPending(product._id, true);
      const added = await toggleFavorite(product._id);
      message.success(
        added
          ? `${product.name} đã được thêm vào danh sách yêu thích`
          : `${product.name} đã được xóa khỏi danh sách yêu thích`
      );
    } catch (error: any) {
      const msg =
        error?.message ||
        "Không thể cập nhật danh sách yêu thích. Vui lòng thử lại.";
      const notify =
        typeof msg === "string" && msg.toLowerCase().includes("đăng nhập")
          ? message.warning
          : message.error;
      notify(msg);
    } finally {
      setPending(product._id, false);
    }
  };
  return (
    <>
    <Header/>
      <div className="shop-container" style={{ padding: "20px 50px" }}>
        <Button type="link" style={{ marginBottom: 24 }} onClick={() => window.history.back()}>
          <ArrowLeftOutlined />

        </Button>
        <Title level={2} style={{ textAlign: "center", marginBottom: "30px" }}>
          List products
        </Title>

        {/* --- Bộ lọc / tìm kiếm / sắp xếp --- */}
        <Space
          style={{
            marginBottom: 24,
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <Input
            placeholder="Search product..."
            allowClear
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 250 }}
          />

          <Space>
            <Select
              placeholder="Difficulty"
              allowClear
              style={{ width: 150 }}
              onChange={(value) => setDifficulty(value)}
            >
              {difficulties.map((difficulty) => (
                <Option key={difficulty._id} value={difficulty._id}>
                  {difficulty.label}
                </Option>
              ))}
            </Select>

            <Select
              placeholder="Age Range"
              allowClear
              style={{ width: 150 }}
              onChange={(value) => setAgeRange(value)}
            >
              {ageRanges.map((range) => (
                <Option key={range._id} value={range._id}>
                  {range.rangeLabel}
                </Option>
              ))}
            </Select>

            <Select
              placeholder="Sort by"
              allowClear
              style={{ width: 180 }}
              onChange={(value) => setSortBy(value)}
            >
              <Option value="price_asc">Price: Low → High</Option>
              <Option value="price_desc">Price: High → Low</Option>
              <Option value="newest">Newest</Option>
              <Option value="name_asc">Name: A → Z</Option>
              <Option value="name_desc">Name: Z → A</Option>
            </Select>

            <div style={{ width: 200 }}>
              <span style={{ fontSize: 13 }}>Price range ($)</span>
              <Slider
                range
                min={0}
                max={1000}
                step={10}
                defaultValue={[0, 1000]}
                onChangeComplete={(value) =>
                  setPriceRange(value as [number, number])
                }
              />
            </div>
          </Space>
        </Space>

        {/* --- Danh sách sản phẩm --- */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <Spin size="large" />
          </div>
        ) : products.length > 0 ? (
          <>
            <Row gutter={[24, 24]}>
              {displayedProducts.map((p) => (
                <Col
                  key={p._id}
                  xs={24}
                  sm={12}
                  md={8}
                  lg={6}
                  style={{ display: "flex", justifyContent: "center" }}
                >
                  <Popover
                    trigger="hover"
                    placement="right"
                    content={
                      <div style={{ width: 300, padding: 10 }}>
                        <img
                          src={getFullImageURL(p.images?.[0])}
                          alt={p.name}
                          style={{
                            width: "100%",
                            height: 160,
                            objectFit: "cover",
                            borderRadius: 10,
                            marginBottom: 10,
                          }}
                        />
                        <h3 style={{ marginBottom: 6, fontWeight: 600, fontSize: 16 }}>
                          {p.name}
                        </h3>

                        {/* <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={16}
                              fill={i < 4 ? "#FFD700" : "none"}
                              stroke="#FFD700"
                            />
                          ))}
                          <span style={{ fontSize: 12, color: "#888" }}>4.0 (7 reviews)</span>
                        </div> */}

                        <p style={{ fontSize: 16, fontWeight: "bold", color: "#1677ff", marginBottom: 6 }}>
                          ${p.price.toFixed(2)}
                        </p>
                        <p style={{ fontSize: 13, color: p.stock > 0 ? "#28a745" : "#dc3545", marginBottom: 10 }}>
                          {p.stock > 0 ? `In stock: ${p.stock}` : "Out of stock"}
                        </p>

                        {/* Info grid similar to ProductDetail */}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "6px 10px",
                            marginBottom: 12,
                            fontSize: 12,
                          }}
                        >
                          {p.themeId && (
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <Palette size={14} />
                              <span>{p.themeId.name}</span>
                            </div>
                          )}
                          {p.ageRangeId && (
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <User size={14} />
                              <span>{p.ageRangeId.rangeLabel}</span>
                            </div>
                          )}
                          {p.difficultyId && (
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <Settings size={14} />
                              <span>{p.difficultyId.label}</span>
                            </div>
                          )}
                          {p.pieces && (
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <Layers size={14} />
                              <span>{p.pieces} pcs</span>
                            </div>
                          )}
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Box size={14} />
                            <span>{p.stock} left</span>
                          </div>
                        </div>

                        {/* Short description */}
                        <p style={{ fontSize: 12, color: "#666", marginBottom: 10 }}>
                          {p.description?.slice(0, 80) || "A creative LEGO set to spark imagination."}
                        </p>

                        <Button
                          type="primary"
                          size="small"
                          icon={<ShoppingCartOutlined />}
                          block
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            addToCart({
                              id: p._id,
                              name: p.name,
                              price: p.price,
                              image: p.images?.[0],
                              quantity: 1,
                            });
                            message.success(`${p.name} đã được thêm vào giỏ hàng`);
                          }}
                        >
                          Add to Bag
                        </Button>
                      </div>

                    }
                  >
                    <Link to={`/product/${p._id}`}>
                      <Card
                        hoverable
                        style={{
                          width: 260,
                          position: "relative",
                          borderRadius: 12,
                          overflow: "hidden",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                          transition: "transform 0.25s ease, box-shadow 0.25s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "scale(1.04)";
                          e.currentTarget.style.boxShadow =
                            "0 4px 16px rgba(0,0,0,0.2)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "scale(1)";
                          e.currentTarget.style.boxShadow =
                            "0 2px 8px rgba(0,0,0,0.1)";
                        }}
                        cover={
                          <img
                            alt={p.name}
                            src={getFullImageURL(p.images?.[0])}
                            style={{
                              height: 220,
                              objectFit: "cover",
                              width: "100%",
                            }}
                          />
                        }
                      >
                        <Meta
                          title={<span style={{ color: "#1677ff" }}>{p.name}</span>}
                          description={
                            <div style={{ marginTop: "8px" }}>
                              <b style={{ fontSize: "16px", color: "#000" }}>
                                ${p.price.toFixed(2)}
                              </b>
                            </div>
                          }
                        />
                        <button
                          type="button"
                          onClick={(event) => handleToggleFavorite(event, p)}
                          disabled={isPending(p._id)}
                          style={{
                            position: "absolute",
                            top: 12,
                            right: 12,
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            border: "1px solid #f0f0f0",
                            background: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                            cursor: isPending(p._id) ? "not-allowed" : "pointer",
                            opacity: isPending(p._id) ? 0.6 : 1,
                            transition: "transform 0.2s ease",
                          }}
                        >
                          {favoriteIds.includes(p._id) ? (
                            <HeartFilled style={{ color: "#f5222d" }} />
                          ) : (
                            <HeartOutlined style={{ color: "#555" }} />
                          )}
                        </button>
                        <Button
                          type="primary"
                          icon={<ShoppingCartOutlined />}
                          block
                          style={{ marginTop: "12px", borderRadius: 8 }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            try {
                              addToCart({
                                id: p._id,
                                name: p.name,
                                price: p.price,
                                image: p.images?.[0] || imagesDefault,
                                quantity: 1,
                              });
                              message.success(`${p.name} đã được thêm vào giỏ hàng`);
                            } catch (err) {
                              console.error("Add to cart error", err);
                              message.error("Không thể thêm sản phẩm vào giỏ hàng");
                            }
                          }}
                        >
                          Add to cart
                        </Button>
                      </Card>
                    </Link>
                  </Popover>
                </Col>
              ))}
            </Row>

            <div
              style={{
                textAlign: "center",
                marginTop: "30px",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={products.length}
                onChange={(page) => setCurrentPage(page)}
                showSizeChanger={false}
              />
            </div>



          </>
        ) : (
          <Empty description="Not found products." style={{ marginTop: "50px" }} />
        )}
      </div>
      <Footer />

    </>
  );
}
