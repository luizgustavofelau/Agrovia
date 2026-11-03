import { RefObject, useEffect } from "react";

export interface LandingMotionRefs {
  nav: RefObject<HTMLElement>;
  hero: RefObject<HTMLElement>;
  heroBg: RefObject<HTMLDivElement>;
  heroGlow: RefObject<HTMLDivElement>;
  heroDrops: RefObject<SVGSVGElement>;
  sprinkler: RefObject<SVGSVGElement>;
  rainNear: RefObject<SVGSVGElement>;
  heroContent: RefObject<HTMLDivElement>;
  mid: RefObject<HTMLDivElement>;
  midBg: RefObject<HTMLDivElement>;
  root: RefObject<HTMLElement>;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
// Fração percorrida por quadro em direção ao alvo: dá a sensação de inércia sem atrasar demais.
const SUAVIZACAO = 0.14;
const PONTEIRO_SUAVIZACAO = 0.08;

/**
 * Parallax e animações de entrada da landing.
 *
 * Os deslocamentos são escritos direto no DOM dentro de requestAnimationFrame,
 * sem estado React: rolar a página não re-renderiza o componente. O laço de
 * animação só roda enquanto há movimento (rolagem ou ponteiro) e para sozinho
 * quando os valores suavizados alcançam o alvo. Cada camada só é calculada com
 * a seção visível, os deslocamentos ficam dentro da sobra de cada imagem (não
 * aparecem bordas vazias) e tudo é desligado quando o sistema pede movimento reduzido.
 */
export function useLandingMotion(refs: LandingMotionRefs) {
  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const ponteiroFino = window.matchMedia("(hover: hover) and (pointer: fine)");
    const visible = { hero: true, mid: false };
    const cropsVisiveis = new Set<HTMLElement>();
    let frame = 0;
    let viewportHeight = window.innerHeight;
    let heroHeight = refs.hero.current?.offsetHeight ?? viewportHeight;
    let intensity = 1;
    // Valores-alvo (lidos do navegador) e valores suavizados (aplicados na tela).
    let alvoScroll = window.scrollY;
    let scroll = alvoScroll;
    const alvoPonteiro = { x: 0, y: 0 };
    const ponteiro = { x: 0, y: 0 };

    const cropImgs = Array.from(refs.root.current?.querySelectorAll<HTMLElement>(".crop-img > img") ?? []);
    const midContent = refs.mid.current?.querySelector<HTMLElement>(".parallax-mid-content") ?? null;

    const setTransform = (element: Element | null | undefined, x: number, y: number, scale = 1) => {
      if (!element) return;
      (element as HTMLElement).style.transform =
        `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)${scale !== 1 ? ` scale(${scale.toFixed(4)})` : ""}`;
    };

    const resetLayers = () => {
      [refs.heroBg, refs.heroGlow, refs.heroDrops, refs.sprinkler, refs.rainNear, refs.heroContent, refs.midBg].forEach((ref) => {
        const element = ref.current as HTMLElement | null;
        if (element) element.style.transform = "";
      });
      cropImgs.forEach((img) => { img.style.transform = ""; });
      if (midContent) midContent.style.transform = "";
      if (refs.heroContent.current) refs.heroContent.current.style.opacity = "";
    };

    const render = () => {
      frame = 0;
      refs.nav.current?.classList.toggle("nav--scrolled", alvoScroll > 24);
      if (motionQuery.matches) return;

      scroll += (alvoScroll - scroll) * SUAVIZACAO;
      ponteiro.x += (alvoPonteiro.x - ponteiro.x) * PONTEIRO_SUAVIZACAO;
      ponteiro.y += (alvoPonteiro.y - ponteiro.y) * PONTEIRO_SUAVIZACAO;
      if (Math.abs(alvoScroll - scroll) < 0.1) scroll = alvoScroll;

      if (visible.hero && scroll <= heroHeight) {
        const s = scroll * intensity;
        const px = ponteiro.x;
        const py = ponteiro.y;
        // Camadas mais "distantes" andam menos com o ponteiro e mais com a rolagem.
        // .hero-bg tem 20% de sobra acima e 3% nas laterais: 0,18 × altura e ±14 px cabem nela.
        setTransform(refs.heroBg.current, px * -14, s * 0.18 + py * -10, 1.03);
        setTransform(refs.heroGlow.current, px * 26, s * 0.26 + py * 18);
        setTransform(refs.heroDrops.current, px * 40, s * 0.32 + py * 26);
        // Primeiro plano: irrigador e chuva próxima andam mais, reforçando a profundidade.
        setTransform(refs.sprinkler.current, px * 56, s * 0.42 + py * 30);
        setTransform(refs.rainNear.current, px * 72, s * 0.5 + py * 40);
        setTransform(refs.heroContent.current, px * 8, s * 0.1 + py * 6);
        if (refs.heroContent.current) {
          // O texto só começa a esmaecer depois de 30% da rolagem do hero.
          const fade = Math.max(0, scroll - heroHeight * 0.3) / (heroHeight * 0.7);
          refs.heroContent.current.style.opacity = clamp(1 - fade, 0.3, 1).toFixed(3);
        }
      }

      const mid = refs.mid.current;
      if (visible.mid && mid) {
        const rect = mid.getBoundingClientRect();
        // 0 quando a seção entra pela base da tela, 1 quando sai pelo topo.
        const progress = clamp((viewportHeight - rect.top) / (viewportHeight + rect.height), 0, 1);
        // Sobra de 15% acima e abaixo: deslocamento máximo de 12% da altura.
        // O zoom sai de 1,08 e assenta em 1,0 no meio da passagem (efeito de "aproximação").
        const zoom = 1 + 0.08 * Math.max(0, 1 - progress * 2);
        setTransform(refs.midBg.current, 0, (progress - 0.5) * 2 * rect.height * 0.12 * intensity, zoom);
        setTransform(midContent, 0, (0.5 - progress) * 40 * intensity);
      }

      // Fotos das culturas: a imagem é 16% maior que a moldura e desliza ±7% dentro dela.
      cropsVisiveis.forEach((img) => {
        const moldura = img.parentElement!.getBoundingClientRect();
        const progress = clamp((viewportHeight - moldura.top) / (viewportHeight + moldura.height), 0, 1);
        setTransform(img, 0, (progress - 0.5) * 2 * moldura.height * 0.07 * intensity);
      });

      const emMovimento = scroll !== alvoScroll
        || Math.abs(alvoPonteiro.x - ponteiro.x) > 0.001
        || Math.abs(alvoPonteiro.y - ponteiro.y) > 0.001;
      if (emMovimento) frame = window.requestAnimationFrame(render);
    };

    const requestRender = () => {
      if (!frame) frame = window.requestAnimationFrame(render);
    };

    const handleScroll = () => {
      alvoScroll = window.scrollY;
      requestRender();
    };

    const handlePointer = (event: PointerEvent) => {
      if (!visible.hero || alvoScroll > heroHeight) return;
      // Posição normalizada em -1…1 a partir do centro da tela.
      alvoPonteiro.x = clamp((event.clientX / window.innerWidth) * 2 - 1, -1, 1);
      alvoPonteiro.y = clamp((event.clientY / viewportHeight) * 2 - 1, -1, 1);
      requestRender();
    };

    const handlePointerLeave = () => {
      alvoPonteiro.x = 0;
      alvoPonteiro.y = 0;
      requestRender();
    };

    const measure = () => {
      viewportHeight = window.innerHeight;
      heroHeight = refs.hero.current?.offsetHeight ?? viewportHeight;
      // Em telas pequenas o movimento fica mais discreto.
      intensity = window.innerWidth < 768 ? 0.6 : 1;
      alvoScroll = window.scrollY;
      requestRender();
    };

    // Chuva e irrigador só animam com o hero na tela (CSS e SMIL pausados fora dela).
    const atualizarAnimacoesHero = () => {
      const pausar = !visible.hero || motionQuery.matches;
      refs.hero.current?.classList.toggle("hero--paused", pausar);
      const irrigador = refs.sprinkler.current;
      if (irrigador) {
        if (pausar) irrigador.pauseAnimations?.();
        else irrigador.unpauseAnimations?.();
      }
    };

    const handleMotionPreference = () => {
      if (motionQuery.matches) resetLayers();
      atualizarAnimacoesHero();
      requestRender();
    };

    let sectionObserver: IntersectionObserver | undefined;
    if ("IntersectionObserver" in window) {
      sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.target === refs.hero.current) {
            visible.hero = entry.isIntersecting;
            atualizarAnimacoesHero();
          }
          else if (entry.target === refs.mid.current) visible.mid = entry.isIntersecting;
          else {
            const img = (entry.target as HTMLElement).querySelector<HTMLElement>("img");
            if (img) {
              if (entry.isIntersecting) cropsVisiveis.add(img);
              else cropsVisiveis.delete(img);
            }
          }
        });
        requestRender();
      }, { rootMargin: "120px 0px" });
      if (refs.hero.current) sectionObserver.observe(refs.hero.current);
      if (refs.mid.current) sectionObserver.observe(refs.mid.current);
      cropImgs.forEach((img) => img.parentElement && sectionObserver?.observe(img.parentElement));
    } else {
      visible.mid = true;
    }

    // Revelação suave dos blocos ao entrarem na tela (uma única vez).
    const revealTargets = Array.from(refs.root.current?.querySelectorAll<HTMLElement>(".reveal") ?? []);
    let revealObserver: IntersectionObserver | undefined;
    if (motionQuery.matches || !("IntersectionObserver" in window)) {
      revealTargets.forEach((element) => element.classList.add("is-visible"));
    } else {
      revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
      revealTargets.forEach((element) => revealObserver?.observe(element));
    }

    measure();
    atualizarAnimacoesHero();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    // O efeito do ponteiro só existe em computadores (mouse/trackpad); toque não dispara.
    const heroEl = refs.hero.current;
    if (ponteiroFino.matches && heroEl) {
      heroEl.addEventListener("pointermove", handlePointer, { passive: true });
      heroEl.addEventListener("pointerleave", handlePointerLeave, { passive: true });
    }
    motionQuery.addEventListener?.("change", handleMotionPreference);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", measure);
      heroEl?.removeEventListener("pointermove", handlePointer);
      heroEl?.removeEventListener("pointerleave", handlePointerLeave);
      motionQuery.removeEventListener?.("change", handleMotionPreference);
      sectionObserver?.disconnect();
      revealObserver?.disconnect();
    };
    // As refs são estáveis durante a vida do componente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
