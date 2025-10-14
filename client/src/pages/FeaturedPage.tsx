import "../styles/home.scss";

export default function FeaturedPage() {
  return (
    <div className="homepage">
      <section className="perfect-set">
        <h2>🌟 Featured LEGO Sets</h2>
        <p style={{ textAlign: "center" }}>
          Explore the most popular and top-rated LEGO® sets chosen by fans!
        </p>

        <div className="product-grid">
          <div className="product-card">
            <img src="/lego1.jpg" alt="LEGO City" />
            <h4>LEGO® City</h4>
            <p className="price">$49.99</p>
          </div>

          <div className="product-card">
            <img src="/lego2.jpg" alt="LEGO Friends" />
            <h4>LEGO® Friends</h4>
            <p className="price">$59.99</p>
          </div>

          <div className="product-card">
            <img src="/lego3.jpg" alt="LEGO Star Wars" />
            <h4>LEGO® Star Wars</h4>
            <p className="price">$79.99</p>
          </div>
        </div>
      </section>
    </div>
  );
}
