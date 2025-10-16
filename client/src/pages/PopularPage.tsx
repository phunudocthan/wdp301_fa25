import "../styles/home.scss";

export default function PopularPage() {
  return (
    <div className="homepage">
      <section className="perfect-set">
        <h2>🔥 Popular LEGO Sets</h2>
        <p style={{ textAlign: "center" }}>
          These sets are trending right now among LEGO® lovers!
        </p>

        <div className="product-grid">
          <div className="product-card">
            <img src="/lego4.jpg" alt="LEGO Ninjago" />
            <h4>LEGO® Ninjago</h4>
            <p className="price">$69.99</p>
          </div>

          <div className="product-card">
            <img src="/lego5.jpg" alt="LEGO Technic" />
            <h4>LEGO® Technic</h4>
            <p className="price">$99.99</p>
          </div>

          <div className="product-card">
            <img src="/lego6.jpg" alt="LEGO Creator" />
            <h4>LEGO® Creator</h4>
            <p className="price">$89.99</p>
          </div>
        </div>
      </section>
    </div>
  );
}
