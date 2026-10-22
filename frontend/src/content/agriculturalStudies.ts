export type StudySection = {
  title: string;
  text: string;
};

export type StudyChapter = {
  title: string;
  introduction: string;
  sections: StudySection[];
  practice: string;
  attention: string;
};

export type CropStudy = {
  slug: string;
  name: string;
  category: string;
  level: string;
  summary: string;
  image?: string;
  imageAlt?: string;
  imageCredit?: string;
  tags: string[];
  chapters: StudyChapter[];
  references: { title: string; institution: string; url: string }[];
};

export const cropStudies: CropStudy[] = [
  {
    slug: "milho",
    name: "Milho",
    category: "Cereal",
    level: "Fundamentos e manejo",
    summary: "Conheça o ciclo do milho, os fatores que afetam seu desenvolvimento e como acompanhar a água disponível sem perder de vista o sistema de produção.",
    image: `${process.env.PUBLIC_URL}/img/milho.jpg`,
    tags: ["cereal", "gramínea", "grãos", "silagem", "irrigação", "solo", "fenologia"],
    chapters: [
      {
        title: "Introdução à cultura",
        introduction: "O milho (Zea mays L.) é cultivado para diferentes finalidades, e cada destino altera escolhas de cultivar, época, população de plantas e colheita.",
        sections: [
          { title: "Usos e sistemas", text: "Grãos, silagem, milho-verde e usos industriais convivem em sistemas muito distintos. A escala e a finalidade da lavoura orientam o nível de investimento e o manejo." },
          { title: "Características da planta", text: "É uma gramínea anual com crescimento determinado por estágios vegetativos e reprodutivos. A formação da espiga e o enchimento dos grãos dependem da interação entre genótipo e ambiente." },
        ],
        practice: "Antes de escolher materiais e operações, registre o objetivo da produção, a janela de plantio, o histórico da área e os recursos disponíveis.",
        attention: "O calendário e a recomendação de cultivar não são universais: variam com região, altitude, época, mercado e sistema de cultivo.",
      },
      {
        title: "Clima e condições de cultivo",
        introduction: "Temperatura, radiação, chuva e duração da estação influenciam emergência, florescimento e enchimento de grãos. A distribuição da chuva importa tanto quanto o total acumulado.",
        sections: [
          { title: "Ciclo e ambiente", text: "A velocidade de desenvolvimento responde ao ambiente e ao material genético. Temperaturas fora da faixa adequada e eventos extremos podem alterar o florescimento e a formação das espigas." },
          { title: "Água ao longo da safra", text: "Períodos sem chuva durante fases reprodutivas podem limitar processos importantes; encharcamento também prejudica raízes e aeração. Irrigação suplementar depende de projeto, disponibilidade e manejo." },
        ],
        practice: "Compare datas de plantio, chuva observada e registros da lavoura por talhão para entender padrões locais em vez de extrapolar médias distantes.",
        attention: "Zoneamento, risco climático e época de semeadura devem ser consultados para o município e a safra em questão.",
      },
      {
        title: "Solo e preparo",
        introduction: "O sistema radicular precisa encontrar água, ar e nutrientes em um perfil sem impedimentos severos. O manejo do solo começa por diagnóstico, não por uma operação padrão.",
        sections: [
          { title: "Diagnóstico da área", text: "Análise química, avaliação física, histórico de compactação e observação de drenagem ajudam a definir correção e preparo. Amostras representativas e interpretação técnica são fundamentais." },
          { title: "Conservação", text: "Cobertura do solo, rotação e redução de erosão contribuem para infiltração e estrutura. Plantio direto exige planejamento de palhada, rotação e controle de plantas daninhas." },
        ],
        practice: "Mapeie diferenças de relevo, textura aparente, infiltração e desenvolvimento das plantas antes de dividir zonas de manejo.",
        attention: "Calagem, adubação e descompactação dependem de análise e recomendação regional; intervenções indiscriminadas podem piorar o sistema.",
      },
      {
        title: "Fases de desenvolvimento",
        introduction: "A leitura das fases ajuda a priorizar observações. Emergência, crescimento vegetativo, pendoamento, florescimento, formação e enchimento dos grãos têm demandas e riscos diferentes.",
        sections: [
          { title: "Fase vegetativa", text: "Estabelecimento uniforme e área foliar saudável sustentam o potencial da cultura. Falhas de emergência, competição e danos radiculares podem produzir diferenças que acompanham a lavoura." },
          { title: "Fase reprodutiva", text: "Sincronia entre liberação de pólen e receptividade dos estigmas, seguida pelo enchimento, é especialmente sensível ao estresse. Observe espigas e plantas, não apenas a aparência do dossel." },
        ],
        practice: "Registre a fase predominante por talhão e associe cada observação a uma data, condição do tempo e intervenção realizada.",
        attention: "Escalas fenológicas e nomes dos estágios variam entre materiais didáticos; use o protocolo recomendado para a cultivar acompanhada.",
      },
      {
        title: "Manejo da irrigação",
        introduction: "O objetivo é repor água conforme a necessidade da cultura e a capacidade do solo, sem confundir uma leitura isolada com uma ordem automática de irrigação.",
        sections: [
          { title: "Balanço de água", text: "Chuva efetiva, evapotranspiração, profundidade de raízes, armazenamento do solo e eficiência do sistema participam da decisão. O cálculo requer dados locais e parâmetros calibrados." },
          { title: "Métodos e operação", text: "Aspersão, pivô e gotejamento têm requisitos de projeto, energia, filtragem e uniformidade próprios. A escolha deve considerar escala, topografia, água disponível e custo operacional." },
        ],
        practice: "Combine dados meteorológicos, inspeção do perfil e sensores instalados em profundidades representativas; confira a resposta após irrigar.",
        attention: "Evite limites genéricos de umidade. Calibração, textura, estádio e distribuição das raízes alteram a interpretação do sensor.",
      },
      {
        title: "Monitoramento e tecnologia",
        introduction: "Sensores transformam uma condição local em registro mensurável. Eles ampliam a observação, mas representam apenas o ponto e o volume de solo onde foram instalados.",
        sections: [
          { title: "Instalação e leitura", text: "Escolha locais representativos, mantenha bom contato com o solo e documente profundidade, modelo e calibração. Compare mais de um ponto quando a variabilidade da área justificar." },
          { title: "Série histórica", text: "Registros datados permitem observar resposta à chuva e à irrigação e comparar períodos. Anote também falhas, manutenção, manejo e mudanças no sensor." },
        ],
        practice: "Na Agrovia, associe cadastros de campos e dispositivos; a visualização de leituras depende de uma integração de telemetria compatível estar disponível.",
        attention: "Uma plataforma não corrige sensor mal posicionado nem substitui verificação de campo e manutenção preventiva.",
      },
      {
        title: "Problemas comuns e boas práticas",
        introduction: "Desuniformidade pode ter causas hídricas, físicas, nutricionais, fitossanitárias ou operacionais. Investigue antes de atribuir sintomas à irrigação.",
        sections: [
          { title: "O que observar", text: "Emergência irregular, plantas murchas, folhas enroladas, encharcamento, crostas, erosão e diferenças entre linhas são sinais para investigação contextualizada." },
          { title: "Prevenção e diagnóstico", text: "Calibre equipamentos, verifique filtros e emissores, mantenha cobertura e registre intervenções. Inspecione também raízes e solo para separar deficiência hídrica de outros estresses." },
        ],
        practice: "Documente o sintoma, sua distribuição, a fase da lavoura e o histórico recente; compare área afetada e área sem sintomas.",
        attention: "Para diagnóstico de pragas, doenças, fertilidade ou dimensionamento hidráulico, procure assistência técnica habilitada.",
      },
      {
        title: "Resumo e consulta rápida",
        introduction: "Manejo hídrico eficiente combina observação, medição, interpretação e revisão. O contexto do talhão é parte essencial de qualquer recomendação.",
        sections: [
          { title: "Lista de verificação", text: "Confirme a fase da cultura; consulte chuva e previsão; verifique sensor e profundidade; avalie o perfil e a drenagem; registre a decisão e confira o resultado." },
          { title: "Conceitos-chave", text: "Evapotranspiração reúne evaporação do solo e transpiração da planta. Capacidade de armazenamento, infiltração, uniformidade e calibração ajudam a interpretar a água disponível." },
        ],
        practice: "Use este roteiro como apoio para organizar perguntas e dados antes de discutir o manejo com assistência técnica.",
        attention: "Este material é educativo e não substitui recomendação agronômica adaptada à propriedade.",
      },
    ],
    references: [
      { title: "Milho - Árvore do Conhecimento Ageitec", institution: "Embrapa", url: "https://www.embrapa.br/agencia-de-informacao-tecnologica/cultivos/milho" },
    ],
  },
  {
    slug: "soja",
    name: "Soja",
    category: "Leguminosa", level: "Fundamentos e manejo",
    summary: "Estude o ciclo da soja, a relação com o ambiente e o solo, a nodulação e como organizar o acompanhamento hídrico por talhão.",
    image: `${process.env.PUBLIC_URL}/img/soja.jpg`,
    tags: ["leguminosa", "grãos", "nodulação", "irrigação", "solo", "fenologia", "fixação biológica"],
    chapters: [
      {
        title: "Introdução à cultura", introduction: "A soja (Glycine max) é uma leguminosa anual de grande relevância para cadeias de alimentos, rações e produtos industriais. Há ampla diversidade de cultivares e sistemas.",
        sections: [
          { title: "Usos e produção", text: "Grãos e derivados atendem mercados alimentares, industriais e de alimentação animal. A escolha do ciclo e do grupo de maturidade precisa acompanhar a região e a janela de semeadura." },
          { title: "Planta e simbiose", text: "A planta forma vagens e sementes; em associação com bactérias específicas pode realizar fixação biológica de nitrogênio. Inoculação, nodulação e condições do solo influenciam esse processo." },
        ],
        practice: "Identifique cultivar, grupo de maturidade, objetivo, histórico de inoculação e condições de semeadura antes de comparar áreas.",
        attention: "A fixação biológica não elimina a necessidade de diagnóstico e das demais práticas de fertilidade recomendadas para cada sistema.",
      },
      {
        title: "Clima e condições de cultivo", introduction: "A soja responde ao fotoperíodo, à temperatura e à disponibilidade hídrica. A combinação desses fatores altera duração do ciclo e momento das fases reprodutivas.",
        sections: [
          { title: "Ambiente e ciclo", text: "Cultivares diferem na resposta ao comprimento do dia e no ciclo. Latitude, época de semeadura e altitude modificam a expressão do desenvolvimento observado na lavoura." },
          { title: "Disponibilidade de água", text: "Déficit em fases reprodutivas pode afetar flores, vagens e enchimento; excesso reduz aeração e pode favorecer problemas radiculares. Distribuição da chuva e armazenamento no solo importam." },
        ],
        practice: "Consulte zoneamento e recomendações de semeadura locais, e registre eventos de calor, seca ou excesso de chuva por fase.",
        attention: "Evite transferir recomendações de cultivares ou calendários entre regiões sem confirmar adaptação e risco climático.",
      },
      {
        title: "Solo e preparo", introduction: "Raízes, nodulação e armazenamento de água dependem de condições químicas, físicas e biológicas do solo. A avaliação deve considerar o perfil e não só a superfície.",
        sections: [
          { title: "Fertilidade e acidez", text: "Amostragem adequada e análise laboratorial orientam correção e adubação. pH, nutrientes, matéria orgânica e histórico de manejo afetam crescimento e atividade dos nódulos." },
          { title: "Estrutura e conservação", text: "Compactação, baixa infiltração e erosão reduzem exploração do perfil. Rotação, cobertura e tráfego planejado ajudam a conservar a estrutura conforme o sistema adotado." },
        ],
        practice: "Compare análise de solo, enraizamento e infiltração em áreas com desempenho distinto; planeje amostragem representativa.",
        attention: "A interpretação da análise e a correção exigem critérios regionais, profundidade de amostragem e acompanhamento profissional.",
      },
      {
        title: "Fases de desenvolvimento", introduction: "Do estabelecimento à maturidade, as fases vegetativas e reprodutivas organizam a observação e ajudam a entender quando determinados estresses podem ser mais relevantes.",
        sections: [
          { title: "Estabelecimento e crescimento", text: "Emergência uniforme, estande adequado e raízes funcionais formam a base do dossel. Avalie falhas, vigor, nodulação e competição sem usar uma única observação como diagnóstico." },
          { title: "Florescimento e enchimento", text: "Florescimento, formação de vagens e enchimento das sementes são etapas distintas; a sensibilidade ao estresse depende do momento e da duração do evento." },
        ],
        practice: "Use a escala fenológica recomendada para registrar o estágio predominante e alinhe a observação com a cultivar e a data de semeadura.",
        attention: "Estádios não são datas fixas; cultivar e ambiente alteram a velocidade de desenvolvimento.",
      },
      {
        title: "Manejo da irrigação", introduction: "A decisão precisa relacionar demanda atmosférica, água retida no perfil e capacidade do sistema. A meta não é manter o solo saturado.",
        sections: [
          { title: "Demanda e armazenamento", text: "Balanço hídrico, chuva efetiva, evapotranspiração e profundidade de raízes ajudam a estimar quando e quanto repor. Os parâmetros precisam refletir solo, cultivar e estádio." },
          { title: "Método e uniformidade", text: "Aspersão, pivô e outros métodos variam em eficiência, custo e resposta ao vento, ao relevo e à infiltração. Verificar uniformidade evita diferenças de aplicação dentro da área." },
        ],
        practice: "Combine leituras de sensores em posições representativas com clima e avaliação do perfil; observe a resposta da cultura após a aplicação.",
        attention: "Não use um percentual de sensor como gatilho universal; sensores medem propriedades específicas e precisam de calibração local.",
      },
      {
        title: "Monitoramento e tecnologia", introduction: "Uma série confiável nasce de instalação documentada, manutenção e interpretação que considera a variabilidade espacial da lavoura.",
        sections: [
          { title: "Sensor e nodulação", text: "Sensores de umidade não medem nodulação nem fertilidade. Mantenha avaliações agronômicas próprias e verifique o posicionamento e a calibração de cada instrumento." },
          { title: "Registros comparáveis", text: "Anote unidade, profundidade, data, talhão e eventos de irrigação. Com dados consistentes, é possível comparar tendências sem confundir mudanças do solo com falhas do sensor." },
        ],
        practice: "Cadastre campos e dispositivos de forma identificável; o histórico de leituras só aparece quando a integração de telemetria estiver conectada.",
        attention: "Uma leitura pontual não representa automaticamente toda a área nem substitui inspeção de raízes e plantas.",
      },
      {
        title: "Problemas comuns e boas práticas", introduction: "Desuniformidade, falhas de nodulação e sintomas de estresse podem compartilhar causas. O diagnóstico considera planta, solo, clima e operações.",
        sections: [
          { title: "Sinais de atenção", text: "Falhas no estande, amarelecimento, murcha, raízes limitadas, erosão ou áreas encharcadas justificam investigação de fatores bióticos e abióticos." },
          { title: "Rotina preventiva", text: "Verifique inoculante e procedimento de inoculação conforme orientação técnica, calibragem de semeadora e irrigação, drenagem e qualidade dos registros." },
        ],
        practice: "Faça comparações entre zonas, registre a distribuição espacial do sintoma e evite tratar toda a área antes de localizar a causa.",
        attention: "Confirme problemas fitossanitários e nutricionais com diagnóstico técnico antes de escolher uma intervenção.",
      },
      {
        title: "Resumo e consulta rápida", introduction: "A soja exige leitura integrada do ambiente, da cultivar, do solo e do estádio. Monitorar significa reunir evidências para uma decisão revisável.",
        sections: [
          { title: "Lista de verificação", text: "Confirme cultivar e fase; revise chuva e previsão; confira sensor, profundidade e calibração; observe raízes e superfície; registre operação e resposta." },
          { title: "Conceitos-chave", text: "Fotoperíodo é a duração relativa do dia; nodulação é a formação de nódulos radiculares; balanço hídrico compara entradas e saídas de água no sistema." },
        ],
        practice: "Prepare histórico da área, análise de solo e registros de clima para orientar conversas com assistência técnica.",
        attention: "Conteúdo educativo: recomendações dependem da cultivar, região, solo, clima e sistema de produção.",
      },
    ],
    references: [
      { title: "Soja - Árvore do Conhecimento Ageitec", institution: "Embrapa", url: "https://www.embrapa.br/agencia-de-informacao-tecnologica/cultivos/soja" },
    ],
  },
  {
    slug: "cana-de-acucar",
    name: "Cana-de-açúcar",
    category: "Gramínea perene", level: "Fundamentos e manejo",
    summary: "Um guia introdutório sobre canaviais, ciclo de corte e rebrota, ambiente, conservação do solo e decisões de água em sistemas diversos.",
    image: `${process.env.PUBLIC_URL}/img/cana-de-acucar.jpg`,
    imageAlt: "Colheita em um canavial",
    imageCredit: "Foto: proudlyswazi / Unsplash",
    tags: ["gramínea", "perene", "perfilhamento", "soqueira", "irrigação", "solo", "cana-planta"],
    chapters: [
      {
        title: "Introdução à cultura", introduction: "A cana-de-açúcar (Saccharum spp.) é uma gramínea perene cultivada em ciclos de plantio e cortes sucessivos, com relevância para açúcar, etanol, energia e outros produtos.",
        sections: [
          { title: "Usos e organização do canavial", text: "A destinação industrial e o planejamento da colheita influenciam variedades, época de plantio, logística e longevidade do canavial. Regiões produtoras apresentam calendários e condições diferentes." },
          { title: "Cana-planta e soqueira", text: "O primeiro ciclo se estabelece a partir de material propagativo; os ciclos seguintes rebrotam da soqueira. Idade, variedade e manejo condicionam a brotação e a produtividade de cada corte." },
        ],
        practice: "Identifique talhão, variedade, corte atual, época de plantio e destino da produção ao comparar áreas.",
        attention: "Características e calendários de colheita variam entre regiões, ambientes de produção e estratégias da usina ou propriedade.",
      },
      {
        title: "Clima e condições de cultivo", introduction: "Temperatura, radiação, chuva e estação seca influenciam crescimento, perfilhamento e maturação. A resposta ao clima muda ao longo do ciclo e entre ambientes.",
        sections: [
          { title: "Crescimento e maturação", text: "Condições favoráveis ao crescimento vegetativo não são necessariamente as mesmas usadas para planejar maturação e colheita. O calendário local integra clima e logística." },
          { title: "Disponibilidade hídrica", text: "Déficits e excessos podem afetar estabelecimento, expansão e rebrota; drenagem e reserva do perfil modulam os efeitos. Irrigação e fertirrigação requerem avaliação técnica e legal." },
        ],
        practice: "Compare chuva, duração de veranicos, relevo e vigor por estágio e por ciclo de corte.",
        attention: "Não extrapole respostas observadas em uma região para outra sem considerar clima, solo, variedade e manejo.",
      },
      {
        title: "Solo e preparo", introduction: "O preparo e a conservação do solo afetam brotação, tráfego, infiltração e operação de colheita ao longo de vários ciclos.",
        sections: [
          { title: "Planejamento do perfil", text: "Análises químicas e físicas, drenagem, compactação e profundidade efetiva orientam o planejamento. A renovação do canavial é uma oportunidade para corrigir problemas diagnosticados." },
          { title: "Tráfego e conservação", text: "Tráfego de máquinas, declividade e manejo de resíduos influenciam compactação e erosão. Práticas conservacionistas devem se ajustar às operações e à legislação local." },
        ],
        practice: "Registre linhas de tráfego, pontos de empoçamento e falhas de brotação; compare-os com mapas de colheita e condições do solo.",
        attention: "Intervenções profundas ou correções generalizadas devem ser fundamentadas por amostragem e recomendação agronômica.",
      },
      {
        title: "Fases de desenvolvimento", introduction: "Estabelecimento, brotação, perfilhamento, crescimento dos colmos, maturação e rebrota descrevem processos que se repetem e se sobrepõem no canavial.",
        sections: [
          { title: "Estabelecimento e perfilhamento", text: "Qualidade do material propagativo, plantio e umidade inicial influenciam emergência e formação de perfilhos. A uniformidade condiciona o aproveitamento da área." },
          { title: "Crescimento, maturação e rebrota", text: "Crescimento dos colmos e acúmulo de sacarose respondem ao ambiente e ao manejo. Após o corte, a condição da soqueira e a umidade disponível afetam a retomada." },
        ],
        practice: "Marque datas de plantio e corte e registre a fase predominante para interpretar diferenças entre talhões e ciclos.",
        attention: "Calendário de fases varia com época de plantio, variedade, ambiente, irrigação e duração do ciclo.",
      },
      {
        title: "Manejo da irrigação", introduction: "A irrigação pode apoiar estabelecimento, crescimento ou rebrota conforme o objetivo e a disponibilidade de água, mas seu desenho deve ser específico ao sistema.",
        sections: [
          { title: "Necessidade e método", text: "Balanço hídrico, evapotranspiração, profundidade de raízes, chuva e armazenamento do solo fundamentam a estimativa. Métodos localizados, aspersão e sistemas de aplicação em área têm custos e limitações próprios." },
          { title: "Água e nutrientes", text: "Fertirrigação exige compatibilidade entre água, fertilizantes, solo e equipamento. Em áreas com vinhaça ou outros subprodutos, qualidade, dose, logística e normas ambientais também importam." },
        ],
        practice: "Avalie vazão, uniformidade, infiltração e resposta após a aplicação em pontos representativos do talhão.",
        attention: "Disponibilidade de água, outorga, qualidade e legislação devem ser confirmadas antes de implantar ou ampliar irrigação.",
      },
      {
        title: "Monitoramento e tecnologia", introduction: "Em uma cultura de ciclos longos, a rastreabilidade por talhão e por corte ajuda a comparar decisões em diferentes condições sazonais.",
        sections: [
          { title: "Sensores e representatividade", text: "Posicione sensores conforme profundidade efetiva das raízes, textura e variabilidade do talhão. Um ponto isolado não representa solos heterogêneos ou linhas com manejos diferentes." },
          { title: "Dados por ciclo", text: "Associe leituras a datas de plantio, corte, chuva, irrigação, variedade e operações. A série fica mais interpretável quando mudanças de equipamento e calibração também são registradas." },
        ],
        practice: "Use a plataforma para organizar campos e dispositivos; visualização de séries depende da integração de leituras estar configurada.",
        attention: "Telemetria não substitui aferição de vazão, inspeção de linhas, manutenção e conferência do solo.",
      },
      {
        title: "Problemas comuns e boas práticas", introduction: "Falhas de brotação, compactação, erosão, drenagem inadequada e distribuição irregular de água podem se manifestar de forma parecida.",
        sections: [
          { title: "Diagnóstico de campo", text: "Observe falhas em linhas, vigor da rebrota, erosão, poças, raízes e diferenças relacionadas ao tráfego. Relacione os sinais com época de corte e condições do período." },
          { title: "Rotina e prevenção", text: "Manutenção de bombas e filtros, checagem de vazamentos, conservação de estradas e planejamento de tráfego reduzem falhas operacionais e danos ao solo." },
        ],
        practice: "Registre a localização das falhas e compare talhões com variedade, idade e histórico operacional equivalentes.",
        attention: "Manejo de efluentes, aplicação de insumos e uso de água precisam observar licenciamento, normas ambientais e assistência técnica.",
      },
      {
        title: "Resumo e consulta rápida", introduction: "A cana exige visão de ciclo: implantação, cortes, soqueira e renovação formam uma sequência de decisões interdependentes.",
        sections: [
          { title: "Lista de verificação", text: "Identifique fase e ciclo de corte; verifique chuva, solo e drenagem; inspecione sistema e sensor; registre variedade e operação; confira resposta após manejo." },
          { title: "Conceitos-chave", text: "Cana-planta é o ciclo inicial; soqueira é a base que rebrotará após o corte; perfilhamento forma colmos; maturação é acompanhada conforme o objetivo industrial." },
        ],
        practice: "Organize registros por talhão e por corte para tornar comparações entre safras mais úteis.",
        attention: "Material educativo; decisões de irrigação e fertirrigação exigem avaliação da propriedade e das normas vigentes.",
      },
    ],
    references: [
      { title: "Cana-de-açúcar - Árvore do Conhecimento Ageitec", institution: "Embrapa", url: "https://www.embrapa.br/agencia-de-informacao-tecnologica/cultivos/cana-de-acucar" },
    ],
  },
  {
    slug: "cafe",
    name: "Café",
    category: "Cultura perene", level: "Fundamentos e manejo",
    summary: "Explore diferenças entre espécies e ambientes, fenologia, solo, água e monitoramento em cafezais de distintas regiões e sistemas.",
    image: `${process.env.PUBLIC_URL}/img/cafe.jpg`,
    imageAlt: "Cerejas amarelas de café arábica em um ramo",
    imageCredit: "Foto: 1500mcoffee / Pexels",
    tags: ["cafeicultura", "cafeeiro", "arábica", "conilon", "perene", "irrigação", "fenologia"],
    chapters: [
      {
        title: "Introdução à cultura", introduction: "Cafezais comerciais são formados principalmente por Coffea arabica e Coffea canephora, incluindo materiais conhecidos como conilon ou robusta. Espécie, cultivar e ambiente moldam o manejo.",
        sections: [
          { title: "Produtos e sistemas", text: "A produção atende mercados de cafés diversos e pode incluir sistemas sombreados, adensados, irrigados ou de sequeiro. Colheita, qualidade e processamento também orientam decisões na propriedade." },
          { title: "Planta e ciclo", text: "O cafeeiro é perene, com crescimento vegetativo e ciclos reprodutivos que se repetem. Floradas, formação e maturação dos frutos coexistem com crescimento de ramos e raízes." },
        ],
        practice: "Registre espécie, cultivar, idade do cafezal, espaçamento, poda, altitude e sistema de produção antes de avaliar a lavoura.",
        attention: "Não trate arábica e canephora como intercambiáveis; adaptação e exigências variam entre espécies, cultivares e regiões.",
      },
      {
        title: "Clima e condições de cultivo", introduction: "Temperatura, altitude, distribuição de chuvas e ocorrência de eventos extremos influenciam crescimento, florada, maturação e risco produtivo.",
        sections: [
          { title: "Ambientes cafeeiros", text: "Regiões e espécies apresentam combinações distintas de temperatura, relevo e sazonalidade. Zoneamento e informação climática local ajudam a avaliar aptidão e risco." },
          { title: "Chuva e fenologia", text: "A distribuição da chuva participa da formação e abertura de flores e do desenvolvimento dos frutos. Períodos secos e chuvosos têm efeitos que dependem da fase e do ambiente." },
        ],
        practice: "Compare calendário de floradas, chuva, temperatura e estádio dos frutos ao longo de mais de um ciclo.",
        attention: "Mudanças climáticas e extremos podem alterar riscos; use dados atuais e recomendações específicas para a região.",
      },
      {
        title: "Solo e preparo", introduction: "A longevidade do cafezal torna planejamento de solo, água e conservação especialmente relevante desde a implantação.",
        sections: [
          { title: "Perfil e implantação", text: "Profundidade, drenagem, acidez, fertilidade e impedimentos físicos afetam enraizamento e estabilidade. Análise de solo e avaliação do relevo precedem correção e escolha do arranjo." },
          { title: "Conservação e cobertura", text: "Cobertura vegetal e práticas contra erosão ajudam a preservar água e solo em áreas inclinadas, quando compatíveis com o sistema e o manejo de plantas espontâneas." },
        ],
        practice: "Observe raízes, escorrimento superficial, infiltração e manchas de vigor para identificar zonas com comportamento distinto.",
        attention: "Amostragem, calagem e adubação devem seguir interpretação profissional e considerar idade e produtividade do cafezal.",
      },
      {
        title: "Fases de desenvolvimento", introduction: "No cafeeiro, crescimento dos ramos, diferenciação de gemas, florada, pegamento, expansão e maturação de frutos se articulam em ciclos sobrepostos.",
        sections: [
          { title: "Crescimento e florada", text: "Ramos produtivos e gemas florais respondem ao crescimento anterior e às condições ambientais. A abertura das flores depende da combinação de fatores que varia entre regiões." },
          { title: "Frutos e bienalidade", text: "Formação e enchimento de frutos competem por recursos com crescimento vegetativo. Variações entre safras são influenciadas por carga, clima, cultivar e manejo." },
        ],
        practice: "Registre floradas por talhão e acompanhe frutos e ramos em pontos permanentes para comparar ciclos.",
        attention: "Não use uma data de calendário única para definir fase; altitude, espécie, cultivar e clima alteram a fenologia.",
      },
      {
        title: "Manejo da irrigação", introduction: "A irrigação pode reduzir limitações hídricas em sistemas onde foi planejada, mas sua indicação depende do balanço local, da fase e da viabilidade do projeto.",
        sections: [
          { title: "Planejamento hídrico", text: "Evapotranspiração, chuva efetiva, armazenamento de água, raízes e clima ajudam a estimar a demanda. A resposta à irrigação pode diferir entre implantação, florada e enchimento." },
          { title: "Método e operação", text: "Gotejamento, microaspersão e aspersão têm implicações diferentes de energia, uniformidade, manutenção e molhamento. Projeto deve avaliar fonte e qualidade da água." },
        ],
        practice: "Use sensores em posições e profundidades representativas e associe leituras a chuva, irrigação e observação de plantas.",
        attention: "Irrigação em torno de floradas exige interpretação técnica cuidadosa; não adote suspensão ou reposição com base em regra genérica.",
      },
      {
        title: "Monitoramento e tecnologia", introduction: "A variabilidade do relevo, do solo e da idade das plantas torna essencial documentar onde, como e quando cada medição foi feita.",
        sections: [
          { title: "Instalação representativa", text: "Separe zonas por solo, relevo, idade e manejo quando necessário. Instale sensores fora de locais atípicos e documente profundidade, modelo e calibração." },
          { title: "Integração dos registros", text: "Associe séries de umidade a chuva, fase, floradas, colheita e operações. A comparação ganha sentido quando os registros têm horários, unidades e locais consistentes." },
        ],
        practice: "Cadastre as áreas e dispositivos e mantenha rotina de inspeção; leituras em tempo real dependem de telemetria conectada.",
        attention: "Sensores de umidade não identificam doenças, pragas, nutrição ou qualidade do fruto; mantenha avaliações específicas.",
      },
      {
        title: "Problemas comuns e boas práticas", introduction: "Murcha, desfolha, baixo pegamento, frutos irregulares e diferenças de vigor podem envolver água, raiz, clima, nutrição ou agentes bióticos.",
        sections: [
          { title: "Sinais e causas possíveis", text: "Manchas de murcha, raízes comprometidas, escorrimento, encharcamento e distribuição irregular de frutos pedem investigação no solo e na planta." },
          { title: "Rotina preventiva", text: "Mantenha irrigação e drenagem, filtros, emissores, podas e registros em dia. Observe a lavoura em diferentes posições e durante fases fenológicas distintas." },
        ],
        practice: "Mapeie áreas afetadas e compare plantas de idade, cultivar e posição semelhantes antes de concluir a causa.",
        attention: "Confirme diagnóstico de pragas, doenças e deficiências com assistência técnica especializada em cafeicultura.",
      },
      {
        title: "Resumo e consulta rápida", introduction: "O acompanhamento do café é plurianual: a interpretação considera espécies, floradas, carga, clima, manejo anterior e variabilidade do talhão.",
        sections: [
          { title: "Lista de verificação", text: "Identifique espécie, cultivar e fase; consulte chuva e registros de florada; confira sensor e perfil; inspecione raízes, plantas e sistema; registre a resposta." },
          { title: "Conceitos-chave", text: "Fenologia acompanha fases da planta; bienalidade descreve alternância de carga observada em muitos cafezais; uniformidade hidráulica indica quão igualmente a água é aplicada." },
        ],
        practice: "Organize um caderno anual por talhão e conecte leituras a floradas, colheita, poda e operações.",
        attention: "Material educativo; consulte recomendações oficiais e assistência técnica para decisões específicas do cafezal.",
      },
    ],
    references: [
      { title: "Publicações - Embrapa Café", institution: "Embrapa Café", url: "https://www.embrapa.br/cafe/publicacoes" },
    ],
  },
  {
    slug: "feijao",
    name: "Feijão",
    category: "Leguminosa", level: "Fundamentos e manejo",
    summary: "Um material prático sobre feijoeiro comum, ciclos de cultivo, fases sensíveis, água, solo e cuidados para interpretar sinais na lavoura.",
    image: `${process.env.PUBLIC_URL}/img/feijao.jpg`,
    tags: ["feijoeiro", "leguminosa", "grãos", "florescimento", "irrigação", "solo", "vagens"],
    chapters: [
      {
        title: "Introdução à cultura", introduction: "O feijoeiro comum (Phaseolus vulgaris) tem importância alimentar e pode ser cultivado em diferentes épocas e sistemas, de pequenas áreas a lavouras tecnificadas.",
        sections: [
          { title: "Diversidade de tipos", text: "Preferências por grupo, cor e tipo de grão variam entre mercados e regiões. Cultivares diferem em ciclo, arquitetura, hábito de crescimento e adaptação." },
          { title: "Planta e produção", text: "A planta forma folhas, flores, vagens e sementes em um ciclo relativamente curto. Arranjo, sanidade, água e manejo influenciam a uniformidade e a qualidade da colheita." },
        ],
        practice: "Defina objetivo, grupo comercial, época, cultivar e disponibilidade de máquinas antes de planejar operações.",
        attention: "O feijão é cultivado em mais de uma época em várias regiões, mas calendário, risco e material adequado são locais.",
      },
      {
        title: "Clima e condições de cultivo", introduction: "Temperatura, chuva e umidade durante floração e formação de vagens influenciam estabelecimento, pegamento e qualidade dos grãos.",
        sections: [
          { title: "Época e ambiente", text: "A escolha da época considera temperaturas, distribuição de chuvas, risco de extremos, colheita e pressão de doenças. Zoneamento ajuda a qualificar esse risco por município." },
          { title: "Déficit e excesso", text: "Falta de água em fases de florescimento e enchimento pode reduzir componentes de rendimento; excesso e baixa drenagem favorecem hipóxia e problemas sanitários." },
        ],
        practice: "Registre chuva, temperatura, fase e eventos de estresse para interpretar diferenças entre semeaduras e safras.",
        attention: "Não existe uma janela de cultivo única para todo o país; consulte zoneamento e recomendações regionais atualizadas.",
      },
      {
        title: "Solo e preparo", introduction: "O feijoeiro responde ao ambiente radicular e à drenagem; preparo e conservação devem atender à textura, relevo e sistema de produção.",
        sections: [
          { title: "Análise e fertilidade", text: "Amostragem e análise química orientam correções e adubação. Matéria orgânica, acidez e disponibilidade de nutrientes devem ser interpretadas para a cultura e a região." },
          { title: "Estrutura e drenagem", text: "Compactação restringe raízes e infiltração, enquanto encharcamento reduz oxigenação. Rotação e cobertura ajudam na conservação quando integradas ao planejamento da propriedade." },
        ],
        practice: "Examine o perfil e as raízes em áreas com plantas desuniformes e compare com o resultado de análise de solo.",
        attention: "Dose e forma de aplicação de insumos dependem de análise, cultivar, produtividade esperada e orientação técnica.",
      },
      {
        title: "Fases de desenvolvimento", introduction: "Emergência, crescimento vegetativo, florescimento, formação de vagens, enchimento e maturação orientam o acompanhamento de um ciclo curto.",
        sections: [
          { title: "Estabelecimento", text: "Semeadura uniforme, emergência e estande ajudam a formar um dossel equilibrado. Crostas, profundidade irregular, sementes e umidade inadequadas podem comprometer a implantação." },
          { title: "Florescimento e enchimento", text: "Flores, vagens e grãos se desenvolvem em sequência; estresses hídricos e térmicos em períodos reprodutivos podem afetar pegamento e enchimento." },
        ],
        practice: "Acompanhe a fase por talhão e anote eventos climáticos junto com operações; observe também vagens e raízes.",
        attention: "Duração e resposta de cada estádio variam com cultivar, temperatura, época de plantio e ambiente.",
      },
      {
        title: "Manejo da irrigação", introduction: "O feijoeiro pode responder ao manejo hídrico, mas excesso também traz riscos. A lâmina deve considerar solo, clima, estádio e eficiência do sistema.",
        sections: [
          { title: "Estimativa da necessidade", text: "Balanço hídrico, evapotranspiração, chuva, profundidade de raízes e armazenamento do solo ajudam a planejar reposição. A frequência depende da capacidade de retenção e do equipamento." },
          { title: "Métodos e aplicação", text: "Aspersão e outros métodos diferem em uniformidade, custo, molhamento foliar e operação. Avaliar vento, pressão, vazão e infiltração ajuda a reduzir perdas e áreas sem cobertura." },
        ],
        practice: "Use leitura de sensor junto a observação do perfil, condição da planta e previsão de chuva; confira se a irrigação atingiu o local esperado.",
        attention: "Não irrigue por um valor isolado sem conhecer calibração, textura, profundidade e faixa de manejo daquele sensor.",
      },
      {
        title: "Monitoramento e tecnologia", introduction: "Como o ciclo é curto, registros frequentes e confiáveis ajudam a relacionar uma leitura à fase exata e às operações recentes.",
        sections: [
          { title: "Representatividade", text: "Instale sensores em zonas homogêneas e documente profundidade, tipo de solo e posição. Diferencie talhões com cultivares ou datas de plantio diferentes." },
          { title: "Série e contexto", text: "Combine leituras com chuva, irrigação, estádio, semeadura e colheita. Marque manutenção e falhas de comunicação para não interpretar lacunas como ausência de mudança." },
        ],
        practice: "A Agrovia permite organizar os cadastros; exibição de dados de sensores depende de integração de telemetria ativa.",
        attention: "Dados digitais apoiam a observação, mas não identificam sozinhos doenças, pragas ou causas de desuniformidade.",
      },
      {
        title: "Problemas comuns e boas práticas", introduction: "Falhas no estande e murcha podem decorrer de semente, solo, água, doença, praga ou operação. A localização e o momento do sintoma ajudam a investigação.",
        sections: [
          { title: "Sinais para investigar", text: "Murcha, amarelecimento, manchas, plantas pequenas, abortamento de flores, vagens malformadas, crosta e empoçamento justificam inspeção de campo." },
          { title: "Prevenção", text: "Planeje rotação e semeadura, use sementes de qualidade, mantenha drenagem e uniformidade de aplicação e revise filtros, pressão e bicos do sistema." },
        ],
        practice: "Fotografe e mapeie sintomas, registre quando surgiram e compare plantas próximas com condições semelhantes.",
        attention: "Diagnósticos fitossanitários e recomendações de defensivos devem ser feitos por profissional habilitado, conforme regras vigentes.",
      },
      {
        title: "Resumo e consulta rápida", introduction: "No feijoeiro, o acompanhamento precisa ser ágil e ligado ao estágio, porque as condições de uma fase mudam rapidamente ao longo do ciclo.",
        sections: [
          { title: "Lista de verificação", text: "Confirme cultivar e fase; acompanhe chuva e previsão; examine raízes e drenagem; confira sensor e equipamento; registre irrigação e evolução das vagens." },
          { title: "Conceitos-chave", text: "Estande é a população de plantas estabelecida; pegamento é a formação inicial de frutos após a florada; evapotranspiração combina evaporação do solo e transpiração da planta." },
        ],
        practice: "Mantenha um registro simples por data e talhão para apoiar avaliação da safra e planejamento da próxima semeadura.",
        attention: "Material educativo; consulte recomendações oficiais e assistência técnica adaptada à sua região.",
      },
    ],
    references: [
      { title: "Feijão - Árvore do Conhecimento Ageitec", institution: "Embrapa", url: "https://www.embrapa.br/agencia-de-informacao-tecnologica/cultivos/feijao" },
    ],
  },
];