import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, ArrowUp, BookOpen, CloudSun, Cpu, Droplets, FileText, Map, Radio, ShieldCheck, Sprout, Waves } from "lucide-react";
import { useLandingMotion } from "../hooks/useLandingMotion";
import { CenaIrrigacao, ChuvaDistante, ChuvaProxima } from "./HeroIrrigacao";
import "../styles/landing.css";
import { useTituloPagina } from '../hooks/useTituloPagina';

const processSteps = [
  { title: "Observe o solo", description: "Textura, profundidade, cobertura e drenagem mudam a forma como a água se movimenta e fica disponível às raízes. Uma leitura representa o local e a camada em que foi feita.", icon: Droplets },
  { title: "Registre as leituras", description: "Sensores instalados e calibrados podem registrar variações de umidade ao longo do tempo. Posição, profundidade e manutenção influenciam a qualidade da medição.", icon: Radio },
  { title: "Organize o contexto", description: "Associe registros ao campo, à cultura, à fase de desenvolvimento e às condições do tempo. Esse contexto ajuda a comparar períodos sem tratar uma medida isolada como regra.", icon: Map },
  { title: "Avalie a necessidade", description: "Considere os dados junto da observação da lavoura, do solo e do sistema de irrigação. A plataforma apoia a análise; não aciona irrigação automaticamente.", icon: Activity },
  { title: "Acompanhe os resultados", description: "Registre o manejo realizado e observe a resposta da área para revisar o planejamento. Comparações úteis dependem de dados consistentes e de condições locais.", icon: FileText },
];

const benefits = [
  { title: "Umidade com contexto", description: "Acompanhe leituras vinculadas a um ponto e a uma profundidade; elas não representam, sozinhas, todo o talhão.", icon: Droplets },
  { title: "Planejamento mais informado", description: "Cruze observações, clima, fase da cultura e capacidade do sistema antes de definir o manejo hídrico.", icon: CloudSun },
  { title: "Campos organizados", description: "Reúna localização, cultura e dados de área cadastrados para facilitar consultas e comparações.", icon: Map },
  { title: "Dispositivos identificados", description: "Consulte nome, vínculo e status de conexão dos dispositivos registrados na plataforma.", icon: Radio },
  { title: "Pontos de atenção visíveis", description: "Identifique falta de informação ou mudanças que merecem conferência no campo, sem classificar automaticamente uma área como crítica.", icon: Activity },
  { title: "Histórico com continuidade", description: "As leituras enviadas pelos ESP32 ficam guardadas e podem apoiar comparações entre datas e operações.", icon: FileText },
];

// Caminho de uma leitura, do solo ao painel (conforme o firmware em /firmware/esp32-agrovia).
const sensorFlow = [
  { title: "Sensor capacitivo", description: "Mede a umidade na camada em que foi instalado. O modelo capacitivo resiste melhor à corrosão do que o resistivo.", icon: Droplets },
  { title: "ESP32", description: "Converte o sinal do sensor e envia uma leitura a cada 60 segundos pela rede Wi-Fi.", icon: Cpu },
  { title: "API Agrovia", description: "Recebe a leitura por HTTPS, confere a chave do dispositivo e grava no histórico de umidade.", icon: ShieldCheck },
  { title: "Painel", description: "Mostra as leituras recentes e indica se o aparelho está conectado.", icon: Activity },
];

const sensorFacts = [
  "Leitura a cada 60 s",
  "HTTPS com chave por dispositivo",
  "Conectado: leitura nos últimos 3 min",
  "Calibração por tipo de solo",
];

const faqs = [
  { question: "A Agrovia liga a irrigação sozinha?", answer: "Não. Hoje a irrigação é acionada manualmente pelo painel, com duração definida, e o próprio ESP32 encerra o acionamento no tempo limite, mesmo sem internet. A decisão continua com quem conhece a área." },
  { question: "Preciso ter um sensor para usar a plataforma?", answer: "Não. É possível cadastrar fazendas e campos e consultar os estudos agrícolas sem sensor. Leituras de umidade e o status do aparelho aparecem quando um ESP32 estiver vinculado." },
  { question: "Que placa e que sensor são usados?", answer: "Um ESP32 com Wi-Fi 2,4 GHz e um sensor capacitivo de umidade do solo. O capacitivo é preferido porque o resistivo corrói em poucas semanas." },
  { question: "Uma leitura vale para o talhão inteiro?", answer: "Não. Ela representa o ponto e a profundidade onde o sensor está. Em áreas maiores, mais pontos de medição e a observação em campo ajudam a entender a variação." },
  { question: "Os dados substituem a orientação agronômica?", answer: "Não. A plataforma organiza informações para apoiar a análise; a recomendação precisa ser adaptada a cada propriedade por um profissional." },
  { question: "Quais culturas têm estudos disponíveis?", answer: "Milho, soja, cana-de-açúcar, café e feijão, com capítulos navegáveis, busca por assunto e referências técnicas ao final." },
];

const features = [
  { title: "Painel de monitoramento", description: "Veja campos, dispositivos conectados e o gráfico de umidade do solo com as leituras enviadas pelos ESP32, atualizado automaticamente.", icon: Activity },
  { title: "Campos e propriedades", description: "Cadastre fazendas com localização, cultura, área e talhões. Informações não preenchidas continuam identificadas como ausentes.", icon: Sprout },
  { title: "Sensores e dispositivos", description: "Cadastre o ESP32 pelo código MAC, gere a chave do aparelho, acompanhe as leituras e envie comandos de irrigação com duração definida.", icon: Radio },
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
  { href: "#sensor", label: "Sensor" },
  { href: "#benefits", label: "Benefícios" },
  { href: "#features", label: "Recursos" },
  { href: "#library", label: "Estudos" },
];

const revealDelay = (index: number) => ({ "--reveal-delay": `${Math.min(index, 5) * 70}ms` } as React.CSSProperties);

/**
 * Onda de transição no topo de uma seção, nas passagens entre fundo escuro e claro: preenchida com a
 * cor da seção anterior e contornada por um fio neon. `invertida` espelha o desenho para alternar o ritmo.
 */
const Onda: React.FC<{ cor: string; invertida?: boolean }> = ({ cor, invertida = false }) => (
  <svg
    className={`onda${invertida ? " onda--invertida" : ""}`}
    style={{ "--onda-cor": cor } as React.CSSProperties}
    viewBox="0 0 1440 120"
    preserveAspectRatio="none"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M0 0H1440V54C1180 112 940 30 720 62C500 94 260 118 0 70Z" />
    <path className="onda-linha" d="M0 70C260 118 500 94 720 62C940 30 1180 112 1440 54" />
  </svg>
);

const BrandWord: React.FC = () => (
  <span className="brand-word">AGRO<span className="brand-word-accent">VIA</span></span>
);

const ParallaxDrops: React.FC = () => {
  useTituloPagina();
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const heroTrackRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const heroBgRef = useRef<HTMLDivElement>(null);
  const heroGlowRef = useRef<HTMLDivElement>(null);
  const heroDropsRef = useRef<SVGSVGElement>(null);
  const rainNearRef = useRef<SVGSVGElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const midSectionRef = useRef<HTMLDivElement>(null);
  const midBgRef = useRef<HTMLDivElement>(null);

  useLandingMotion({
    root: rootRef,
    nav: navRef,
    heroTrack: heroTrackRef,
    hero: heroRef,
    heroBg: heroBgRef,
    heroGlow: heroGlowRef,
    heroDrops: heroDropsRef,
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
      {/* O trilho é mais alto que a tela: enquanto ele passa, o hero fica fixo e a rolagem conduz a cena. */}
      <div className="hero-trilho" ref={heroTrackRef}>
      <section className="hero" id="top" ref={heroRef}>
        <div className="hero-bg" ref={heroBgRef} aria-hidden="true"></div>
        <div className="hero-glow" ref={heroGlowRef} aria-hidden="true"></div>
        <ChuvaDistante ref={heroDropsRef} />
        <CenaIrrigacao />
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
      </div>

      {/* ──── ABOUT ──── */}
      <section className="about com-onda" id="about">
        <Onda cor="#050f0b" />
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
      <section className="how com-onda" id="how">
        <Onda cor="#f2f7ed" invertida />
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

      {/* ──── SENSOR ──── */}
      <section className="sensor" id="sensor">
        <div className="section-heading reveal">
          <p className="section-tag">Hardware</p>
          <h2 className="section-title">Do sensor à <span className="text-neon">plataforma</span></h2>
          <p className="section-body">O caminho de uma leitura de umidade, desde o solo até o painel da Agrovia.</p>
        </div>
        <div className="fluxo">
          <span className="fluxo-trilho" aria-hidden="true"></span>
          <ol className="fluxo-lista">
            {sensorFlow.map(({ title, description, icon: Icon }, index) => (
              <li className="fluxo-etapa reveal" key={title} style={revealDelay(index)}>
                <span className="fluxo-icone"><Icon size={26} aria-hidden="true" /></span>
                <span className="fluxo-numero">0{index + 1}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </li>
            ))}
          </ol>
        </div>
        <ul className="sensor-fatos reveal">
          {sensorFacts.map((fact) => <li key={fact}>{fact}</li>)}
        </ul>
        <div className="sensor-nota reveal">
          <span className="sensor-nota-icone"><Waves size={20} aria-hidden="true" /></span>
          <p><strong>Irrigação pelo painel:</strong> o produtor pode enviar um comando manual com duração definida, e o ESP32 fecha a válvula ao fim do tempo, mesmo sem internet. A irrigação automática por limiar de umidade ainda não está ativa.</p>
        </div>
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
      <section className="benefits com-onda" id="benefits">
        <Onda cor="#09100d" />
        <div className="section-heading reveal">
          <p className="section-tag">Uso consciente</p>
          <h2 className="section-title">Mais contexto para o manejo</h2>
          <p className="section-body">A tecnologia pode ajudar a organizar o trabalho e a observar mudanças; os resultados dependem do uso e das condições locais.</p>
        </div>
        <ul className="benefit-list">
          {benefits.map(({ title, description, icon: Icon }, index) => (
            <li key={title} className="reveal" style={revealDelay(index % 3)}>
              <span aria-hidden="true"><Icon size={20} /></span>
              <div><strong>{title}</strong><small>{description}</small></div>
            </li>
          ))}
        </ul>
      </section>

      {/* ──── FEATURES ──── */}
      <section className="features com-onda" id="features">
        <Onda cor="#edf2e8" invertida />
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
            </article>
          ))}
        </div>
        <div className="features-acao reveal">
          <p>Todos os recursos ficam disponíveis depois de entrar na plataforma.</p>
          <button type="button" className="btn-primary" onClick={irParaLogin}>
            Acessar a plataforma <span aria-hidden="true">→</span>
          </button>
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

      {/* ──── FAQ ──── */}
      <section className="faq com-onda" id="faq">
        <Onda cor="#0e1a0f" />
        <div className="faq-intro reveal">
          <p className="section-tag">Dúvidas</p>
          <h2 className="section-title">Perguntas frequentes</h2>
          <p className="section-body">O que a plataforma faz hoje, o que depende do sensor e onde a decisão continua sendo de quem está no campo.</p>
        </div>
        <div className="faq-lista">
          {faqs.map(({ question, answer }, index) => (
            <details className="faq-item reveal" key={question} style={revealDelay(index)}>
              <summary>
                {question}
                <span className="faq-sinal" aria-hidden="true"></span>
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ──── CTA ──── */}
      <section className="cta-section com-onda">
        <Onda cor="#f0f6ea" invertida />
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
          <a href="#sensor">Sensor</a>
          <a href="#features">Recursos</a>
          <a href="#library">Estudos Agrícolas</a>
          <a href="#faq">Dúvidas</a>
        </nav>
      </footer>

      {/* Aparece depois da cena do irrigador (o script alterna .landing--topo no container). */}
      <button type="button" className="voltar-topo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Voltar ao topo">
        <ArrowUp size={20} aria-hidden="true" />
      </button>
    </div>
  );
};

export default ParallaxDrops;
