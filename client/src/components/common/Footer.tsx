import { FaFacebook, FaInstagram, FaYoutube, FaTwitter } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="lego-footer">
      <div className="container footer-grid">
        {/* Brand */}
        <div className="footer-brand">
<img src="/logo.png" alt="LEGO" className="footer-logo" />
          <ul>
            <li><a href="#">Gift cards</a></li>
            <li><a href="#">Sitemap</a></li>
            <li><a href="#">Find inspiration</a></li>
            <li><a href="#">LEGOs catalogues</a></li>
            <li><a href="#">Find a LEGOs store</a></li>
          </ul>
        </div>

        {/* About */}
        <div>
          <h4>ABOUT US</h4>
          <ul>
            <li><a href="#">About the LEGOs Group</a></li>
            <li><a href="#">LEGOs® news</a></li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4>SUPPORT</h4>
          <ul>
            <li><a href="#">Contact us</a></li>
            <li><a href="#">Deliveries and returns</a></li>
            <li><a href="#">Payment methods</a></li>
          </ul>
        </div>

    

        {/* More */}
        <div>
          <h4>MORE FROM US</h4>
          <ul>
            <li><a href="#">LEGO Education</a></li>
            <li><a href="#">LEGO Ideas</a></li>
            <li><a href="#">LEGO Foundation</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom container">
        <div className="subscribe">
          <h4>SUBSCRIBE TO DIGITAL MARKETING EMAILS</h4>
          <div className="subscribe-box">
            <input type="email" placeholder="Your email address" />
            <button>→</button>
          </div>
        </div>
        <div className="social">
          <h4>FOLLOW US</h4>
          <div className="social-icons">
            <a href="#"><FaFacebook /></a>
            <a href="#"><FaTwitter /></a>
            <a href="#"><FaInstagram /></a>
            <a href="#"><FaYoutube /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
