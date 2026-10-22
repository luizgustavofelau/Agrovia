import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, BookOpen, CloudSun, Droplets, FileText, Map, Radio, Sprout, Waves } from "lucide-react";
import "../styles/landing.css";

const processSteps = [
  { title: "Observe o solo", description: "Textura, profundidade, cobertura e drenagem mudam a forma como a água se movimenta e fica disponível às raízes. Uma leitura representa o local e a camada em que foi feita.", icon: Droplets },
  { title: "Registre as leituras", description: "Sensores instalados e calibrados podem registrar variações de umidade ao longo do tempo. Posição, profundidade e manutenção influenciam a qualidade da medição.", icon: Radio },
  { title: "Organize o contexto", description: "Associe registros ao campo, à cultura, à fase de desenvolvimento e às condições do tempo. Esse contexto ajuda a comparar períodos sem tratar uma medida isolada como regra.", icon: Map },
  { title: "Avalie a necessidade", description: "Considere os dados junto da observação da lavoura, do solo e do sistema de irrigação. A plataforma apoia a análise; não aciona irrigação automaticamente.", icon: Activity },
  { title: "Acompanhe os resultados", description: "Registre o manejo realizado e observe a resposta da área para revisar o planejamento. Comparações úteis dependem de dados consistentes e de condições locais.", icon: FileText },
];

const benefits = [
  { title: "Umidade com contexto", description: "Acompanhe leituras vinculadas a um ponto e a uma profundidade; elas não representam, sozinhas, todo o talhão." },
  { title: "Planejamento mais informado", description: "Cruze observações, clima, fase da cultura e capacidade do sistema antes de definir o manejo hídrico." },
  { title: "Campos organizados", description: "Reúna localização, cultura e dados de área cadastrados para facilitar consultas e comparações." },
  { title: "Dispositivos identificados", description: "Consulte nome, vínculo e status de conexão dos dispositivos registrados na plataforma." },
  { title: "Pontos de atenção visíveis", description: "Identifique falta de informação ou mudanças que merecem conferência no campo, sem classificar automaticamente uma área como crítica." },
  { title: "Histórico com continuidade", description: "Com integração de telemetria ativa, registros consistentes podem apoiar comparações entre datas e operações." },
];

const features = [
  { title: "Painel de monitoramento", description: "Veja um resumo de campos e dispositivos. Leituras, gráficos históricos e alertas aparecem como indisponíveis até a integração de telemetria.", icon: Activity },
  { title: "Campos e propriedades", description: "Cadastre fazendas com localização, cultura, área e talhões. Informações não preenchidas continuam identificadas como ausentes.", icon: Sprout },
  { title: "Sensores e dispositivos", description: "Consulte nome, código MAC, fazenda vinculada e conexão. A tela não apresenta uma leitura de solo que a API não forneceu.", icon: Radio },
  { title: "Relatórios e alertas", description: "Encontre as áreas reservadas para análise e ocorrências. Os resultados dependem de leituras históricas e regras configuradas.", icon: FileText },
  { title: "Biblioteca agrícola", description: "Leia materiais por cultura, navegue pelos capítulos, pesquise assuntos e consulte referências técnicas ao final dos estudos.", icon: BookOpen },
  { title: "Contexto de cultivo", description: "Considere clima, solo, sistema de produção e fase de desenvolvimento; a recomendação precisa ser adaptada à propriedade.", icon: CloudSun },
];

const cropPreviews = [
  { name: "Milho", category: "Cereal", image: `${process.env.PUBLIC_URL}/img/milho.jpg`, imageAlt: "Lavoura de milho", description: "Acompanhe emergência, crescimento vegetativo, florescimento e enchimento de grãos. O material aborda como época, solo e disponibilidade de água interagem em diferentes sistemas de produção." },
  { name: "Soja", category: "Leguminosa", image: `${process.env.PUBLIC_URL}/img/soja.jpg`, imageAlt: "Plantas e vagens de soja", description: "Explore desenvolvimento, nodulação, ambiente e manejo hídrico da soja. As orientações consideram que cultivar, fotoperíodo e calendário variam conforme a região." },
  { name: "Cana-de-açúcar", category: "Gramínea perene", image: `${process.env.PUBLIC_URL}/img/cana-de-acucar.jpg`, imageAlt: "Colheita em um canavial", imageCredit: "Foto: proudlyswazi / Unsplash", description: "Entenda o estabelecimento do canavial, o perfilhamento, os ciclos de corte e a rebrota da soqueira. O manejo de água e solo depende do ambiente, da variedade e do sistema de produção." },
  { name: "Café", category: "Cultura perene", image: `${process.env.PUBLIC_URL}/img/cafe.jpg`, imageAlt: "Cerejas amarelas de café arábica em um ramo", imageCredit: "Foto: 1500mcoffee / Pexels", description: "Conheça diferenças entre espécies, fases fenológicas e condições de cultivo. Floradas, desenvolvimento dos frutos, solo e disponibilidade hídrica precisam ser interpretados no contexto de cada região." },
  { name: "Feijão", category: "Leguminosa", image: `${process.env.PUBLIC_URL}/img/feijao.jpg`, imageAlt: "Cultivo de feijão", description: "Revise estabelecimento, florescimento, formação de vagens e enchimento de grãos. O conteúdo relaciona estresse hídrico, drenagem e escolha de época às condições locais." },
];

const ParallaxDrops: React.FC = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const midSectionRef = useRef<HTMLDivElement | null>(null);

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
    window.addEventListener("resize", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const limitar = (valor: number, minimo: number, maximo: number) => Math.min(maximo, Math.max(minimo, valor));
  const heroParallax = limitar(scrollY * 0.14, 0, 110);
  const heroContentParallax = limitar(scrollY * 0.04, 0, 32);
  const midSectionTop = midSectionRef.current?.getBoundingClientRect().top ?? window.innerHeight;
  const midParallax = limitar((window.innerHeight / 2 - midSectionTop) * 0.07, -50, 50);
  const overlayParallax = limitar(scrollY * 0.18, 0, 130);

  return (
    <div className="landing-container">
      {/* ──── NAV ──── */}
      <nav className="nav">
        <div className="nav-logo">
          <img src={`${process.env.PUBLIC_URL}/img/logo-agrovia.png`} alt="Agrovia Logo" className="nav-logo-img" style={{ height: '42px' }} />
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
            <a href="#benefits">Benefícios</a>
          </li>
          <li>
            <a href="#features">Recursos</a>
          </li>
          <li>
            <a href="#library">Estudos</a>
          </li>
        </ul>
        <button className="nav-cta" onClick={() => navigate("/login")}>
          Fazer Login

        </button>
      </nav>

      {/* ──── HERO ──── */}
      <section className="hero">
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
            Decisões melhores <span style={{ color: "#7fff6a" }}>começam no solo</span>
          </h1>
          <p className="hero-sub">
            A Agrovia organiza informações da propriedade e dos dispositivos para apoiar o acompanhamento da umidade do solo. Ao relacionar essas observações com clima, cultura e fase de desenvolvimento, o produtor ganha contexto para planejar a irrigação. A decisão continua dependente das condições e da avaliação de cada área.
          </p>
          <div className="hero-btns">
            <button className="btn-primary" onClick={() => navigate("/login")}>
              Acessar plataforma
            </button>
            <button className="btn-outline" onClick={() => document.getElementById("features")?.scrollIntoView()}>
              Conhecer recursos
            </button>
          </div>
        </div>
      </section>

      {/* ──── ABOUT ──── */}
      <section className="about" id="about">
        <div className="about-visual" aria-label="Solo, sensores e análise">
          <div className="about-visual-line"><span><Waves size={22} /></span><div><strong>Solo</strong><small>Condições variáveis</small></div></div>
          <div className="about-visual-line"><span><Radio size={22} /></span><div><strong>Informações</strong><small>Leituras e registros</small></div></div>
          <div className="about-visual-line"><span><Sprout size={22} /></span><div><strong>Manejo</strong><small>Decisão contextualizada</small></div></div>
        </div>
        <div className="about-copy">
          <p className="section-tag">Monitoramento</p>
          <h2 className="section-title">Entenda o que acontece antes de irrigar</h2>
          <p className="section-body">A água no solo não é uniforme: textura, estrutura, relevo, cobertura e profundidade das raízes influenciam infiltração e armazenamento. Por isso, uma medição representa apenas o local e a camada em que foi feita. Interpretada junto da chuva, do clima, da cultura e de sua fase, ela pode compor uma análise mais completa da área.</p>
          <p className="section-body about-followup">A plataforma ajuda a reunir esse contexto e a consultar os registros disponíveis. Ela não substitui a observação da lavoura, a calibração do sensor nem a orientação agronômica adaptada à propriedade.</p>
          <a className="text-link" href="#how">Veja como a plataforma organiza esse processo <span aria-hidden="true">→</span></a>
        </div>
      </section>

      {/* ──── HOW IT WORKS ──── */}
      <section className="how" id="how">
        <div className="section-heading">
          <p className="section-tag">Processo</p>
          <h2 className="section-title">Da leitura à decisão</h2>
          <p className="section-body">Um percurso para transformar observações em informação organizada e apoiar uma decisão revisável, com a realidade do talhão sempre em primeiro plano.</p>
        </div>
        <div className="how-grid">
          {processSteps.map(({ title, description, icon: Icon }, index) => (
            <article className="how-step" key={title}>
              <div className="step-number">0{index + 1}</div>
              <div className="step-icon"><Icon size={22} aria-hidden="true" /></div>
              <h3 className="step-title">{title}</h3>
              <p className="step-desc">{description}</p>
            </article>
          ))}
        </div>
        <p className="process-note">O fluxo é educativo. A coleta, o histórico e qualquer automação dependem dos sensores e das integrações efetivamente instalados e configurados.</p>
      </section>

      {/* ──── PARALLAX MID ──── */}
      <div className="parallax-mid" ref={midSectionRef}>
        <div
          className="parallax-mid-bg"
          id="midBg"
          style={{ transform: `translate3d(0, ${midParallax}px, 0) scale(1.12)` }}
        ></div>
        <div className="parallax-mid-content">
          <div className="mid-brand">
            <img src={`${process.env.PUBLIC_URL}/img/logo-agrovia.png`} alt="Agrovia Logo" className="mid-logo-img" />
          </div>
          <p className="pull-quote">
            Conhecimento e contexto,{" "}
            <span style={{ color: "#7fff6a" }}>a serviço do campo.</span>
          </p>
        </div>
      </div>

      {/* ──── BENEFITS ──── */}
      <section className="benefits" id="benefits">
        <div className="section-heading">
          <p className="section-tag">Uso consciente</p>
          <h2 className="section-title">Mais contexto para o manejo</h2>
          <p className="section-body">A tecnologia pode ajudar a organizar o trabalho e a observar mudanças; os resultados dependem do uso e das condições locais.</p>
        </div>
        <ul className="benefit-list">
          {benefits.map((benefit) => (
            <li key={benefit.title}>
              <span aria-hidden="true">+</span>
              <div><strong>{benefit.title}</strong><small>{benefit.description}</small></div>
            </li>
          ))}
        </ul>
      </section>

      {/* ──── FEATURES ──── */}
      <section className="features" id="features">
        <div className="section-heading">
          <p className="section-tag">Plataforma</p>
          <h2 className="section-title">Informação agrícola em um só lugar</h2>
          <p className="section-body">Acesse as áreas disponíveis após entrar. Recursos que ainda dependem de integração são identificados dentro do painel.</p>
        </div>
        <div className="feature-grid">
          {features.map(({ title, description, icon: Icon }) => (
            <article className="feature-card" key={title}>
              <span className="feature-icon"><Icon size={21} aria-hidden="true" /></span>
              <h3>{title}</h3>
              <p>{description}</p>
              <button type="button" onClick={() => navigate("/login")}>Acessar após login <span aria-hidden="true">→</span></button>
            </article>
          ))}
        </div>
      </section>

      {/* ──── LIBRARY PREVIEW ──── */}
      <section className="crops" id="library">
        <div className="section-heading">
          <p className="section-tag">Conhecimento aplicado</p>
          <h2 className="section-title">Estudos Agrícolas</h2>
          <p className="section-body">Materiais de consulta sobre cinco culturas, com conteúdo educativo e referências técnicas para aprofundar cada tema.</p>
        </div>
        <div className="crops-grid">
          {cropPreviews.map((crop) => (
            <article className="crop-card" key={crop.name}>
              <div className="crop-img">
                <img src={crop.image} alt={crop.imageAlt} loading="lazy" />
                <span className="crop-badge">{crop.category}</span>
                {crop.imageCredit && <small className="crop-photo-credit">{crop.imageCredit}</small>}
              </div>
              <div className="crop-body">
                <h3 className="crop-name">{crop.name}</h3>
                <p className="crop-desc">{crop.description}</p>
                <button type="button" className="crop-study-link" onClick={() => navigate("/login")}>Acessar estudos <span aria-hidden="true">→</span></button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ──── CTA ──── */}
      <section className="cta-section">
        <div className="cta-brand">
          <img src={`${process.env.PUBLIC_URL}/img/logo-agrovia.png`} alt="Agrovia Logo" className="cta-logo-img" />
          <span className="cta-brand-name">AGRO<span>VIA</span></span>
        </div>
        <p className="section-tag">Agrovia</p>
        <h2 className="section-title">Acompanhe sua operação com mais contexto</h2>
        <p className="section-body">
          Entre na plataforma para organizar campos, consultar sensores e acessar os estudos agrícolas disponíveis.
        </p>
        <div className="cta-btns">
          <button className="btn-primary" onClick={() => navigate("/login")}>
            Acessar plataforma
          </button>
          <button className="btn-outline" onClick={() => window.scrollTo(0, 0)}>
            Voltar ao Topo
          </button>
        </div>
      </section>

      {/* ──── FOOTER ──── */}
      <footer className="footer">
        <div className="footer-logo">
          <img src={`${process.env.PUBLIC_URL}/img/logo-agrovia.png`} alt="Agrovia Logo" className="footer-logo-img" style={{ height: '36px' }} />
          AGRO<span>VIA</span>
        </div>
        <div className="footer-copy">© 2026 AGROVIA · TCC UNASP Engenheiro Coelho</div>
        <div className="footer-links">
          <a href="#about">Sobre</a>
          <a href="#how">Como Funciona</a>
          <a href="#features">Recursos</a>
          <a href="#library">Estudos Agrícolas</a>
        </div>
      </footer>
    </div>
  );
};

export default ParallaxDrops;
