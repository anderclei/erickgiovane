'use strict';

/* ============================================================
   ADMIN.JS — Painel Administrativo · Erick Giovane
   Armazenamento: localStorage
   Senha padrão: erick2025
============================================================ */

// ── Constantes ───────────────────────────────────────────────
const PASS_KEY = 'erickAdminPass';
const DATA_KEY = 'erickSiteData';
const DEFAULT_PASS = 'askdjaskdjkadk#$';

// ── Estado local do admin ────────────────────────────────────
let adminData = {};

// ─────────────────────────────────────────────────────────────
// UTILITÁRIOS
// ─────────────────────────────────────────────────────────────
function getPass() {
  return localStorage.getItem(PASS_KEY) || DEFAULT_PASS;
}

function showToast(msg, duration = 3000) {
  const toast = document.getElementById('adminToast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────
function initLogin() {
  const form = document.getElementById('loginForm');
  const passInput = document.getElementById('loginPass');
  const errorEl = document.getElementById('loginError');
  const toggleBtn = document.getElementById('togglePass');

  // Toggle password visibility
  toggleBtn.addEventListener('click', () => {
    const type = passInput.type === 'password' ? 'text' : 'password';
    passInput.type = type;
    toggleBtn.querySelector('svg').style.opacity = type === 'text' ? '0.5' : '1';
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    errorEl.textContent = '';

    if (passInput.value === getPass()) {
      document.getElementById('loginScreen').hidden = true;
      document.getElementById('adminPanel').hidden = false;
      initPanel();
    } else {
      errorEl.textContent = 'Senha incorreta. Tente novamente.';
      passInput.value = '';
      passInput.focus();
    }
  });

  // Auto-login if session cookie set (simple session)
  if (sessionStorage.getItem('adminLoggedIn') === '1') {
    document.getElementById('loginScreen').hidden = true;
    document.getElementById('adminPanel').hidden = false;
    initPanel();
  }
}

// ─────────────────────────────────────────────────────────────
// PAINEL
// ─────────────────────────────────────────────────────────────
function initPanel() {
  sessionStorage.setItem('adminLoggedIn', '1');

  // Carregar dados
  adminData = loadSiteData();

  // Preencher todos os campos
  fillHeroTab();
  fillAtletaTab();
  fillSobreTab();
  fillJogoTab();
  fillGaleriaTab();
  fillResultadosTab();
  fillContatoTab();

  // Tabs
  initTabs();

  // Sidebar mobile
  initSidebarMobile();

  // Salvar
  document.getElementById('globalSaveBtn').addEventListener('click', saveAll);

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem('adminLoggedIn');
    location.reload();
  });

  // Senha
  document.getElementById('changeSenhaBtn').addEventListener('click', changeSenha);
}

// ── TABS ─────────────────────────────────────────────────────
function initTabs() {
  const links = document.querySelectorAll('.sidebar-link[data-tab]');
  const tabs  = document.querySelectorAll('.admin-tab');
  const title = document.getElementById('topbarTitle');

  const tabLabels = {
    hero:       'Hero',
    atleta:     'Foto do Atleta',
    sobre:      'Sobre',
    jogo:       'Meu Jogo',
    galeria:    'Galeria',
    resultados: 'Resultados',
    contato:    'Contato',
    senha:      'Senha',
  };

  links.forEach((link) => {
    link.addEventListener('click', () => {
      const tab = link.dataset.tab;

      links.forEach((l) => l.classList.remove('active'));
      link.classList.add('active');

      tabs.forEach((t) => {
        t.classList.remove('active');
        t.hidden = true;
      });

      const target = document.getElementById(`tab-${tab}`);
      if (target) {
        target.classList.add('active');
        target.hidden = false;
      }

      title.textContent = tabLabels[tab] || tab;

      // Close sidebar on mobile
      if (window.innerWidth <= 768) {
        document.getElementById('adminSidebar').classList.remove('open');
      }
    });
  });
}

// ── SIDEBAR MOBILE ────────────────────────────────────────────
function initSidebarMobile() {
  const btn = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('adminSidebar');
  btn.addEventListener('click', () => sidebar.classList.toggle('open'));
  document.addEventListener('click', (e) => {
    if (!sidebar.contains(e.target) && e.target !== btn && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
    }
  });
}

// ─────────────────────────────────────────────────────────────
// TAB: HERO
// ─────────────────────────────────────────────────────────────
function fillHeroTab() {
  const d = adminData.hero;
  const previewImg = document.getElementById('heroPreviewImg');
  const previewPh  = document.getElementById('heroPreviewPlaceholder');

  // Preview
  function updatePreview(src) {
    if (src) {
      previewImg.src = src;
      previewImg.style.display = 'block';
      previewPh.style.display = 'none';
    } else {
      previewImg.style.display = 'none';
      previewPh.style.display = 'flex';
    }
  }
  updatePreview(d.bgImage || '');

  // URL field
  const urlField = document.getElementById('heroImageUrl');
  urlField.value = d.bgImage || '';
  urlField.addEventListener('input', () => {
    adminData.hero.bgImage = urlField.value.trim();
    updatePreview(adminData.hero.bgImage);
  });

  // Upload
  const uploadField = document.getElementById('heroImageUpload');
  uploadField.addEventListener('change', async () => {
    const file = uploadField.files[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataURL(file);
      adminData.hero.bgImage = dataUrl;
      urlField.value = '(imagem carregada)';
      updatePreview(dataUrl);
    } catch (err) {
      console.error(err);
    }
  });

  // Texts
  document.getElementById('heroTagline').value  = d.tagline  || '';
  document.getElementById('heroSubtitle').value = d.subtitle || '';

  document.getElementById('heroTagline').addEventListener('input',  (e) => { adminData.hero.tagline  = e.target.value; });
  document.getElementById('heroSubtitle').addEventListener('input', (e) => { adminData.hero.subtitle = e.target.value; });
}

// ─────────────────────────────────────────────────────────────
// TAB: FOTO DO ATLETA
// ─────────────────────────────────────────────────────────────
function fillAtletaTab() {
  const d = adminData.hero;
  const previewImg = document.getElementById('atletaPreviewImg');
  const previewPh  = document.getElementById('atletaPreviewPlaceholder');
  const urlField   = document.getElementById('atletaImageUrl');
  if (!urlField) return;

  function updatePreview(src) {
    if (src) {
      previewImg.src = src;
      previewImg.style.display = 'block';
      if (previewPh) previewPh.style.display = 'none';
    } else {
      previewImg.style.display = 'none';
      if (previewPh) previewPh.style.display = 'flex';
    }
  }
  urlField.value = d.athleteImage || '';
  updatePreview(d.athleteImage || '');

  urlField.addEventListener('input', () => {
    adminData.hero.athleteImage = urlField.value.trim();
    updatePreview(adminData.hero.athleteImage);
  });

  const uploadField = document.getElementById('atletaImageUpload');
  if (uploadField) {
    uploadField.addEventListener('change', async () => {
      const file = uploadField.files[0];
      if (!file) return;
      try {
        const dataUrl = await readFileAsDataURL(file);
        adminData.hero.athleteImage = dataUrl;
        urlField.value = '(imagem carregada)';
        updatePreview(dataUrl);
      } catch (err) { console.error(err); }
    });
  }
}

// ─────────────────────────────────────────────────────────────
// TAB: SOBRE
// ─────────────────────────────────────────────────────────────
function fillSobreTab() {
  const d = adminData.sobre;

  ['P1', 'P2', 'P3', 'P4'].forEach((key) => {
    const el = document.getElementById(`sobre${key}`);
    el.value = d[`paragrafo${key.slice(1) === '' ? '1' : key.replace('P','')}`] || d[`paragrafo${key.slice(1)}`] || '';
    // Resolve key mapping
  });

  // re-map correctly
  document.getElementById('sobreP1').value = d.paragrafo1 || '';
  document.getElementById('sobreP2').value = d.paragrafo2 || '';
  document.getElementById('sobreP3').value = d.paragrafo3 || '';
  document.getElementById('sobreP4').value = d.paragrafo4 || '';

  ['1','2','3','4'].forEach((n) => {
    document.getElementById(`sobreP${n}`).addEventListener('input', (e) => {
      adminData.sobre[`paragrafo${n}`] = e.target.value;
    });
  });

  // Métricas
  renderMetricsEditor();

  document.getElementById('addMetricBtn').addEventListener('click', () => {
    adminData.sobre.metricas.push({ numero: '', label: '' });
    renderMetricsEditor();
  });
}

// ─────────────────────────────────────────────────────────────
// TAB: MEU JOGO
// ─────────────────────────────────────────────────────────────
function fillJogoTab() {
  if (!adminData.jogo) adminData.jogo = {};
  const d = adminData.jogo;

  const fields = [
    ['jogoIntro',           'intro'],
    ['jogoSuperficieValor', 'superficieValor'],
    ['jogoSuperficieDesc',  'superficieDesc'],
    ['jogoEstiloValor',     'estiloValor'],
    ['jogoEstiloDesc',      'estiloDesc'],
    ['jogoGolpeValor',      'golpeValor'],
    ['jogoGolpeDesc',       'golpeDesc'],
  ];

  fields.forEach(([elId, key]) => {
    const el = document.getElementById(elId);
    if (!el) return;
    el.value = d[key] || '';
    el.addEventListener('input', (e) => { adminData.jogo[key] = e.target.value; });
  });
}

function renderMetricsEditor() {
  const container = document.getElementById('metricsEditor');
  container.innerHTML = '';

  adminData.sobre.metricas.forEach((m, i) => {
    const card = document.createElement('div');
    card.className = 'metric-editor-card';
    card.innerHTML = `
      <div class="adm-form-group">
        <label>Número / Valor</label>
        <input type="text" data-idx="${i}" data-field="numero" value="${escHtml(m.numero)}" placeholder="17" />
      </div>
      <div class="adm-form-group">
        <label>Descrição</label>
        <input type="text" data-idx="${i}" data-field="label" value="${escHtml(m.label)}" placeholder="Anos de idade" />
      </div>
      <button class="adm-btn adm-btn--danger" data-remove="${i}">Remover</button>
    `;
    container.appendChild(card);
  });

  container.querySelectorAll('input').forEach((input) => {
    input.addEventListener('input', (e) => {
      const { idx, field } = e.target.dataset;
      adminData.sobre.metricas[+idx][field] = e.target.value;
    });
  });
  container.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      adminData.sobre.metricas.splice(+e.target.dataset.remove, 1);
      renderMetricsEditor();
    });
  });
}

// ─────────────────────────────────────────────────────────────
// TAB: GALERIA
// ─────────────────────────────────────────────────────────────
function fillGaleriaTab() {
  renderGaleriaEditor();
  document.getElementById('addGalleryItemBtn').addEventListener('click', () => {
    adminData.galeria.push({ src: '', alt: '', legenda: '' });
    renderGaleriaEditor();
  });
}

function renderGaleriaEditor() {
  const container = document.getElementById('galleryEditor');
  const countEl   = document.getElementById('galleryCount');
  container.innerHTML = '';
  countEl.textContent = `${adminData.galeria.length}/6`;

  adminData.galeria.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'gallery-editor-item';

    const hasImg = item.src && item.src.length > 0;
    div.innerHTML = `
      ${hasImg
        ? `<img class="gallery-editor-thumb" src="${escHtml(item.src)}" alt="${escHtml(item.alt)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><div class="gallery-thumb-placeholder" style="display:none">Imagem não encontrada</div>`
        : `<div class="gallery-thumb-placeholder">Sem imagem</div>`
      }
      <div class="gallery-editor-fields">
        <label style="font-size:.72rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--c-muted);margin-bottom:.25rem;display:block">Upload</label>
        <input type="file" accept="image/*" class="file-input gallery-upload" data-idx="${i}" style="margin-bottom:.5rem" />
        <div class="gallery-editor-row">
          <input type="text" placeholder="URL (img/foto1.jpg)" value="${escHtml(item.src)}" data-idx="${i}" data-field="src" />
        </div>
        <div class="gallery-editor-row">
          <input type="text" placeholder="Legenda (ex: Competição)" value="${escHtml(item.legenda)}" data-idx="${i}" data-field="legenda" />
          <button class="adm-btn adm-btn--danger" data-remove="${i}">✕</button>
        </div>
      </div>
    `;
    container.appendChild(div);
  });

  // URL input listeners
  container.querySelectorAll('input[data-field="src"]').forEach((input) => {
    input.addEventListener('input', (e) => {
      adminData.galeria[+e.target.dataset.idx].src = e.target.value;
      renderGaleriaEditor();
    });
  });

  container.querySelectorAll('input[data-field="legenda"]').forEach((input) => {
    input.addEventListener('input', (e) => {
      adminData.galeria[+e.target.dataset.idx].legenda = e.target.value;
    });
  });

  // File uploads
  container.querySelectorAll('.gallery-upload').forEach((input) => {
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      const idx  = +e.target.dataset.idx;
      if (!file) return;
      try {
        const dataUrl = await readFileAsDataURL(file);
        adminData.galeria[idx].src = dataUrl;
        renderGaleriaEditor();
      } catch (err) { console.error(err); }
    });
  });

  // Remove
  container.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      adminData.galeria.splice(+e.target.dataset.remove, 1);
      renderGaleriaEditor();
    });
  });
}

// ─────────────────────────────────────────────────────────────
// TAB: RESULTADOS
// ─────────────────────────────────────────────────────────────
function fillResultadosTab() {
  renderTableEditor();
  document.getElementById('addRowBtn').addEventListener('click', () => {
    adminData.resultados.push({ campeonato: '', modalidade: '', categoria: '', posicao: '' });
    renderTableEditor();
  });
}

function renderTableEditor() {
  const tbody = document.getElementById('tableEditorBody');
  tbody.innerHTML = '';

  adminData.resultados.forEach((row, i) => {
    const tr = document.createElement('tr');
    ['campeonato', 'modalidade', 'categoria', 'posicao'].forEach((field) => {
      const td = document.createElement('td');
      const input = document.createElement('input');
      input.type = 'text';
      input.value = row[field] || '';
      input.placeholder = field.charAt(0).toUpperCase() + field.slice(1);
      input.dataset.idx   = i;
      input.dataset.field = field;
      input.addEventListener('input', (e) => {
        adminData.resultados[+e.target.dataset.idx][e.target.dataset.field] = e.target.value;
      });
      td.appendChild(input);
      tr.appendChild(td);
    });
    // Remove button
    const tdAction = document.createElement('td');
    tdAction.className = 'action-cell';
    const removeBtn = document.createElement('button');
    removeBtn.className = 'adm-btn adm-btn--danger';
    removeBtn.textContent = '✕';
    removeBtn.addEventListener('click', () => {
      adminData.resultados.splice(i, 1);
      renderTableEditor();
    });
    tdAction.appendChild(removeBtn);
    tr.appendChild(tdAction);
    tbody.appendChild(tr);
  });
}

// ─────────────────────────────────────────────────────────────
// TAB: CONTATO
// ─────────────────────────────────────────────────────────────
function fillContatoTab() {
  const d = adminData.contato;
  document.getElementById('contatoWhatsapp').value  = d.whatsapp   || '';
  document.getElementById('contatoEmail').value     = d.email      || '';
  document.getElementById('contatoInstagram').value = d.instagram  || '';
  document.getElementById('contatoTreinador').value = d.treinador  || '';
  document.getElementById('contatoClube').value     = d.clube      || '';
  document.getElementById('contatoCidade').value    = d.cidade     || '';

  ['Whatsapp','Email','Instagram','Treinador','Clube','Cidade'].forEach((f) => {
    document.getElementById(`contato${f}`).addEventListener('input', (e) => {
      adminData.contato[f.toLowerCase()] = e.target.value;
    });
  });
}

// ─────────────────────────────────────────────────────────────
// SALVAR TUDO (async — Supabase + localStorage)
// ─────────────────────────────────────────────────────────────
async function saveAll() {
  const btn = document.getElementById('globalSaveBtn');
  btn.disabled = true;
  btn.textContent = '💾 Salvando...';

  try {
    const result = await saveSiteData(adminData);
    if (result && result.ok) {
      showToast('✓ ' + result.msg);
    } else {
      showToast('⚠ ' + (result ? result.msg : 'Salvo localmente.'));
    }
  } catch (err) {
    if (err.name === 'QuotaExceededError') {
      showToast('⚠ Armazenamento cheio! Reduza o tamanho das imagens.');
    } else {
      showToast('Erro ao salvar. Tente novamente.');
      console.error(err);
    }
  } finally {
    btn.disabled = false;
    btn.textContent = '💾 Salvar alterações';
  }
}

// ─────────────────────────────────────────────────────────────
// ALTERAR SENHA
// ─────────────────────────────────────────────────────────────
function changeSenha() {
  const atual    = document.getElementById('senhaAtual').value;
  const nova     = document.getElementById('senhaNova').value;
  const confirm  = document.getElementById('senhaConfirm').value;
  const feedback = document.getElementById('senhaFeedback');

  if (atual !== getPass()) {
    feedback.style.color = '#ff5c5c';
    feedback.textContent = 'Senha atual incorreta.';
    return;
  }
  if (nova.length < 6) {
    feedback.style.color = '#ff5c5c';
    feedback.textContent = 'A nova senha deve ter pelo menos 6 caracteres.';
    return;
  }
  if (nova !== confirm) {
    feedback.style.color = '#ff5c5c';
    feedback.textContent = 'As senhas não conferem.';
    return;
  }

  localStorage.setItem(PASS_KEY, nova);
  feedback.style.color = '#AAFF00';
  feedback.textContent = '✓ Senha alterada com sucesso!';
  document.getElementById('senhaAtual').value = '';
  document.getElementById('senhaNova').value  = '';
  document.getElementById('senhaConfirm').value = '';

  setTimeout(() => { feedback.textContent = ''; }, 4000);
}

// ─────────────────────────────────────────────────────────────
// HELPER: escape HTML
// ─────────────────────────────────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initLogin);
