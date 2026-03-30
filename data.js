/**
 * data.js — Dados do Site Erick Giovane
 * ──────────────────────────────────────────────────────────────
 * Persistência: Supabase (primário) + localStorage (fallback)
 * Tabela Supabase: site_content (id TEXT PK, data JSONB)
 * Linha usada: id = 'main'
 */

const SITE_DEFAULTS = {
  // ── HERO ──────────────────────────────────────────────────────
  hero: {
    bgImage:      'img/foto2.jpg',
    athleteImage: 'img/hero_atleta.png',
    tagline:      'Atleta de Tênis · Arena Tennistorm · Masc. A',
    subtitle:     '17 anos. 3 anos de evolução constante. Uma história que está sendo escrita dentro de quadra — e ainda tem muito capítulo pela frente.',
  },

  // ── MEU JOGO ──────────────────────────────────────────────────
  jogo: {
    intro:           'Meu jogo foi construído para vencer no saibro. Jogo do fundo de quadra, com pressão constante e um forehand que define pontos. Cada treino é pensado para ampliar essa identidade.',
    superficieValor: 'Saibro',
    superficieDesc:  'Superfície que potencializa meu estilo físico e minha consistência no rally.',
    estiloValor:     'Fundo de quadra agressivo',
    estiloDesc:      'Exercito pressão constante sobre o adversário, construindo pontos com consistência e explosão.',
    golpeValor:      'Forehand',
    golpeDesc:       'Meu forehand é minha principal arma — gerador de pontos e símbolo do meu jogo ofensivo.',
  },

  // ── SOBRE ─────────────────────────────────────────────────────
  sobre: {
    paragrafo1: 'O tênis entrou na minha vida aos 14 anos pelos caminhos que a família indica — e desde o primeiro dia eu soube que era isso.',
    paragrafo2: 'Nos últimos três anos venho construindo minha base com disciplina, treino diário e muita dedicação dentro da <strong>Arena Tennistorm</strong>, em Maringá, sob a orientação do professor <strong>Diego Tambori</strong>.',
    paragrafo3: 'Comecei na Masc. C, fui para a B, e hoje compito na <strong>Masc. A</strong> — tanto em simples quanto em duplas. Cada categoria superada foi uma confirmação de que o caminho é esse.',
    paragrafo4: 'A temporada que vem está desenhada para ser a melhor até aqui. O treino está mais intenso, a cabeça mais focada, e a vontade de vencer nunca foi tão grande.',
    metricas: [
      { numero: '17', label: 'Anos de idade' },
      { numero: '3',  label: 'Anos de prática' },
      { numero: '8',  label: 'Campeonatos disputados' },
      { numero: 'A',  label: 'Categoria atual — Masc. A' },
    ],
  },

  // ── GALERIA ───────────────────────────────────────────────────
  galeria: [
    { src: 'img/foto1.jpg', alt: 'Erick Giovane em ação no saibro',      legenda: 'Competição' },
    { src: 'img/foto2.jpg', alt: 'Erick Giovane – forehand potente',      legenda: 'Treino' },
    { src: 'img/foto3.jpg', alt: 'Erick Giovane preparando backswing',    legenda: 'Competição' },
    { src: 'img/foto4.jpg', alt: 'Erick Giovane executando forehand',     legenda: 'Competição' },
    { src: 'img/foto5.jpg', alt: 'Erick Giovane – backhand potente',      legenda: 'Treino' },
    { src: '',              alt: 'Em breve',                              legenda: 'Bastidor' },
  ],

  // ── RESULTADOS ────────────────────────────────────────────────
  resultados: [
    { campeonato: 'FPT 1000+',              modalidade: 'Simples', categoria: '6ª MA',        posicao: '' },
    { campeonato: 'FPT 1000',               modalidade: 'Duplas',  categoria: '7ª MD',        posicao: '' },
    { campeonato: 'Interclubes',            modalidade: 'Duplas',  categoria: 'Masc. C',      posicao: '' },
    { campeonato: 'Interclubes',            modalidade: 'Duplas',  categoria: 'Masc. B',      posicao: '' },
    { campeonato: 'Interclubes',            modalidade: 'Simples', categoria: 'Masc. B',      posicao: '3º Lugar' },
    { campeonato: 'Interclubes',            modalidade: 'Simples', categoria: 'Masc. A',      posicao: '' },
    { campeonato: 'FPT Infanto Juvenil 2000', modalidade: 'Simples', categoria: 'Masc. 16A', posicao: '' },
    { campeonato: 'Infanto Juvenil',        modalidade: '—',       categoria: 'Cat. Especial', posicao: '' },
  ],

  // ── CONTATO ───────────────────────────────────────────────────
  contato: {
    whatsapp:  '5544999999999',
    email:     'erickgiovane@email.com',
    instagram: 'https://instagram.com/',
    treinador: 'Diego Tambori',
    clube:     'Arena Tennistorm',
    cidade:    'Maringá, PR',
  },
};

// ─────────────────────────────────────────────────────────────
// SUPABASE CLIENT (inicializado apenas se config disponível)
// ─────────────────────────────────────────────────────────────
function getSupabaseClient() {
  try {
    if (
      typeof supabase === 'undefined' ||
      !SUPABASE_URL ||
      SUPABASE_URL.includes('SEU_PROJETO') ||
      !SUPABASE_ANON_KEY ||
      SUPABASE_ANON_KEY.includes('SEU_ANON_KEY')
    ) return null;
    return supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// LOAD — Supabase → localStorage → defaults
// ─────────────────────────────────────────────────────────────
async function loadSiteData() {
  const defaults = JSON.parse(JSON.stringify(SITE_DEFAULTS));

  // 1. Tenta Supabase
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('site_content')
        .select('data')
        .eq('id', 'main')
        .single();

      if (!error && data && data.data && Object.keys(data.data).length > 0) {
        const merged = deepMerge(defaults, data.data);
        // Sincroniza localStorage como cache
        try { localStorage.setItem('erickSiteData', JSON.stringify(merged)); } catch (_) {}
        return merged;
      }
    } catch (e) {
      console.warn('[data] Supabase indisponível, usando fallback.', e);
    }
  }

  // 2. Fallback: localStorage
  try {
    const saved = localStorage.getItem('erickSiteData');
    if (saved) return deepMerge(defaults, JSON.parse(saved));
  } catch (e) {
    console.warn('[data] localStorage inválido.', e);
  }

  // 3. Defaults puros
  return defaults;
}

// ─────────────────────────────────────────────────────────────
// SAVE — Supabase + localStorage
// ─────────────────────────────────────────────────────────────
async function saveSiteData(data) {
  // Sempre salva no localStorage (backup imediato)
  try { localStorage.setItem('erickSiteData', JSON.stringify(data)); } catch (_) {}

  // Salva no Supabase
  const client = getSupabaseClient();
  if (!client) return { ok: false, msg: 'Supabase não configurado — salvo localmente.' };

  try {
    const { error } = await client
      .from('site_content')
      .upsert({ id: 'main', data, updated_at: new Date().toISOString() });

    if (error) throw error;
    return { ok: true, msg: 'Salvo no Supabase com sucesso!' };
  } catch (e) {
    console.error('[data] Erro ao salvar no Supabase:', e);
    return { ok: false, msg: 'Erro no Supabase — salvo localmente como backup.' };
  }
}

// ─────────────────────────────────────────────────────────────
// DEEP MERGE
// ─────────────────────────────────────────────────────────────
function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (Array.isArray(source[key])) {
      target[key] = source[key];
    } else if (source[key] && typeof source[key] === 'object') {
      target[key] = deepMerge(target[key] || {}, source[key]);
    } else if (source[key] !== undefined) {
      target[key] = source[key];
    }
  }
  return target;
}
