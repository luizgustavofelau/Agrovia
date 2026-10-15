import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, Search, Sprout } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CropStudy, cropStudies } from "../content/agriculturalStudies";
import "../styles/agricultural-studies.css";

type ReadingProgress = Record<string, { current: number; completed: number[] }>;

const glossary = [
  { term: "Balanço hídrico", meaning: "Comparação entre entradas de água, como chuva e irrigação, e saídas, como evapotranspiração e escoamento." },
  { term: "Evapotranspiração", meaning: "Soma da água evaporada do solo e da água transpirada pelas plantas para a atmosfera." },
  { term: "Fenologia", meaning: "Estudo das fases de desenvolvimento da planta e de sua relação com o ambiente." },
  { term: "Capacidade de armazenamento", meaning: "Quantidade de água que o perfil do solo consegue reter e disponibilizar às raízes, conforme suas características." },
  { term: "Telemetria", meaning: "Coleta e transmissão de medições de dispositivos para um sistema de acompanhamento." },
];

function loadProgress(storageKey: string): ReadingProgress {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "{}") as ReadingProgress;
  } catch {
    return {};
  }
}

function buildSearchText(study: CropStudy) {
  return [
    study.name,
    study.category,
    study.summary,
    ...study.tags,
    ...study.chapters.flatMap((chapter) => [
      chapter.title,
      chapter.introduction,
      chapter.practice,
      chapter.attention,
      ...chapter.sections.flatMap((section) => [section.title, section.text]),
    ]),
  ].join(" ").toLocaleLowerCase("pt-BR");
}

export default function AgriculturalStudies() {
  const location = useLocation();
  const studyPath = location.pathname.split("/").filter(Boolean);
  const slug = studyPath[2];
  const chapterParam = studyPath[3];
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [cropFilter, setCropFilter] = useState("todas");
  const userId = localStorage.getItem("usuarioId") || "conta";
  const storageKey = `agrovia-study-progress:${userId}`;
  const [progress, setProgress] = useState<ReadingProgress>(() => loadProgress(storageKey));
  const study = cropStudies.find((item) => item.slug === slug);
  const parsedChapter = Number(chapterParam || 0);
  const chapterIndex = Number.isInteger(parsedChapter) && parsedChapter >= 0 ? parsedChapter : 0;
  const chapter = study?.chapters[chapterIndex];

  useEffect(() => {
    setProgress(loadProgress(storageKey));
  }, [storageKey]);

  useEffect(() => {
    if (!study || !chapter) return;
    const latest = loadProgress(storageKey);
    latest[study.slug] = {
      current: chapterIndex,
      completed: latest[study.slug]?.completed || [],
    };
    localStorage.setItem(storageKey, JSON.stringify(latest));
    setProgress(latest);
  }, [storageKey, study, chapter, chapterIndex]);

  const visibleStudies = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
    return cropStudies.filter((item) => {
      const matchesCrop = cropFilter === "todas" || item.slug === cropFilter;
      return matchesCrop && (!normalizedSearch || buildSearchText(item).includes(normalizedSearch));
    });
  }, [search, cropFilter]);

  function goToChapter(targetStudy: CropStudy, index: number) {
    navigate(`/painel/estudos/${targetStudy.slug}/${index}`);
  }

  function toggleCompleted() {
    if (!study) return;
    const current = progress[study.slug] || { current: chapterIndex, completed: [] };
    const completed = current.completed.includes(chapterIndex)
      ? current.completed.filter((item) => item !== chapterIndex)
      : [...current.completed, chapterIndex];
    const updated = { ...progress, [study.slug]: { ...current, completed } };
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setProgress(updated);
  }

  if (slug && (!study || !chapter)) {
    return (
      <main className="study-library">
        <div className="study-not-found">
          <BookOpen size={28} aria-hidden="true" />
          <h1>Material não encontrado</h1>
          <p>Este estudo ou capítulo não está disponível.</p>
          <Link to="/painel/estudos">Voltar à biblioteca</Link>
        </div>
      </main>
    );
  }

  if (study && chapter) {
    const completedChapters = progress[study.slug]?.completed || [];
    const isCompleted = completedChapters.includes(chapterIndex);
    const completionPercent = Math.round((completedChapters.length / study.chapters.length) * 100);

    return (
      <main className="study-library study-reading-page">
        <div className="study-reading-topline">
          <Link to="/painel/estudos" className="study-back-link"><ArrowLeft size={16} /> Biblioteca</Link>
          <div className="study-crop-switcher" aria-label="Trocar cultura">
            {cropStudies.filter((item) => item.slug !== study.slug).map((item) => (
              <Link key={item.slug} to={`/painel/estudos/${item.slug}/0`} title={`Estudar ${item.name}`}>
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        <header className="study-book-header">
          <div className="study-book-kicker"><BookOpen size={16} /> ESTUDO AGRÍCOLA · {study.category}</div>
          <h1>{study.name}</h1>
          <p>{study.summary}</p>
          <div className="study-progress-label">
            <span>{completedChapters.length} de {study.chapters.length} capítulos concluídos</span>
            <span>{completionPercent}%</span>
          </div>
          <div className="study-progress-track" role="progressbar" aria-label="Progresso do estudo" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completionPercent}>
            <span style={{ width: `${completionPercent}%` }} />
          </div>
        </header>

        <div className="study-reader-layout">
          <nav className="study-toc" aria-label="Sumário do material">
            <p>SUMÁRIO</p>
            {study.chapters.map((item, index) => (
              <button
                type="button"
                key={item.title}
                className={index === chapterIndex ? "active" : ""}
                aria-current={index === chapterIndex ? "step" : undefined}
                onClick={() => goToChapter(study, index)}
              >
                <span className="study-toc-number">{String(index + 1).padStart(2, "0")}</span>
                <span>{item.title}</span>
                {completedChapters.includes(index) && <Check size={14} aria-label="Concluído" />}
              </button>
            ))}
          </nav>

          <article className="study-chapter-content">
            <div className="study-chapter-meta">CAPÍTULO {String(chapterIndex + 1).padStart(2, "0")} · {study.chapters.length} CAPÍTULOS</div>
            <h2>{chapter.title}</h2>
            <p className="study-chapter-intro">{chapter.introduction}</p>
            {chapter.sections.map((section) => (
              <section className="study-reading-section" key={section.title}>
                <h3>{section.title}</h3>
                <p>{section.text}</p>
              </section>
            ))}
            <aside className="study-callout practice">
              <strong>Na prática</strong>
              <p>{chapter.practice}</p>
            </aside>
            <aside className="study-callout attention">
              <strong>Atenção técnica</strong>
              <p>{chapter.attention}</p>
            </aside>

            {chapterIndex === study.chapters.length - 1 && (
              <section className="study-references">
                <h3>Referências para aprofundamento</h3>
                <p>Fontes institucionais consultadas na preparação deste material:</p>
                {study.references.map((reference) => (
                  <a href={reference.url} key={reference.url} target="_blank" rel="noreferrer">
                    <span>{reference.title}</span><small>{reference.institution} · abrir fonte oficial</small>
                  </a>
                ))}
              </section>
            )}

            <div className="study-chapter-actions">
              <button type="button" className={`study-complete-button ${isCompleted ? "completed" : ""}`} onClick={toggleCompleted}>
                <Check size={16} /> {isCompleted ? "Capítulo concluído" : "Marcar como concluído"}
              </button>
              <div>
                <button type="button" onClick={() => goToChapter(study, chapterIndex - 1)} disabled={chapterIndex === 0} aria-label="Capítulo anterior"><ArrowLeft size={17} /></button>
                <button type="button" onClick={() => goToChapter(study, chapterIndex + 1)} disabled={chapterIndex === study.chapters.length - 1} aria-label="Próximo capítulo"><ArrowRight size={17} /></button>
              </div>
            </div>
            <p className="study-disclaimer">Conteúdo educativo. Recomendações de manejo devem ser adaptadas à propriedade com apoio de assistência técnica.</p>
          </article>
        </div>
      </main>
    );
  }

  return (
    <main className="study-library">
      <header className="study-library-header">
        <div>
          <p className="study-library-eyebrow"><Sprout size={15} /> CONHECIMENTO NO CAMPO</p>
          <h1>Estudos Agrícolas</h1>
          <p>Materiais de consulta por cultura, do conceito básico aos critérios de manejo e monitoramento.</p>
        </div>
        <div className="study-library-count"><strong>{cropStudies.length.toString().padStart(2, "0")}</strong><span>cadernos<br />de estudo</span></div>
      </header>

      <section className="study-search-section" aria-label="Buscar estudos">
        <label className="study-search-field">
          <Search size={19} aria-hidden="true" />
          <span className="sr-only">Buscar por cultura ou assunto</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar cultura, tema ou capítulo" type="search" />
        </label>
        <label className="study-filter-field">
          <span>Cultura</span>
          <select value={cropFilter} onChange={(event) => setCropFilter(event.target.value)}>
            <option value="todas">Todas</option>
            {cropStudies.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
          </select>
        </label>
      </section>

      <section className="study-card-grid" aria-label="Materiais disponíveis">
        {visibleStudies.map((item) => {
          const savedProgress = progress[item.slug];
          const resumeChapter = savedProgress?.current || 0;
          return (
            <article className="study-card" key={item.slug}>
              <div
                className={`study-card-image ${item.image ? "has-image" : "study-card-no-image"}`}
                style={item.image ? { backgroundImage: `url('${item.image}')` } : undefined}
                role={item.image ? "img" : undefined}
                aria-label={item.image ? item.imageAlt || `Plantação de ${item.name}` : undefined}
              >
                <span>{item.category}</span>
                {!item.image && <Sprout size={32} aria-hidden="true" />}
                {item.imageCredit && <small className="study-card-image-credit">{item.imageCredit}</small>}
              </div>
              <div className="study-card-content">
                <div className="study-card-level">{item.level} <span>·</span> {item.chapters.length} capítulos</div>
                <h2>{item.name}</h2>
                <p>{item.summary}</p>
                <div className="study-tags">{item.tags.slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}</div>
                <Link className="study-open-link" to={`/painel/estudos/${item.slug}/${resumeChapter}`}>
                  {savedProgress ? "Continuar leitura" : "Abrir material"}<ChevronRight size={17} />
                </Link>
              </div>
            </article>
          );
        })}
        {visibleStudies.length === 0 && (
          <div className="study-search-empty" role="status">
            <Search size={21} aria-hidden="true" />
            <p>Nenhum conteúdo encontrado.</p>
            <button type="button" onClick={() => { setSearch(""); setCropFilter("todas"); }}>Limpar busca e filtros</button>
          </div>
        )}
      </section>

      <details className="study-glossary">
        <summary>Glossário agrícola <ChevronRight size={17} /></summary>
        <dl>{glossary.map((item) => <div key={item.term}><dt>{item.term}</dt><dd>{item.meaning}</dd></div>)}</dl>
      </details>

      <p className="study-library-disclaimer">Os estudos são materiais educativos, não substituem análise local nem recomendação agronômica. Consulte as fontes oficiais indicadas ao final de cada material.</p>
    </main>
  );
}