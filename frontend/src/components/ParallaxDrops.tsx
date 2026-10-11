import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/landing.css";

const ParallaxDrops: React.FC = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setScrollY(0);
      return undefined;
    }

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const heroParallax = scrollY * 0.18;
  const heroContentParallax = scrollY * 0.08;
  const midParallax = (scrollY - 300) * 0.22;
  const overlayParallax = scrollY * 0.28;

  return (
    <div className="landing-container">
      {/* ──── NAV ──── */}
      <nav className="nav">
        <div className="nav-logo">
          <img src="/img/logo-agrovia.png" alt="Agrovia Logo" className="nav-logo-img" style={{ height: '42px' }} />
          AGRO<span>VIA</span>
        </div>
        <ul className="nav-links">
          <li>
            <a href="#about">Sobre</a>
          </li>
          <li>
            <a href="#how">Como Funciona</a>
          </li>
          <li>
            <a href="#tech">Tecnologia</a>
          </li>
          <li>
            <a href="#crops">Culturas</a>
          </li>
        </ul>
        <button className="nav-cta" onClick={() => navigate("/login")}>
          Fazer Login

        </button>
      </nav>

      {/* ──── HERO ──── */}
      <section
        className="hero"
        style={{
          backgroundPosition: `center ${heroParallax}px`,
        }}
      >
        <div
          className="hero-bg"
          id="heroBg"
          style={{ transform: `translate3d(0, ${heroParallax}px, 0) scale(1.12)` }}
        ></div>
        <div
          className="hero-glow"
          style={{ transform: `translate3d(0, ${overlayParallax}px, 0)` }}
        ></div>
        <svg
          className="hero-drops"
          viewBox="0 0 1440 800"
          preserveAspectRatio="xMidYMid slice"
          style={{ transform: `translate3d(0, ${heroParallax * 1.6}px, 0)` }}
        >
          <defs>
            <linearGradient id="dropGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(167,243,208,0)" />
              <stop offset="50%" stopColor="rgba(52,211,153,0.95)" />
              <stop offset="100%" stopColor="rgba(16,185,129,0.4)" />
            </linearGradient>
          </defs>
          <ellipse className="drop" cx="120" cy="50" rx="3" ry="7" style={{ animationDuration: "4s", animationDelay: "0s" }} />
          <ellipse className="drop" cx="300" cy="80" rx="2" ry="5" style={{ animationDuration: "5s", animationDelay: "1.2s" }} />
          <ellipse className="drop" cx="520" cy="30" rx="3" ry="8" style={{ animationDuration: "3.8s", animationDelay: "0.5s" }} />
          <ellipse className="drop" cx="750" cy="60" rx="2" ry="6" style={{ animationDuration: "4.5s", animationDelay: "2s" }} />
          <ellipse className="drop" cx="970" cy="40" rx="3" ry="7" style={{ animationDuration: "3.5s", animationDelay: "0.8s" }} />
          <ellipse className="drop" cx="1180" cy="70" rx="2" ry="5" style={{ animationDuration: "5.2s", animationDelay: "1.7s" }} />
          <ellipse className="drop" cx="1380" cy="25" rx="3" ry="6" style={{ animationDuration: "4.2s", animationDelay: "0.3s" }} />
          <ellipse className="drop" cx="220" cy="20" rx="2" ry="4" style={{ animationDuration: "6s", animationDelay: "2.5s" }} />
          <ellipse className="drop" cx="650" cy="10" rx="3" ry="7" style={{ animationDuration: "4.8s", animationDelay: "1s" }} />
          <ellipse className="drop" cx="1050" cy="55" rx="2" ry="5" style={{ animationDuration: "3.2s", animationDelay: "3s" }} />
        </svg>
        <div
          className="hero-content"
          style={{ transform: `translate3d(0, ${heroContentParallax}px, 0)` }}
        >
          <div className="hero-brand">
          </div>
          <p className="hero-eyebrow">Irrigação Inteligente · ESP32 · IoT · Agronegócio</p>
          <h1 className="hero-title">
            Cultive <span style={{ color: "#7fff6a" }}>com inteligência</span>
          </h1>
          <p className="hero-sub">
            Sistema autônomo de irrigação que lê a umidade do solo, espécie da planta e temperatura ambiente — e decide sozinho quando irrigar.
          </p>
          <div className="hero-btns">
            <button className="btn-primary" onClick={() => navigate("/login")}>
              Começar Agora
            </button>
            <button className="btn-outline" onClick={() => document.getElementById("about")?.scrollIntoView()}>
              Saiba Mais
            </button>
          </div>
        </div>
      </section>

      {/* ──── STATS ──── */}
      <div className="stats-bar">
        <div className="stat-item">
          <div className="stat-num">60%</div>
          <div className="stat-label">Economia de água</div>
        </div>
        <div className="stat-item">
          <div className="stat-num">24/7</div>
          <div className="stat-label">Monitoramento</div>
        </div>
        <div className="stat-item">
          <div className="stat-num">3 s</div>
          <div className="stat-label">Resposta dos sensores</div>
        </div>
        <div className="stat-item">
          <div className="stat-num">100%</div>
          <div className="stat-label">Controle remoto</div>
        </div>
      </div>

      {/* ──── ABOUT ──── */}
      <section className="about" id="about">
        <div className="about-screens">
          <div className="about-card">
            <div className="card-label">Umidade Geral</div>
            <div className="gauge-row">
              <div className="gauge-circle">72%</div>
              <div className="gauge-info">
                <div className="gauge-name">Solo</div>
                <div className="gauge-bar-wrap">
                  <div className="gauge-bar" style={{ width: "72%" }}></div>
                </div>
              </div>
            </div>
            <div className="gauge-row" style={{ marginTop: "1.2rem" }}>
              <div className="gauge-circle">58%</div>
              <div className="gauge-info">
                <div className="gauge-name">Ar</div>
                <div className="gauge-bar-wrap">
                  <div className="gauge-bar" style={{ width: "58%" }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="about-card">
            <div className="card-label">Temperatura</div>
            <div className="temp-row">
              <div className="temp-big">28°C</div>
              <div className="temp-status">Ótima</div>
            </div>
            <div className="chip-row">
              <div className="chip">Umidade Solo: 72%</div>
              <div className="chip">Ar: 58%</div>
              <div className="chip">Irrigar: Sim</div>
            </div>
          </div>
        </div>

        <div>
          <p className="section-tag">Monitoramento</p>
          <h2 className="section-title">Acompanhe em tempo real</h2>
          <p className="section-body">Visualize todos os parâmetros da sua plantação em um único painel intuitivo. Receba alertas quando algo sair do intervalo ideal e tome ações imediatas.</p>
        </div>
      </section>

      {/* ──── HOW IT WORKS ──── */}
      <section className="how" id="how">
        <div style={{ textAlign: "center" }}>
          <p className="section-tag">Processo</p>
          <h2 className="section-title">Como Funciona</h2>
        </div>
        <div className="how-grid">
          <div className="how-step">
            <div className="step-number">1</div>
            <div className="step-icon">🌱</div>
            <div className="step-title">Sensores Capturam Dados</div>
            <div className="step-desc">Sensores capacitivos medem a umidade do solo em tempo real, sem interferências.</div>
          </div>
          <div className="how-step">
            <div className="step-number">2</div>
            <div className="step-icon">⚙️</div>
            <div className="step-title">ESP32 Processa</div>
            <div className="step-desc">O microcontrolador ESP32 analisa os dados e toma decisões de irrigação autonomamente.</div>
          </div>
          <div className="how-step">
            <div className="step-number">3</div>
            <div className="step-icon">💧</div>
            <div className="step-title">Bomba Ativa</div>
            <div className="step-desc">A bomba d'água é acionada automaticamente quando a umidade cai abaixo do limite.</div>
          </div>
        </div>
      </section>

      {/* ──── PARALLAX MID ──── */}
      <div
        className="parallax-mid"
        style={{
          backgroundPosition: `center ${midParallax}px`,
        }}
      >
        <div
          className="parallax-mid-bg"
          id="midBg"
          style={{ transform: `translate3d(0, ${midParallax}px, 0) scale(1.12)` }}
        ></div>
        <div className="parallax-mid-content">
          <div className="mid-brand">
            <img src="/img/logo-agrovia.png" alt="Agrovia Logo" className="mid-logo-img" />
          </div>
          <p className="pull-quote">
            Maximize produtividade,{" "}
            <span style={{ color: "#7fff6a" }}>minimize desperdício.</span>
          </p>
        </div>
      </div>

      {/* ──── TECH STACK ──── */}
      <section className="tech" id="tech">
        <div>
          <p className="section-tag">Tecnologia</p>
          <h2 className="section-title">Stack Robusto</h2>
          <p className="section-body">Implementado com as melhores práticas em eletrônica, engenharia de software e machine learning.</p>

          <ul className="tech-list">
            <li>
              <div className="tech-dot"></div>
              <div>
                <p>ESP32 IoT Microcontroller</p>
                <p>Processamento autônomo e conectividade WiFi/BLE</p>
              </div>
            </li>
            <li>
              <div className="tech-dot"></div>
              <div>
                <p>Sensores Capacitivos DHT22</p>
                <p>Leitura precisa de umidade e temperatura</p>
              </div>
            </li>
            <li>
              <div className="tech-dot"></div>
              <div>
                <p>Cloud Integration (Firebase)</p>
                <p>Sincronização de dados em tempo real</p>
              </div>
            </li>
            <li>
              <div className="tech-dot"></div>
              <div>
                <p>React Dashboard</p>
                <p>Interface moderna e responsiva para monitoramento</p>
              </div>
            </li>
          </ul>
        </div>
        <div className="tech-visual">
          <div className="esp-board">
            <div className="esp-label">ESP32</div>
            <div className="esp-sub">IoT Controller</div>
          </div>
          <div className="orbit-item orbit-1">
            <strong>🌍 WiFi</strong> Conectado
          </div>
          <div className="orbit-item orbit-2">
            <strong>📊 Data</strong> Real-time
          </div>
          <div className="orbit-item orbit-3">
            <strong>💧 Sensor</strong> Umidade
          </div>
          <div className="orbit-item orbit-4">
            <strong>🌡️ Sensor</strong> Temperatura
          </div>
          <div className="orbit-item orbit-5">
            <strong>🚰 Bomba</strong> Acionada
          </div>
        </div>
      </section>

      {/* ──── CROPS ──── */}
      <section className="crops" id="crops">
        <div style={{ textAlign: "center" }}>
          <p className="section-tag">Aplicações</p>
          <h2 className="section-title">Culturas Suportadas</h2>
        </div>
        <div className="crops-grid">
          <div className="crop-card">
            <div
              className="crop-img"
              style={{
                backgroundImage: `url('/img/feijao.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            >
              <div className="crop-badge">LEGUMINOSA</div>
            </div>
            <div className="crop-body">
              <div className="crop-name">Feijão</div>
              <div className="crop-desc">Cultivo sensível que exige irrigação precisa em períodos críticos de floração.</div>
              <div className="crop-params">
                <div className="crop-param">
                  <div className="crop-param-label">Umidade Ideal</div>
                  <div className="crop-param-val">60–80%</div>
                </div>
                <div className="crop-param">
                  <div className="crop-param-label">Temp. Ideal</div>
                  <div className="crop-param-val">18–28°C</div>
                </div>
              </div>
            </div>
          </div>

          <div className="crop-card">
            <div
              className="crop-img"
              style={{
                backgroundImage: `url('/img/soja.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            >
              <div className="crop-badge">GRÃO</div>
            </div>
            <div className="crop-body">
              <div className="crop-name">Soja</div>
              <div className="crop-desc">Cultura de alto valor com demanda hídrica estratégica em fases reprodutivas.</div>
              <div className="crop-params">
                <div className="crop-param">
                  <div className="crop-param-label">Umidade Ideal</div>
                  <div className="crop-param-val">55–75%</div>
                </div>
                <div className="crop-param">
                  <div className="crop-param-label">Temp. Ideal</div>
                  <div className="crop-param-val">20–30°C</div>
                </div>
              </div>
            </div>
          </div>

          <div className="crop-card">
            <div
              className="crop-img"
              style={{
                backgroundImage: `url('/img/milho.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            >
              <div className="crop-badge">GRÃO</div>
            </div>
            <div className="crop-body">
              <div className="crop-name">Milho</div>
              <div className="crop-desc">Principal cultura brasileira com necessidade crítica de irrigação em pós-floração.</div>
              <div className="crop-params">
                <div className="crop-param">
                  <div className="crop-param-label">Umidade Ideal</div>
                  <div className="crop-param-val">50–70%</div>
                </div>
                <div className="crop-param">
                  <div className="crop-param-label">Temp. Ideal</div>
                  <div className="crop-param-val">22–28°C</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──── MISSION ──── */}
      <section className="mission">
        <p className="section-tag">Impacto</p>
        <h2 className="section-title">Tecnologia a serviço do campo</h2>
        <p className="section-body">
          A AGROVIA reduz o desperdício de água, corta custos com energia, libera o agricultor de monitoramento manual e
          prepara o campo brasileiro para o futuro da agricultura de precisão.
        </p>
      </section>

      {/* ──── CTA ──── */}
      <section className="cta-section">
        <div className="cta-brand">
          <img src="/img/logo-agrovia.png" alt="Agrovia Logo" className="cta-logo-img" />
          <span className="cta-brand-name">AGRO<span>VIA</span></span>
        </div>
        <p className="section-tag">Comece agora</p>
        <h2 className="section-title">Pronto para irrigar com inteligência?</h2>
        <p className="section-body">
          Solicite uma demonstração gratuita e veja como a AGROVIA transforma a gestão hídrica da sua propriedade.
        </p>
        <div className="cta-btns">
          <button className="btn-primary" onClick={() => navigate("/login")}>
            Agendar Demo
          </button>
          <button className="btn-outline" onClick={() => window.scrollTo(0, 0)}>
            Voltar ao Topo
          </button>
        </div>
      </section>

      {/* ──── FOOTER ──── */}
      <footer className="footer">
        <div className="footer-logo">
          <img src="/img/logo-agrovia.png" alt="Agrovia Logo" className="footer-logo-img" style={{ height: '36px' }} />
          AGRO<span>VIA</span>
        </div>
        <div className="footer-copy">© 2026 AGROVIA · TCC UNASP Engenheiro Coelho</div>
        <div className="footer-links">
          <a href="#about">Sobre</a>
          <a href="#how">Como Funciona</a>
          <a href="#tech">Tecnologia</a>
          <a href="#crops">Culturas</a>
        </div>
      </footer>
    </div>
  );
};

export default ParallaxDrops;
