import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-fade";
import "./HeroSlider.scss";

export default function HeroSlider() {
  const slides = [
    {
      image: "/images/lego-sale-banner.jpg",
      title: "What's on sale now?",
      subtitle: "Take a look at the latest deals on LEGOs® sets.",
      button: "Shop Now",
    },
    {
      image: "/images/lego-new-banner.jpg",
      title: "Discover New Arrivals",
      subtitle: "Explore the latest LEGOs® themes and products.",
      button: "Explore",
    },
    {
      image: "/images/lego-gaming-banner.jpg",
      title: "Level Up Your Play",
      subtitle: "Find your next gaming adventure in LEGOs® form.",
      button: "Play Now",
    },
  ];

  return (
    <div className="hero-slider">
      <Swiper
        modules={[Autoplay, Pagination, Navigation, EffectFade]}
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        loop={true}
        pagination={{ clickable: true }}
        navigation
        effect="fade"
        slidesPerView={1}
      >
        {slides.map((s, i) => (
          <SwiperSlide key={i}>
            <div
              className="slide"
              style={{ backgroundImage: `url(${s.image})` }}
            >
              <div className="overlay">
                <div className="content">
                  <h1>{s.title}</h1>
                  <p>{s.subtitle}</p>
                  <button>{s.button}</button>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
