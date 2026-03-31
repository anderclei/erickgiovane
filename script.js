'use strict';

/* ============================================================
   SCRIPT.JS — Site Principal · Erick Giovane
   Renderiza conteúdo via Supabase / localStorage (data.js)
   Scroll Reveal · Header · Nav Mobile · Form
============================================================ */

// ─────────────────────────────────────────────────────────────
// 1. RENDERIZAÇÃO DOS DADOS (async — aguarda Supabase/localStorage)
// ─────────────────────────────────────────────────────────────
async function renderSiteData() {
  const data = await loadSiteData();

  // ── Hero ──────────────────────────────────────────────────
  const heroBg = document.getElementById('heroBg');
  if (heroBg && data.hero.bgImage) {
    heroBg.style.backgroundImage    = `url('${data.hero.bgImage}')`;
    heroBg.style.backgroundSize     = 'cover';
    heroBg.style.backgroundPosition = 'center 20%';
    heroBg.style.backgroundRepeat   = 'no-repeat';
  }

  // Foto do atleta (coluna direita do hero)
  const heroAthleteImg = document.querySelector('.hero-athlete-img');
  if (heroAthleteImg && data.hero.athleteImage) {
    heroAthleteImg.src = data.hero.athleteImage;
  }

  const heroTagEl = document.getElementById('heroTagline');
  if (heroTagEl && data.hero.tagline) heroTagEl.textContent = data.hero.tagline;

  const heroSubEl = document.getElementById('heroSubtitle');
  if (heroSubEl && data.hero.subtitle) heroSubEl.textContent = data.hero.subtitle;

  // ── Meu Jogo ──────────────────────────────────────────────
  if (data.jogo) {
    const jogoIntroEl = document.querySelector('.jogo-intro');
    if (jogoIntroEl && data.jogo.intro) jogoIntroEl.textContent = data.jogo.intro;

    // Cards de jogo (valores e descrições)
    const cardValues = document.querySelectorAll('.jogo-card-value');
    const cardDescs  = document.querySelectorAll('.jogo-card-desc');
    if (cardValues[0] && data.jogo.superficieValor) cardValues[0].textContent = data.jogo.superficieValor;
    if (cardDescs[0]  && data.jogo.superficieDesc)  cardDescs[0].textContent  = data.jogo.superficieDesc;
    if (cardValues[1] && data.jogo.estiloValor)     cardValues[1].textContent = data.jogo.estiloValor;
    if (cardDescs[1]  && data.jogo.estiloDesc)      cardDescs[1].textContent  = data.jogo.estiloDesc;
    if (cardValues[2] && data.jogo.golpeValor)      cardValues[2].textContent = data.jogo.golpeValor;
    if (cardDescs[2]  && data.jogo.golpeDesc)       cardDescs[2].textContent  = data.jogo.golpeDesc;
  }

  // ── Sobre ─────────────────────────────────────────────────
  const sobreFields = {
    sobreP1: data.sobre.paragrafo1,
    sobreP2: data.sobre.paragrafo2,
    sobreP3: data.sobre.paragrafo3,
    sobreP4: data.sobre.paragrafo4,
  };
  Object.entries(sobreFields).forEach(([id, html]) => {
    const el = document.getElementById(id);
    if (el && html) el.innerHTML = html;
  });

  // Métricas
  const metricsGrid = document.getElementById('metricsGrid');
  if (metricsGrid && data.sobre.metricas) {
    metricsGrid.innerHTML = data.sobre.metricas.map((m, i) => `
      <div class="metric-card${i === data.sobre.metricas.length - 1 ? ' metric-card--accent' : ''}" role="listitem">
        <span class="metric-number">${escHtml(m.numero)}</span>
        <span class="metric-label">${escHtml(m.label)}</span>
      </div>
    `).join('');
  }

  // ── Galeria ───────────────────────────────────────────────
  const galleryGrid    = document.getElementById('galleryGrid');
  const galleryFilters = document.getElementById('galleryFilters');
  
  if (galleryGrid && data.galeria) {
    // 1. Coleta categorias únicas
    const rawCats = data.galeria.filter(i => i.src).map(i => i.legenda || 'Geral');
    const cats = ['all', ...new Set(rawCats)];
    
    // 2. Renderiza filtros
    if (galleryFilters) {
      galleryFilters.innerHTML = cats.map(cat => `
        <button class="filter-btn${cat === 'all' ? ' active' : ''}" data-filter="${cat}">
          ${cat === 'all' ? 'Todas' : escHtml(cat)}
        </button>
      `).join('');

      galleryFilters.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const filter = btn.dataset.filter;
          galleryFilters.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b === btn));
          
          document.querySelectorAll('.gallery-item').forEach(item => {
            const itemCat = item.dataset.category;
            item.classList.toggle('hide', filter !== 'all' && itemCat !== filter);
          });
        });
      });
    }

    // 3. Renderiza fotos
    galleryGrid.innerHTML = data.galeria.map((item, i) => {
      const isLarge = i === 0;
      const hasImg  = item.src && item.src.length > 0;
      const displayCat = item.legenda || 'Geral';
      
      return `
        <div class="gallery-item${isLarge ? ' gallery-item--large' : ''}" 
             data-category="${escHtml(displayCat)}"
             role="listitem" 
             aria-label="${escHtml(item.alt || displayCat || 'Foto do atleta')}">
          ${hasImg
            ? `<img
                src="${escHtml(item.src)}"
                alt="${escHtml(item.alt || 'Erick Giovane')}"
                class="gallery-real-img"
                loading="lazy"
              />
              <div class="gallery-overlay">
                <!-- Overlay de texto removido a pedido do usuário -->
              </div>`
            : `<div class="gallery-placeholder gp-${(i % 6) + 1}">
                <span class="gallery-label">${escHtml(displayCat || 'Em breve')}</span>
               </div>`
          }
        </div>
      `;
    }).join('');

    // 4. Lightbox Click
    galleryGrid.querySelectorAll('.gallery-item').forEach(item => {
      item.addEventListener('click', () => {
        const img = item.querySelector('img');
        if (img) showLightbox(img.src, img.alt);
      });
    });
  }

  // ── Resultados ────────────────────────────────────────────
  const tbody = document.getElementById('resultadosBody');
  if (tbody && data.resultados) {
    tbody.innerHTML = data.resultados.map((row) => {
      const pos = row.posicao && row.posicao.trim()
        ? `<span class="position-badge${row.posicao.includes('1º') ? ' position-badge--gold' : row.posicao.includes('2º') ? ' position-badge--silver' : row.posicao.includes('3º') ? ' position-badge--highlight' : ''}">${escHtml(row.posicao)}</span>`
        : `<span class="position-badge">Em breve</span>`;
      return `
        <tr>
          <td data-label="Campeonato">${escHtml(row.campeonato)}</td>
          <td data-label="Modalidade">${escHtml(row.modalidade)}</td>
          <td data-label="Categoria">${escHtml(row.categoria)}</td>
          <td data-label="Posição">${pos}</td>
        </tr>
      `;
    }).join('');
  }

  // ── Contato ───────────────────────────────────────────────
  const d = data.contato;
  const waLink  = document.getElementById('whatsappLink');
  const emailEl = document.getElementById('emailLink');
  const emailTx = document.getElementById('emailText');
  const igLink  = document.getElementById('instagramLink');

  if (waLink && d.whatsapp) {
    const msg = encodeURIComponent('Olá Erick, vi seu site e tenho interesse em conversar!');
    waLink.href = `https://wa.me/${d.whatsapp}?text=${msg}`;
  }
  if (emailEl && d.email) emailEl.href = `mailto:${d.email}`;
  if (emailTx && d.email) emailTx.textContent = d.email;
  if (igLink  && d.instagram) igLink.href = d.instagram;

  const crTreinador = document.getElementById('creditoTreinador');
  const crClube     = document.getElementById('creditoClube');
  const crCidade    = document.getElementById('creditoCidade');
  if (crTreinador && d.treinador) crTreinador.textContent = d.treinador;
  if (crClube     && d.clube)     crClube.textContent     = d.clube;
  if (crCidade    && d.cidade)    crCidade.textContent    = d.cidade;
}

// ─────────────────────────────────────────────────────────────
// 2. SCROLL REVEAL
// ─────────────────────────────────────────────────────────────
function initReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { root: null, threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach((el) => observer.observe(el));
}

// ─────────────────────────────────────────────────────────────
// 3. HEADER — scroll state + active nav
// ─────────────────────────────────────────────────────────────
function initHeader() {
  const header   = document.querySelector('.site-header');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  function onScroll() {
    header.classList.toggle('scrolled', window.scrollY > 60);
    let currentId = '';
    sections.forEach((section) => {
      if (window.scrollY >= section.offsetTop - 120) currentId = section.getAttribute('id');
    });
    navLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${currentId}`);
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ─────────────────────────────────────────────────────────────
// 4. MOBILE NAV
// ─────────────────────────────────────────────────────────────
function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const nav    = document.getElementById('mainNav');
  if (!toggle || !nav) return;

  function closeNav() {
    nav.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.classList.toggle('open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeNav));
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('open') && !nav.contains(e.target) && e.target !== toggle) closeNav();
  });
  window.addEventListener('resize', () => { if (window.innerWidth > 768) closeNav(); });
}

// ─────────────────────────────────────────────────────────────
// 5. FORMULÁRIO DE CONTATO (visual)
// ─────────────────────────────────────────────────────────────
function initForm() {
  const form      = document.getElementById('contatoForm');
  const statusEl  = document.getElementById('formStatus');
  const submitBtn = document.getElementById('formSubmitBtn');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nome  = document.getElementById('formNome').value.trim();
    const email = document.getElementById('formEmail').value.trim();
    const msg   = document.getElementById('formMensagem').value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!nome || !email || !msg) {
      statusEl.style.color = '#ff6b6b';
      statusEl.textContent = 'Por favor, preencha todos os campos obrigatórios.';
      return;
    }
    if (!emailRegex.test(email)) {
      statusEl.style.color = '#ff6b6b';
      statusEl.textContent = 'Por favor, insira um e-mail válido.';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';
    submitBtn.style.opacity = '0.7';

    setTimeout(() => {
      statusEl.style.color = '#AAFF00';
      statusEl.textContent = '✓ Mensagem enviada! Entrarei em contato em breve.';
      form.reset();
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar mensagem';
      submitBtn.style.opacity = '1';
      setTimeout(() => { statusEl.textContent = ''; }, 6000);
    }, 1200);
  });
}

// ─────────────────────────────────────────────────────────────
// 6. HELPER
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// 6. LIGHTBOX — galeria
// ─────────────────────────────────────────────────────────────
function showLightbox(src, alt) {
  const lightbox = document.getElementById('lightbox');
  const img      = document.getElementById('lightboxImg');
  const close    = document.getElementById('lightboxClose');
  if (!lightbox || !img) return;

  img.src = src;
  img.alt = alt || '';
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  const closeLightbox = () => {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  close.onclick = closeLightbox;
  lightbox.onclick = (e) => { if (e.target === lightbox) closeLightbox(); };
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') {
      closeLightbox();
      document.removeEventListener('keydown', esc);
    }
  });
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─────────────────────────────────────────────────────────────
// INIT — espera DOM estar pronto
// ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize UI components first (doesn't depend on data)
  initHeader();
  initMobileNav();
  
  // Then start loading data and other interactive elements
  renderSiteData().then(() => {
    initReveal();
    initForm();
  });
});
