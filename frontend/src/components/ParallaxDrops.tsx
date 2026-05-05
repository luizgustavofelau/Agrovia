import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";

// ─── Seeded random ────────────────────────────────────────────────────────────
function seeded(n: number) {
  const x = Math.sin(n + 1) * 10000;
  return x - Math.floor(x);
}

// ─── Fade-in-up variant ───────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 36 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1], delay: i * 0.13 },
  }),
};

// ─── Cloud SVG ────────────────────────────────────────────────────────────────
const CloudSVG: React.FC<{ op: number; sc: number }> = ({ op, sc }) => (
  <svg viewBox="0 0 200 90" width={200 * sc} height={90 * sc}>
    <ellipse cx="100" cy="68" rx="80" ry="22" fill={`rgba(255,255,255,${op})`} />
    <ellipse cx="68"  cy="50" rx="42" ry="30" fill={`rgba(255,255,255,${op})`} />
    <ellipse cx="120" cy="45" rx="38" ry="28" fill={`rgba(255,255,255,${op})`} />
    <ellipse cx="155" cy="58" rx="28" ry="20" fill={`rgba(255,255,255,${op})`} />
  </svg>
);

// ─── Cloud ────────────────────────────────────────────────────────────────────
const CLOUDS = [
  { top: 7,  sx: -30,  amp: 110, dur: 34, sc: 1.3, op: 0.50 },
  { top: 15, sx: 300,  amp: 130, dur: 50, sc: 0.9, op: 0.38 },
  { top: 22, sx: 90,   amp: 140, dur: 27, sc: 0.7, op: 0.30 },
  { top: 5,  sx: 550,  amp: 85,  dur: 60, sc: 1.0, op: 0.45 },
  { top: 27, sx: 370,  amp: 105, dur: 42, sc: 0.8, op: 0.28 },
];

const Cloud: React.FC<{ cfg: typeof CLOUDS[0]; sp: any }> = ({ cfg, sp }) => {
  const y = useTransform(sp, [0, 1], [0, -cfg.top * 0.4]);
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ top: `${cfg.top}%`, y }}
      animate={{ x: [cfg.sx, cfg.sx + cfg.amp, cfg.sx] }}
      transition={{ duration: cfg.dur, repeat: Infinity, ease: "easeInOut" }}
    >
      <CloudSVG op={cfg.op} sc={cfg.sc} />
    </motion.div>
  );
};

// ─── Drop (tech-rain style — thin emerald light line) ─────────────────────────
const Drop: React.FC<{ left: number; delay: number; h: number; op: number; sp: any }> = ({ left, delay, h, op, sp }) => {
  const y = useTransform(sp, [0, 0.15, 0.45, 0.70, 0.87, 1.0], [-180, -80, 130, 400, 700, 1100]);
  const opacity = useTransform(sp, [0, 0.13, 0.72, 0.92, 1.0], [0, op, op, op * 0.3, 0]);
  return (
    <motion.div
      className="absolute top-0 pointer-events-none"
      style={{
        left: `${left}%`,
        width: "1.5px",
        height: `${h}px`,
        y,
        opacity,
        borderRadius: "0 0 50% 50%",
        background: "linear-gradient(to bottom, rgba(167,243,208,0), rgba(52,211,153,0.95), rgba(16,185,129,0.4))",
        boxShadow: "0 0 6px rgba(52,211,153,0.5)",
      }}
      initial={{ scaleY: 0.3 }}
      animate={{ scaleY: 1 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
    />
  );
};

// ─── Feature cards data ───────────────────────────────────────────────────────
const features = [
  { icon: "💧", title: "Irrigação Inteligente",  desc: "Controle automatizado com base em sensores de umidade e clima em tempo real." },
  { icon: "🌡️", title: "Monitoramento Completo", desc: "Temperatura, umidade do solo e do ar centralizados em um único painel." },
  { icon: "🌤️", title: "Previsão Climática",     desc: "Integração WeatherAPI para decisões de irrigação mais precisas." },
];

// ─── Main Component ───────────────────────────────────────────────────────────
const ParallaxDrops: React.FC = () => {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();

  // Background: 5% parallax travel (very subtle)
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "5%"]);

  // Hero fades out in first 22% of scroll
  const heroOp = useTransform(scrollYProgress, [0, 0.22], [1, 0]);
  const heroY  = useTransform(scrollYProgress, [0, 0.22], [0, -50]);

  const drops = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      left:  3  + seeded(i * 7)  * 94,
      delay: seeded(i * 13) * 3,
      h:     40 + Math.floor(seeded(i * 3) * 52),
      op:    0.40 + seeded(i * 11) * 0.55,
    })),
  []);

  return (
    <div style={{ minHeight: "280vh" }}>

      {/* ── Fixed: parallax sky background ── */}
      <motion.div
        className="fixed inset-0 z-0"
        style={{
          y: bgY,
          backgroundImage:
            "url('/sky-background.jpg'), linear-gradient(to bottom, #0c1a2e 0%, #0f2d40 50%, #0a3d2e 100%)",
          backgroundSize: "cover, cover",
          backgroundPosition: "center, center",
        }}
      />

      {/* Dark overlay */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.08) 45%, rgba(0,0,0,0.55) 100%)" }}
      />

      {/* ── Fixed: clouds z-10 ── */}
      <div className="fixed inset-0 z-10 overflow-hidden pointer-events-none">
        {CLOUDS.map((cfg, i) => <Cloud key={i} cfg={cfg} sp={scrollYProgress} />)}
      </div>

      {/* ── Fixed: tech-rain drops z-20 ── */}
      <div className="fixed inset-0 z-20 overflow-hidden pointer-events-none">
        {drops.map((d, i) => <Drop key={i} left={d.left} delay={d.delay} h={d.h} op={d.op} sp={scrollYProgress} />)}
      </div>

      {/* ── Fixed: hero (fades on scroll) z-30 ── */}
      <motion.div
        className="fixed inset-0 z-30 flex items-center justify-center pointer-events-none"
        style={{ opacity: heroOp, y: heroY }}
      >
        <motion.div
          className="text-center px-6 max-w-3xl"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Active badge */}
          <motion.div
            className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-400/20 rounded-full px-4 py-1.5 text-emerald-300 text-xs font-semibold tracking-widest uppercase mb-8"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Sistema Ativo
          </motion.div>

          {/* Gradient title — Montserrat via font-display */}
          <h1
            className="font-display font-black text-7xl md:text-[96px] tracking-tighter leading-none"
            style={{
              background: "linear-gradient(135deg, #ffffff 0%, #d1fae5 35%, #6ee7b7 70%, #34d399 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            AgroVia
          </h1>

          <p className="mt-6 text-slate-300 text-lg md:text-xl font-light leading-relaxed max-w-xl mx-auto">
            Irrigação inteligente. Sensores em tempo real.{" "}
            <span className="text-emerald-300 font-medium">Tecnologia que cultiva resultados.</span>
          </p>

          {/* Scroll hint */}
          <motion.div
            className="mt-14 flex flex-col items-center gap-2 text-slate-500"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-px h-10 bg-gradient-to-b from-transparent to-emerald-400/60" />
            <span className="text-[10px] tracking-widest uppercase text-slate-500">Role para explorar</span>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ── Fixed: soil (z-40 — drops sink into it) ── */}
      <div className="fixed bottom-0 inset-x-0 z-40 pointer-events-none" style={{ height: "190px" }}>
        <div
          className="absolute inset-x-0 top-0 h-16 z-10"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(15,8,3,0.65))" }}
        />
        <img src="/img/solo.jpg" alt="Solo" className="w-full h-full object-cover" style={{ objectPosition: "top" }} />
      </div>

      {/* ── Scrollable: features + CTA z-50 ── */}
      <div className="relative z-50" style={{ marginTop: "110vh", paddingBottom: "230px" }}>

        {/* Section label */}
        <div className="max-w-4xl mx-auto px-6 mb-16">
          <motion.p
            className="text-center text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-3"
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.8 }}
          >
            Funcionalidades
          </motion.p>
          <motion.h2
            className="font-display font-extrabold text-center text-3xl md:text-4xl text-white tracking-tight mb-12"
            variants={fadeUp} initial="hidden" whileInView="show" custom={1} viewport={{ once: true, amount: 0.8 }}
          >
            Tudo que sua fazenda precisa
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="glass-card-dark rounded-2xl p-7"
                variants={fadeUp} initial="hidden" whileInView="show" custom={i + 2}
                viewport={{ once: true, amount: 0.5 }}
              >
                <span className="text-3xl mb-4 block">{f.icon}</span>
                <h3 className="font-display font-bold text-white text-base mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA with glow button */}
        <motion.div
          className="flex justify-center px-6"
          variants={fadeUp} initial="hidden" whileInView="show" custom={5}
          viewport={{ once: true, amount: 0.6 }}
        >
          <div className="glass-card-dark rounded-3xl p-10 text-center max-w-md w-full">
            <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-white font-display font-extrabold text-sm">AV</span>
            </div>
            <h2 className="font-display font-extrabold text-white text-2xl mb-3 tracking-tight">
              Pronto para irrigar com precisão?
            </h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              Monitore sensores, controle a bomba e receba previsão do tempo — em tempo real.
            </p>

            {/* Glow button */}
            <motion.button
              onClick={() => navigate("/login")}
              className="inline-flex items-center gap-2 px-10 py-3.5 rounded-xl font-semibold text-white text-sm tracking-wide"
              style={{
                background: "linear-gradient(135deg, #059669, #047857)",
                boxShadow: "0 0 20px rgba(16,185,129,0.4), 0 0 44px rgba(16,185,129,0.18), 0 4px 12px rgba(0,0,0,0.35)",
              }}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 0 32px rgba(16,185,129,0.65), 0 0 72px rgba(16,185,129,0.30), 0 4px 16px rgba(0,0,0,0.4)",
              }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              Entrar na Plataforma
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ParallaxDrops;
