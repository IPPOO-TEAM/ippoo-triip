import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, ChevronRight, Bike, Package, Truck, Car, Globe } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

/* ─── Slide data with real Unsplash transport/Africa images ─── */
interface Slide {
  id: number;
  image: string;
  accent: string;
  bg: string;           // gradient bottom stop
  category: string;
  Icon: React.ElementType;
  headline: string;
  sub: string;
  caption: string;
}

const slides: Slide[] = [
  {
    id: 1,
    image: "https://images.unsplash.com/flagged/photo-1568200041533-6ce36f2c0761?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    accent: "#F97316",
    bg: "rgba(249,115,22,0.88)",
    category: "TAXI-MOTO",
    Icon: Bike,
    headline: "Partez vite,\narrivez sûr",
    sub: "Votre moto réservée en quelques secondes.",
    caption: "Confort · Sécurité · Ponctualité",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1630509866931-6bcfcc43db22?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    accent: "#10B981",
    bg: "rgba(16,185,129,0.88)",
    category: "LIVRAISON EXPRESS",
    Icon: Package,
    headline: "Livré en flash,\nsuivi en direct",
    sub: "Colis, courses, documents — on s'en occupe.",
    caption: "Suivi GPS · Temps réel · Garanti",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1611746351408-c0a1346be8e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    accent: "#3B82F6",
    bg: "rgba(30,96,145,0.90)",
    category: "TRANSPORT LOURD",
    Icon: Truck,
    headline: "Bougez vos\nmarchandises",
    sub: "Camions disponibles pour déménagement et fret.",
    caption: "Chargement · Déménagement · Fret",
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1708347456816-f4d28505c855?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    accent: "#EF4444",
    bg: "rgba(239,68,68,0.86)",
    category: "COVOITURAGE",
    Icon: Car,
    headline: "Partagez,\néconomisez",
    sub: "Voyagez ensemble. Moins cher, plus convivial.",
    caption: "Trajets partagés · Communauté · Économies",
  },
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1756721501657-639c90be59ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    accent: "#F59E0B",
    bg: "rgba(20,10,2,0.70)",
    category: "IPPOO TRIIP",
    Icon: Globe,
    headline: "L'Afrique\nse déplace",
    sub: "Des milliers de trajets effectués chaque jour.",
    caption: "Bénin · Togo · Niger · Côte d'Ivoire…",
  },
];

/* ─── Micro progress bar ─── */
function ProgressPill({ active, total, accent }: { active: number; total: number; accent: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {slides.map((_, i) => (
        <div
          key={i}
          className="rounded-full overflow-hidden"
          style={{
            height: 3,
            width: i === active ? 28 : 6,
            background: i === active ? accent : "rgba(255,255,255,0.28)",
            transition: "width 0.4s cubic-bezier(0.22,1,0.36,1), background 0.4s",
          }}
        />
      ))}
    </div>
  );
}

/* ─── Main ─── */
export function OnboardingPage() {
  const navigate = useNavigate();
  const [cur, setCur] = useState(0);
  const [dir, setDir] = useState(1);
  const [busy, setBusy] = useState(false);
  const touchX = useRef(0);
  const touchY = useRef(0);

  const slide = slides[cur];
  const isLast = cur === slides.length - 1;

  const go = useCallback((idx: number, direction = 1) => {
    if (busy || idx === cur) return;
    setBusy(true);
    setDir(direction);
    setTimeout(() => { setCur(idx); setBusy(false); }, 380);
  }, [busy, cur]);

  const next = useCallback(() => {
    if (cur < slides.length - 1) go(cur + 1, 1);
  }, [cur, go]);

  /* auto-advance */
  useEffect(() => {
    if (isLast) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [isLast, next]);

  /* swipe */
  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX;
    touchY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = touchX.current - e.changedTouches[0].clientX;
    const dy = Math.abs(touchY.current - e.changedTouches[0].clientY);
    if (Math.abs(dx) > 48 && dy < 80) {
      if (dx > 0 && cur < slides.length - 1) go(cur + 1, 1);
      else if (dx < 0 && cur > 0) go(cur - 1, -1);
    }
  };

  const finish = () => {
    localStorage.setItem("ippoo_onboarding_done", "1");
    navigate("/login");
  };

  /* animation variants */
  const variants = {
    enter:  (d: number) => ({ opacity: 0, x: d > 0 ? 60 : -60, scale: 0.96 }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit:   (d: number) => ({ opacity: 0, x: d > 0 ? -60 : 60, scale: 0.96 }),
  };

  return (
    <div
      className="relative w-full overflow-hidden bg-black select-none"
      style={{ height: "100dvh" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Background images (crossfade) ── */}
      <AnimatePresence initial={false} custom={dir}>
        <motion.div
          key={slide.id}
          className="absolute inset-0"
          style={{ zIndex: 1 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.65 }}
        >
          <img
            src={slide.image}
            alt={slide.category}
            className="w-full h-full object-cover object-center"
            style={{ transform: "scale(1.04)" }}
          />
        </motion.div>
      </AnimatePresence>

      {/* ── Gradient overlay — stronger at bottom ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 2,
          background: `linear-gradient(
            to top,
            ${slide.bg} 0%,
            rgba(0,0,0,0.55) 38%,
            rgba(0,0,0,0.10) 62%,
            transparent 100%
          )`,
          transition: "background 0.7s ease",
        }}
      />

      {/* ── Top vignette ── */}
      <div
        className="absolute inset-x-0 top-0 h-32 pointer-events-none"
        style={{ zIndex: 3, background: "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 100%)" }}
      />

      {/* ── Top bar: counter + skip ── */}
      <div
        className="absolute inset-x-0 top-0 flex items-center justify-between px-6"
        style={{ zIndex: 10, paddingTop: "max(44px, env(safe-area-inset-top) + 12px)" }}
      >
        {/* Slide counter */}
        <div className="flex items-center gap-2">
          <span
            className="text-white/90 font-black tabular-nums leading-none"
            style={{ fontFamily: "Plus Jakarta Sans, sans-serif", fontSize: "clamp(1.8rem,8vw,2.8rem)", letterSpacing: "-0.04em" }}
          >
            {String(cur + 1).padStart(2, "0")}
          </span>
          <span className="text-white/25 text-sm font-medium" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
            / {String(slides.length).padStart(2, "0")}
          </span>
        </div>

        {/* Skip */}
        {!isLast && (
          <button
            onClick={finish}
            className="flex items-center gap-1.5 rounded-full px-4 py-2 text-white/75 text-sm font-semibold backdrop-blur-md border border-white/20 active:scale-95 transition-transform"
            style={{ background: "rgba(255,255,255,0.12)" }}
          >
            Passer <ChevronRight size={14} className="opacity-60" />
          </button>
        )}
      </div>

      {/* ── Progress pills strip (below counter) ── */}
      <div
        className="absolute left-6"
        style={{ zIndex: 10, top: "max(100px, env(safe-area-inset-top) + 68px)" }}
      >
        <ProgressPill active={cur} total={slides.length} accent={slide.accent} />
      </div>

      {/* ── Bottom content ── */}
      <div
        className="absolute inset-x-0 bottom-0 flex flex-col"
        style={{
          zIndex: 10,
          paddingBottom: "max(28px, env(safe-area-inset-bottom) + 16px)",
          paddingLeft: 24,
          paddingRight: 24,
          gap: 0,
        }}
      >
        {/* Service badge */}
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={`badge-${slide.id}`}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-2 mb-4"
          >
            <div
              className="flex items-center justify-center w-9 h-9 rounded-2xl shrink-0"
              style={{ background: `${slide.accent}30`, border: `1.5px solid ${slide.accent}55` }}
            >
              <slide.Icon size={17} style={{ color: slide.accent }} />
            </div>
            <span
              className="text-xs font-extrabold tracking-[0.18em] uppercase"
              style={{ color: slide.accent, fontFamily: "Space Grotesk, sans-serif" }}
            >
              {slide.category}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Main headline */}
        <AnimatePresence mode="wait" custom={dir}>
          <motion.h1
            key={`h-${slide.id}`}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1], delay: 0.04 }}
            className="text-white font-black leading-[1.06] mb-3"
            style={{
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontSize: "clamp(2rem, 9vw, 3rem)",
              letterSpacing: "-0.03em",
              whiteSpace: "pre-line",
            }}
          >
            {slide.headline}
          </motion.h1>
        </AnimatePresence>

        {/* Sub + caption */}
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={`sub-${slide.id}`}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
            className="mb-7"
          >
            <p
              className="text-white/80 leading-relaxed mb-1"
              style={{ fontFamily: "Inter, sans-serif", fontSize: "clamp(0.9rem, 4vw, 1rem)" }}
            >
              {slide.sub}
            </p>
            <p
              className="text-white/42 text-xs tracking-wide"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              {slide.caption}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* CTA row */}
        {isLast ? (
          <motion.button
            onClick={finish}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 24 }}
            className="w-full flex items-center justify-between rounded-2xl px-5 py-4 active:scale-[0.97] transition-transform"
            style={{
              background: `linear-gradient(130deg, ${slide.accent}, ${slide.accent}bb)`,
              boxShadow: `0 12px 40px ${slide.accent}60`,
            }}
          >
            <span
              className="text-white font-bold text-base"
              style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
            >
              Commencer l'aventure
            </span>
            <div
              className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0"
            >
              <ArrowRight size={20} className="text-white" strokeWidth={2.5} />
            </div>
          </motion.button>
        ) : (
          <div className="flex items-center justify-between">
            {/* Dot taps */}
            <div className="flex items-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => go(i, i > cur ? 1 : -1)}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === cur ? 26 : 7,
                    height: 7,
                    background: i === cur ? slide.accent : "rgba(255,255,255,0.28)",
                  }}
                />
              ))}
            </div>

            {/* Next arrow */}
            <motion.button
              onClick={next}
              whileTap={{ scale: 0.88 }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: slide.accent,
                boxShadow: `0 8px 28px ${slide.accent}70`,
              }}
            >
              <ArrowRight size={22} className="text-white" strokeWidth={2.5} />
            </motion.button>
          </div>
        )}

        {/* Already have account */}
        <p
          className="text-center text-white/42 text-xs mt-5"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Déjà un compte ?{" "}
          <button
            onClick={finish}
            className="font-bold underline underline-offset-2"
            style={{ color: `${slide.accent}e0` }}
          >
            Se connecter
          </button>
        </p>
      </div>

      {/* ── Decorative: accent glow at bottom edge ── */}
      <div
        className="absolute inset-x-0 bottom-0 h-64 pointer-events-none"
        style={{
          zIndex: 3,
          background: `radial-gradient(ellipse 80% 60% at 50% 100%, ${slide.accent}35 0%, transparent 70%)`,
          transition: "background 0.7s ease",
        }}
      />
    </div>
  );
}
