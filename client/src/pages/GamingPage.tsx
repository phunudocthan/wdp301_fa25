import "../styles/home.scss";

export default function GamingPage() {
  return (
    <div className="homepage">
      <section className="perfect-set">
        <h2>🎮 LEGO Gaming Sets</h2>
        <p style={{ textAlign: "center" }}>
          Build, play and explore gaming-inspired LEGO® worlds!
        </p>

        <div className="product-grid">
          <div className="product-card">
            <img src="/lego7.jpg" alt="LEGO Mario" />
            <h4>LEGO® Super Mario</h4>
            <p className="price">59.99 Đ</p>
          </div>

          <div className="product-card">
            <img src="/lego8.jpg" alt="LEGO Minecraft" />
            <h4>LEGO® Minecraft</h4>
            <p className="price">64.99 Đ</p>
          </div>

          <div className="product-card">
            <img src="/lego9.jpg" alt="LEGO Sonic" />
            <h4>LEGO® Sonic the Hedgehog</h4>
            <p className="price">72.99 Đ</p>
          </div>
        </div>
      </section>
    </div>
  );
}
