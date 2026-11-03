import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, BookOpen, CloudSun, Droplets, FileText, Map, Radio, Sprout, Waves } from "lucide-react";
import { useLandingMotion } from "../hooks/useLandingMotion";
import { ChuvaDistante, ChuvaProxima, IrrigadorAnimado } from "./HeroIrrigacao";
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

const LOGO_SRC = `${process.env.PUBLIC_URL}/img/logo-agrovia.png`;

const navLinks = [
  { href: "#about", label: "Sobre" },
  { href: "#how", label: "Como Funciona" },
  { href: "#benefits", label: "Benefícios" },
  { href: "#features", label: "Recursos" },
  { href: "#library", label: "Estudos" },
];

const revealDelay = (index: number) => ({ "--reveal-delay": `${Math.min(index, 5) * 70}ms` } as React.CSSProperties);

const BrandWord: React.FC = () => (
  <span className="brand-word">AGRO<span className="brand-word-accent">VIA</span></span>
);

const ParallaxDrops: React.FC = () => {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const heroBgRef = useRef<HTMLDivElement>(null);
  const heroGlowRef = useRef<HTMLDivElement>(null);
  const heroDropsRef = useRef<SVGSVGElement>(null);
  const sprinklerRef = useRef<SVGSVGElement>(null);
  const rainNearRef = useRef<SVGSVGElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const midSectionRef = useRef<HTMLDivElement>(null);
  const midBgRef = useRef<HTMLDivElement>(null);

  useLandingMotion({
    root: rootRef,
    nav: navRef,
    hero: heroRef,
    heroBg: heroBgRef,
    heroGlow: heroGlowRef,
    heroDrops: heroDropsRef,
    sprinkler: sprinklerRef,
    rainNear: rainNearRef,
    heroContent: heroContentRef,
    mid: midSectionRef,
    midBg: midBgRef,
  });

  const irParaLogin = () => navigate("/login");
  const irParaCadastro = () => navigate("/cadastro");
  const rolarAte = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="landing-container" ref={rootRef}>
      {/* ──── NAV ──── */}
      <nav className="nav" ref={navRef} aria-label="Navegação da página inicial">
        <a className="nav-logo" href="#top" onClick={(event) => { event.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
          <img src={LOGO_SRC} alt="" className="nav-logo-img" width="42" height="42" />
          <BrandWord />
        </a>
        <ul className="nav-links">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>
        <div className="nav-actions">
          <button type="button" className="nav-signup" onClick={irParaCadastro}>
            Criar conta
          </button>
          <button type="button" className="nav-cta" onClick={irParaLogin}>
            Fazer Login
          </button>
        </div>
      </nav>

      {/* ──── HERO ──── */}
      <section className="hero" id="top" ref={heroRef}>
        <div className="hero-bg" ref={heroBgRef} aria-hidden="true"></div>
        <div className="hero-glow" ref={heroGlowRef} aria-hidden="true"></div>
        <ChuvaDistante ref={heroDropsRef} />
        <IrrigadorAnimado ref={sprinklerRef} />
        <ChuvaProxima ref={rainNearRef} />
        <div className="hero-content" ref={heroContentRef}>
          <p className="hero-eyebrow">Irrigação Inteligente · ESP32 · IoT · Agronegócio</p>
          <h1 className="hero-title">
            Decisões melhores <span className="text-neon">começam no solo</span>
          </h1>
          <p className="hero-sub">
            A Agrovia organiza informações da propriedade e dos dispositivos para apoiar o acompanhamento da umidade do solo. Ao relacionar essas observações com clima, cultura e fase de desenvolvimento, o produtor ganha contexto para planejar a irrigação. A decisão continua dependente das condições e da avaliação de cada área.
          </p>
          <div className="hero-btns">
            <button type="button" className="btn-primary" onClick={irParaLogin}>
              Acessar plataforma <span aria-hidden="true">→</span>
            </button>
            <button type="button" className="btn-ghost" onClick={() => rolarAte("features")}>
              Conhecer recursos
            </button>
          </div>
        </div>
        <a className="hero-scroll" href="#about" aria-label="Rolar para a seção Sobre">
          <span aria-hidden="true"></span>
        </a>
      </section>

      {/* ──── ABOUT ──── */}
      <section className="about" id="about">
        <div className="about-visual reveal" aria-label="Solo, sensores e análise">
          <div className="about-visual-line"><span><Waves size={22} aria-hidden="true" /></span><div><strong>Solo</strong><small>Condições variáveis</small></div></div>
          <div className="about-visual-line"><span><Radio size={22} aria-hidden="true" /></span><div><strong>Informações</strong><small>Leituras e registros</small></div></div>
          <div className="about-visual-line"><span><Sprout size={22} aria-hidden="true" /></span><div><strong>Manejo</strong><small>Decisão contextualizada</small></div></div>
        </div>
        <div className="about-copy reveal" style={revealDelay(1)}>
          <p className="section-tag">Monitoramento</p>
          <h2 className="section-title">Entenda o que acontece antes de irrigar</h2>
          <p className="section-body">A água no solo não é uniforme: textura, estrutura, relevo, cobertura e profundidade das raízes influenciam infiltração e armazenamento. Por isso, uma medição representa apenas o local e a camada em que foi feita. Interpretada junto da chuva, do clima, da cultura e de sua fase, ela pode compor uma análise mais completa da área.</p>
          <p className="section-body about-followup">A plataforma ajuda a reunir esse contexto e a consultar os registros disponíveis. Ela não substitui a observação da lavoura, a calibração do sensor nem a orientação agronômica adaptada à propriedade.</p>
          <a className="text-link" href="#how">Veja como a plataforma organiza esse processo <span aria-hidden="true">→</span></a>
        </div>
      </section>

      {/* ──── HOW IT WORKS ──── */}
      <section className="how" id="how">
        <div className="section-heading reveal">
          <p className="section-tag">Processo</p>
          <h2 className="section-title">Da leitura à decisão</h2>
          <p className="section-body">Um percurso para transformar observações em informação organizada e apoiar uma decisão revisável, com a realidade do talhão sempre em primeiro plano.</p>
        </div>
        <ol className="how-grid">
          {processSteps.map(({ title, description, icon: Icon }, index) => (
            <li className="how-step reveal" key={title} style={revealDelay(index)}>
              <div className="step-head">
                <span className="step-number">0{index + 1}</span>
                <span className="step-icon"><Icon size={22} aria-hidden="true" /></span>
              </div>
              <h3 className="step-title">{title}</h3>
              <p className="step-desc">{description}</p>
            </li>
          ))}
        </ol>
        <p className="process-note">O fluxo é educativo. A coleta, o histórico e qualquer automação dependem dos sensores e das integrações efetivamente instalados e configurados.</p>
      </section>

      {/* ──── PARALLAX MID ──── */}
      <div className="parallax-mid" ref={midSectionRef}>
        <div className="parallax-mid-bg" ref={midBgRef} aria-hidden="true"></div>
        <div className="parallax-mid-content reveal">
          <div className="mid-brand">
            <img src={LOGO_SRC} alt="" className="mid-logo-img" width="56" height="56" loading="lazy" />
          </div>
          <p className="pull-quote">
            Conhecimento e contexto,{" "}
            <span className="text-neon">a serviço do campo.</span>
          </p>
        </div>
      </div>

      {/* ──── BENEFITS ──── */}
      <section className="benefits" id="benefits">
        <div className="section-heading reveal">
          <p className="section-tag">Uso consciente</p>
          <h2 className="section-title">Mais contexto para o manejo</h2>
          <p className="section-body">A tecnologia pode ajudar a organizar o trabalho e a observar mudanças; os resultados dependem do uso e das condições locais.</p>
        </div>
        <ul className="benefit-list">
          {benefits.map((benefit, index) => (
            <li key={benefit.title} className="reveal" style={revealDelay(index % 3)}>
              <span aria-hidden="true">+</span>
              <div><strong>{benefit.title}</strong><small>{benefit.description}</small></div>
            </li>
          ))}
        </ul>
      </section>

      {/* ──── FEATURES ──── */}
      <section className="features" id="features">
        <div className="section-heading reveal">
          <p className="section-tag">Plataforma</p>
          <h2 className="section-title">Informação agrícola em um só lugar</h2>
          <p className="section-body">Acesse as áreas disponíveis após entrar. Recursos que ainda dependem de integração são identificados dentro do painel.</p>
        </div>
        <div className="feature-grid">
          {features.map(({ title, description, icon: Icon }, index) => (
            <article className="feature-card reveal" key={title} style={revealDelay(index % 3)}>
              <span className="feature-icon"><Icon size={21} aria-hidden="true" /></span>
              <h3>{title}</h3>
              <p>{description}</p>
              <button type="button" onClick={irParaLogin}>Acessar após login <span aria-hidden="true">→</span></button>
            </article>
          ))}
        </div>
      </section>

      {/* ──── LIBRARY PREVIEW ──── */}
      <section className="crops" id="library">
        <div className="section-heading reveal">
          <p className="section-tag">Conhecimento aplicado</p>
          <h2 className="section-title">Estudos Agrícolas</h2>
          <p className="section-body">Materiais de consulta sobre cinco culturas, com conteúdo educativo e referências técnicas para aprofundar cada tema.</p>
        </div>
        <div className="crops-grid">
          {cropPreviews.map((crop, index) => (
            <article className="crop-card reveal" key={crop.name} style={revealDelay(index)}>
              <div className="crop-img">
                <img src={crop.image} alt={crop.imageAlt} loading="lazy" decoding="async" width="400" height="300" />
                <span className="crop-badge">{crop.category}</span>
                {crop.imageCredit && <small className="crop-photo-credit">{crop.imageCredit}</small>}
              </div>
              <div className="crop-body">
                <h3 className="crop-name">{crop.name}</h3>
                <p className="crop-desc">{crop.description}</p>
                <button type="button" className="crop-study-link" onClick={irParaLogin}>Acessar estudos <span aria-hidden="true">→</span></button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ──── CTA ──── */}
      <section className="cta-section">
        <div className="cta-panel reveal">
          <div className="cta-brand">
            <img src={LOGO_SRC} alt="" className="cta-logo-img" width="52" height="52" loading="lazy" />
            <span className="cta-brand-name"><BrandWord /></span>
          </div>
          <p className="section-tag">Agrovia</p>
          <h2 className="section-title">Acompanhe sua operação com mais contexto</h2>
          <p className="section-body">
            Entre na plataforma para organizar campos, consultar sensores e acessar os estudos agrícolas disponíveis.
          </p>
          <div className="cta-btns">
            <button type="button" className="btn-primary" onClick={irParaCadastro}>
              Criar conta grátis <span aria-hidden="true">→</span>
            </button>
            <button type="button" className="btn-ghost" onClick={irParaLogin}>
              Já tenho conta
            </button>
            <button type="button" className="btn-ghost" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              Voltar ao Topo
            </button>
          </div>
        </div>
      </section>

      {/* ──── FOOTER ──── */}
      <footer className="footer">
        <div className="footer-logo">
          <img src={LOGO_SRC} alt="" className="footer-logo-img" width="36" height="36" loading="lazy" />
          <BrandWord />
        </div>
        <div className="footer-copy">© 2026 AGROVIA · TCC UNASP Engenheiro Coelho</div>
        <nav className="footer-links" aria-label="Links do rodapé">
          <a href="#about">Sobre</a>
          <a href="#how">Como Funciona</a>
          <a href="#features">Recursos</a>
          <a href="#library">Estudos Agrícolas</a>
        </nav>
      </footer>
    </div>
  );
};

export default ParallaxDrops;
