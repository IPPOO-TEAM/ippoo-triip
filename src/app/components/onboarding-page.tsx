import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { ChevronRight, ArrowRight, Bike, Package, Truck, Car, Globe } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { boldBrand } from "./brand-text";

import imgTaxi     from "figma:asset/cb856ad9ad2b6d63389cb55398f0022c31a5d3bf.png";
import imgLivraison from "figma:asset/69629a15d8040af0ae589ad686f2ca30de63226b.png";
import imgTransport from "figma:asset/c3680b506d82e1e5ee8aa062c6524415e9f21293.png";
import imgCovoiturage from "figma:asset/e9e60f38f18b288d039778aec014b51cd42bd5dd.png";
import imgAfrica   from "figma:asset/6cc3d4905bdcc38a53430299260f13a383d87250.png";

/* ─────────────────────────────────────────
   Slides data
───────────────────────────────────────── */
interface Slide {
  id: number;
  image: string;
  objectPosition: string;  // fine-grained crop control
  badge: string;
  badgeEmoji: string;
  badgeIcon: React.ElementType;
  title: string;
  titleHighlight: string;
  description: string;
  gradientFrom: string;   // bottom color (rgba)
  gradientMid: string;    // mid stop
  accentColor: string;    // for badge + dot
  accentBg: string;       // badge bg
}

const slides: Slide[] = [
  {
    id: 1,
    image: imgTaxi,
    objectPosition: "center 30%",
    badge: "Taxi-Moto",
    badgeEmoji: "moto",
    badgeIcon: Bike,
    title: "Voyagez vite,",
    titleHighlight: "voyagez IPPOO",
    description: "Réservez un taxi-moto en quelques secondes et arrivez à destination rapidement, en toute sécurité.",
    gradientFrom: "rgba(247,127,0,0.96)",
    gradientMid: "rgba(20,10,0,0.55)",
    accentColor: "#F77F00",
    accentBg: "rgba(247,127,0,0.22)",
  },
  {
    id: 2,
    image: imgLivraison,
    objectPosition: "center 55%",
    badge: "Livraison Express",
    badgeEmoji: "livraison",
    badgeIcon: Package,
    title: "Vos colis livrés",
    titleHighlight: "avec soin",
    description: "Envoyez et recevez vos colis partout en ville. Suivi en temps réel à chaque étape.",
    gradientFrom: "rgba(42,157,143,0.96)",
    gradientMid: "rgba(0,20,15,0.55)",
    accentColor: "#2A9D8F",
    accentBg: "rgba(42,157,143,0.22)",
  },
  {
    id: 3,
    image: imgTransport,
    objectPosition: "center 45%",
    badge: "Transport Lourd",
    badgeEmoji: "transport",
    badgeIcon: Truck,
    title: "Bougez vos",
    titleHighlight: "marchandises",
    description: "Des camions disponibles pour tous vos transports lourds. Chargement, déménagement, fret.",
    gradientFrom: "rgba(30,96,145,0.96)",
    gradientMid: "rgba(0,10,25,0.55)",
    accentColor: "#1E6091",
    accentBg: "rgba(30,96,145,0.22)",
  },
  {
    id: 4,
    image: imgCovoiturage,
    objectPosition: "center 35%",
    badge: "Covoiturage",
    badgeEmoji: "covoiturage",
    badgeIcon: Car,
    title: "Partagez,",
    titleHighlight: "économisez",
    description: "Voyagez ensemble et réduisez vos dépenses. Rejoignez une communauté de confiance.",
    gradientFrom: "rgba(214,40,40,0.93)",
    gradientMid: "rgba(20,0,0,0.55)",
    accentColor: "#D62828",
    accentBg: "rgba(214,40,40,0.22)",
  },
  {
    id: 5,
    image: imgAfrica,
    objectPosition: "center 25%",
    badge: "IPPOO TRIIP",
    badgeEmoji: "africa",
    badgeIcon: Globe,
    title: "Le Monde se",
    titleHighlight: "déplace avec IPPOO",
    description: "Des milliers d'utilisateurs nous font confiance chaque jour. Rejoignez l'aventure IPPOO !",
    gradientFrom: "rgba(233,196,106,0.15)",
    gradientMid: "rgba(10,5,0,0.72)",
    accentColor: "#E9C46A",
    accentBg: "rgba(233,196,106,0.22)",
  },
];

/* ─────────────────────────────────────────
   African pattern SVG
───────────────────────────────────────── */
function AfricanDots({ color }: { color: string }) {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="opacity-20">
      {[0, 1, 2, 3].map(row =>
        [0, 1, 2, 3].map(col => (
          <circle
            key={`${row}-${col}`}
            cx={col * 30 + 15}
            cy={row * 30 + 15}
            r={row % 2 === col % 2 ? 5 : 2.5}
            fill={color}
          />
        ))
      )}
    </svg>
  );
}

function GeometricLines({ color }: { color: string }) {
  return (
    <svg width="200" height="60" viewBox="0 0 200 60" fill="none" className="opacity-15">
      {[0, 1, 2, 3, 4].map(i => (
        <rect key={i} x={i * 40} y={20} width={28} height={4} rx={2} fill={color} />
      ))}
      {[0, 1, 2, 3, 4].map(i => (
        <rect key={`b-${i}`} x={i * 40 + 14} y={36} width={14} height={4} rx={2} fill={color} />
      ))}
    </svg>
  );
}

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */
export function OnboardingPage() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [imageLoaded, setImageLoaded] = useState<boolean[]>(new Array(slides.length).fill(false));
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const goToSlide = useCallback((idx: number) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent(idx);
      setAnimating(false);
    }, 350);
  }, [animating]);

  const nextSlide = useCallback(() => {
    if (current < slides.length - 1) {
      goToSlide(current + 1);
    }
  }, [current, goToSlide]);

  const skipOrFinish = () => {
    localStorage.setItem("ippoo_onboarding_done", "1");
    navigate("/login");
  };

  const handleGetStarted = () => {
    localStorage.setItem("ippoo_onboarding_done", "1");
    navigate("/login");
  };

  // Auto-advance
  useEffect(() => {
    if (current >= slides.length - 1) return;
    const timer = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setCurrent(prev => (prev < slides.length - 1 ? prev + 1 : prev));
        setAnimating(false);
      }, 380);
    }, 4800);
    return () => clearInterval(timer);
  }, [current]);

  // Touch / swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = Math.abs(touchStartY.current - e.changedTouches[0].clientY);
    if (Math.abs(dx) > 50 && dy < 80) {
      if (dx > 0 && current < slides.length - 1) goToSlide(current + 1);
      else if (dx < 0 && current > 0) goToSlide(current - 1);
    }
  };

  const slide = slides[current];
  const isLast = current === slides.length - 1;

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden bg-black select-none"
      style={{ height: "100dvh" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Background Images (all preloaded, only current visible) ── */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current && !animating ? 1 : i === current && animating ? 0 : 0, zIndex: 1 }}
        >
          <ImageWithFallback
            src={s.image}
            alt={s.badge}
            className="w-full h-full object-cover"
            style={{ transform: "scale(1.04)", objectPosition: s.objectPosition }}
            onLoad={() =>
              setImageLoaded(prev => {
                const next = [...prev];
                next[i] = true;
                return next;
              })
            }
          />
        </div>
      ))}

      {/* ── Gradient overlay: bottom → top ── */}
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{
          zIndex: 2,
          background: `linear-gradient(
            to top,
            ${slide.gradientFrom} 0%,
            ${slide.gradientMid} 45%,
            rgba(0,0,0,0.18) 70%,
            transparent 100%
          )`,
        }}
      />

      {/* ── Top vignette (subtle) ── */}
      <div
        className="absolute inset-x-0 top-0 h-36 pointer-events-none"
        style={{
          zIndex: 3,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)",
        }}
      />

      {/* ── Decorative patterns (top-right) ── */}
      <div className="absolute top-0 right-0 pointer-events-none" style={{ zIndex: 4 }}>
        <AfricanDots color="white" />
      </div>

      {/* ── HEADER: Skip ── */}
      <div
        className="absolute inset-x-0 top-0 flex items-center justify-end px-6 pt-12"
        style={{ zIndex: 10 }}
      >
        {/* Skip */}
        {!isLast && (
          <button
            onClick={skipOrFinish}
            className="flex items-center gap-1 px-4 py-2 rounded-full text-white/80 text-sm font-medium backdrop-blur-sm border border-white/20 active:scale-95 transition-transform"
            style={{ background: "rgba(255,255,255,0.12)" }}
          >
            Passer
            <ChevronRight size={14} className="opacity-70" />
          </button>
        )}
      </div>

      {/* ── Slide number indicator (top center) ── */}
      <div
        className="absolute inset-x-0 flex justify-center"
        style={{ top: "14px", zIndex: 10 }}
      >
        <div className="flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className="transition-all duration-500 rounded-full"
              style={{
                width: i === current ? 28 : 6,
                height: 6,
                background: i === current ? slide.accentColor : "rgba(255,255,255,0.4)",
                boxShadow: i === current ? `0 0 8px ${slide.accentColor}` : "none",
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Bottom Content ── */}
      <div
        className="absolute inset-x-0 bottom-0 px-6 flex flex-col gap-4 max-h-[80vh] overflow-y-auto"
        style={{ zIndex: 10, paddingBottom: "max(1.75rem, env(safe-area-inset-bottom))" }}
      >
        {/* Decorative lines */}
        <GeometricLines color="white" />

        {/* Badge */}
        <div
          className="flex items-center gap-2"
          style={{ transform: animating ? "translateY(12px)" : "translateY(0)", opacity: animating ? 0 : 1 }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: slide.accentBg }}
          >
            <slide.badgeIcon size={16} color={slide.accentColor} />
          </div>
          <p
            className="text-white/80 leading-relaxed"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "clamp(0.875rem, 4vw, 1rem)",
            }}
          >
            {boldBrand(slide.badge)}
          </p>
        </div>

        {/* Title */}
        <div
          className="transition-all duration-500"
          style={{ transform: animating ? "translateY(12px)" : "translateY(0)", opacity: animating ? 0 : 1 }}
        >
          <h1
            className="text-white leading-[1.1] mb-3"
            style={{
              fontFamily: "Plus Jakarta Sans, Inter, sans-serif",
              fontSize: "clamp(1.6rem, 7vw, 2.4rem)",
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >{slide.title}<br /><span style={{ color: slide.accentColor === "#E9C46A" ? "#E9C46A" : "white", textShadow: slide.accentColor === "#E9C46A" ? `0 0 30px ${slide.accentColor}` : "none" }}>{slide.titleHighlight}</span></h1>
          <p
            className="text-white/80 leading-relaxed"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "clamp(0.875rem, 4vw, 1rem)",
            }}
          >
            {slide.description}
          </p>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3 mt-1">
          {isLast ? (
            // Final CTA
            <button
              onClick={handleGetStarted}
              className="flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-white text-base active:scale-95 transition-all duration-200 shadow-sm"
              style={{
                background: `linear-gradient(135deg, ${slide.accentColor === "#E9C46A" ? "#F77F00" : slide.accentColor}, ${slide.accentColor === "#E9C46A" ? "#F77F00" : slide.accentColor}dd)`,
                boxShadow: `0 8px 32px ${slide.accentColor}66`,
                fontFamily: "Plus Jakarta Sans, Inter, sans-serif",
              }}
            >
              <span>Commencer l'aventure</span>
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/20"
              >
                <ArrowRight size={18} />
              </div>
            </button>
          ) : (
            <>
              {/* Dot indicators row */}
              <div className="flex items-center gap-2 flex-1">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToSlide(i)}
                    className="transition-all duration-400 rounded-full"
                    style={{
                      width: i === current ? 24 : 8,
                      height: 8,
                      background: i === current ? slide.accentColor : "rgba(255,255,255,0.3)",
                    }}
                  />
                ))}
              </div>

              {/* Next button */}
              <button
                onClick={nextSlide}
                className="w-14 h-14 rounded-2xl flex items-center justify-center active:scale-90 transition-all duration-200 shadow-sm"
                style={{
                  background: slide.accentColor,
                  boxShadow: `0 8px 24px ${slide.accentColor}66`,
                }}
              >
                <ArrowRight size={22} color="white" strokeWidth={2.5} />
              </button>
            </>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full h-0.5 rounded-full overflow-hidden bg-white/15">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${((current + 1) / slides.length) * 100}%`,
              background: slide.accentColor,
              boxShadow: `0 0 8px ${slide.accentColor}`,
            }}
          />
        </div>

        {/* Login link */}
        <p className="text-center text-white/50 text-xs pb-1" style={{ fontFamily: "Inter, sans-serif" }}>
          Déjà un compte ?{" "}
          <button
            onClick={skipOrFinish}
            className="font-semibold underline underline-offset-2"
            style={{ color: slide.accentColor }}
          >
            Se connecter
          </button>
        </p>
      </div>
    </div>
  );
}