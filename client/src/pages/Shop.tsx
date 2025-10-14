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
} from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";
import "../styles/shop.scss";

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

  return (
    <>
      <Header />
      <div className="shop-container" style={{ padding: "20px 50px" }}>
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
                onAfterChange={(value) =>
                  setPriceRange(value as [number, number])
                }
              />
            </div>
          </Space>
        </Space>

        {/* --- Danh sách sản phẩm --- */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <Spin size="large" tip="Đang tải sản phẩm..." />
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
                  <Card
                    hoverable
                    style={{
                      width: 260,
                      borderRadius: 12,
                      overflow: "hidden",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                    cover={
                      <Link to={`/product/${p._id}`}>
                        <img
                          alt={p.name}
                          src={getFullImageURL(p.images?.[0])}
                          style={{
                            height: 220,
                            objectFit: "cover",
                            width: "100%",
                          }}
                        />
                      </Link>
                    }
                  >
                    <Meta
                      title={
                        <Link to={`/product/${p._id}`}>
                          <span style={{ color: "#1677ff" }}>{p.name}</span>
                        </Link>
                      }
                      description={
                        <div style={{ marginTop: "8px" }}>
                          <b style={{ fontSize: "16px", color: "#000" }}>
                            ${p.price.toFixed(2)}
                          </b>
                        </div>
                      }
                    />
                    <Button
                      type="primary"
                      icon={<ShoppingCartOutlined />}
                      block
                      style={{ marginTop: "12px", borderRadius: 8 }}
                    >
                      Add to cart
                    </Button>
                  </Card>
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
    </>
  );
}
