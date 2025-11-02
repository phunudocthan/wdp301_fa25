import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Row, Col, Spin, Empty, Typography, message } from "antd";
import themeApi, { Theme } from "../api/theme";
import { getFullImageURL } from "../api/axiosInstance";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import "../styles/themes.scss";

const { Title, Paragraph } = Typography;
const { Meta } = Card;

export default function ThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchThemes();
  }, []);

  const fetchThemes = async () => {
    try {
      setLoading(true);
      const response = await themeApi.getActiveThemes();
      setThemes(response.data.data);
    } catch (error: any) {
      console.error("Error fetching themes:", error);
      message.error(error.response?.data?.error || "Failed to load themes");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="themes-page-loading">
          <Spin size="large" tip="Loading themes..." />
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="themes-page">
        <div className="themes-hero">
          <Title level={1}>Explore LEGO Themes</Title>
          <Paragraph className="hero-subtitle">
            Discover amazing LEGO themes and their iconic characters
          </Paragraph>
        </div>

        <div className="themes-container">
          {themes.length === 0 ? (
            <Empty
              description="No themes available"
              style={{ margin: "80px auto" }}
            />
          ) : (
            <Row gutter={[24, 24]}>
              {themes.map((theme) => (
                <Col xs={24} sm={12} md={8} lg={6} key={theme._id}>
                  <Link
                    to={`/themes/${theme._id}`}
                    style={{ display: "block" }}
                  >
                    <Card
                      hoverable
                      className="theme-card"
                      cover={
                        <div className="theme-card-image">
                          <img
                            alt={theme.name}
                            src={
                              theme.banner
                                ? getFullImageURL(theme.banner)
                                : "/images/placeholder-theme.png"
                            }
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/images/placeholder-theme.png";
                            }}
                          />
                        </div>
                      }
                    >
                      <Meta
                        title={theme.name}
                        description={
                          theme.description
                            ? theme.description.length > 100
                              ? `${theme.description.substring(0, 100)}...`
                              : theme.description
                            : "Explore this amazing LEGO theme"
                        }
                      />
                    </Card>
                  </Link>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
