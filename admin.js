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
// sb() é definido globalmente em data.js (carregado antes)

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
// LOGIN — Supabase Auth (email + senha)
// ─────────────────────────────────────────────────────────────
function initLogin() {
  const form       = document.getElementById('loginForm');
  const emailInput = document.getElementById('loginEmail');
  const passInput  = document.getElementById('loginPass');
  const errorEl    = document.getElementById('loginError');
  const submitBtn  = document.getElementById('loginSubmitBtn');
  const toggleBtn  = document.getElementById('togglePass');

  // Toggle password visibility
  toggleBtn.addEventListener('click', () => {
    const type = passInput.type === 'password' ? 'text' : 'password';
    passInput.type = type;
    toggleBtn.querySelector('svg').style.opacity = type === 'text' ? '0.5' : '1';
  });

  // Form submit — Supabase Auth
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Entrando...';

    const email    = emailInput.value.trim();
    const password = passInput.value;

    if (!email || !password) {
      errorEl.textContent = 'Preencha e-mail e senha.';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Entrar';
      return;
    }

    try {
      const { data, error } = await sb().auth.signInWithPassword({ email, password });
      if (error) throw error;
      showPanel();
    } catch (err) {
      errorEl.textContent = err.message === 'Invalid login credentials'
        ? 'E-mail ou senha incorretos.'
        : (err.message || 'Erro ao fazer login.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Entrar';
    }
  });

  // Verifica sessão já ativa
  sb().auth.getSession().then(({ data: { session } }) => {
    if (session) showPanel();
  });
}

function showPanel() {
  const loginScreen = document.getElementById('loginScreen');
  loginScreen.hidden = true;
  loginScreen.style.display = 'none';
  document.getElementById('adminPanel').hidden = false;
  initPanel();
}

// ─────────────────────────────────────────────────────────────
// PAINEL
// ─────────────────────────────────────────────────────────────
function initPanel() {
  // Preencher todos os campos
  adminData = {};
  loadSiteData().then((data) => {
    adminData = data;
    fillHeroTab();
    fillAtletaTab();
    fillSobreTab();
    fillJogoTab();
    fillGaleriaTab();
    fillResultadosTab();
    fillContatoTab();
  });

  // Tabs
  initTabs();
  initSidebarMobile();

  document.getElementById('globalSaveBtn').addEventListener('click', saveAll);

  // Logout via Supabase
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await sb().auth.signOut();
    location.reload();
  });

  // Senha
  document.getElementById('changeSenhaBtn').addEventListener('click', changeSenha);
  // Usuários
  fillUsuariosTab();
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
    usuarios:   'Usuários',
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
// TAB: USUÁRIOS
// ─────────────────────────────────────────────────────────────
function fillUsuariosTab() {
  renderUsersTable();

  document.getElementById('addUserBtn').addEventListener('click', async () => {
    const nome  = document.getElementById('novoUserNome').value.trim();
    const email = document.getElementById('novoUserEmail').value.trim();
    const role  = document.getElementById('novoUserRole').value;
    const fb    = document.getElementById('userFeedback');

    if (!nome || !email) {
      fb.style.color = '#ff5c5c';
      fb.textContent = 'Preencha nome e e-mail.';
      return;
    }

    const { error } = await sb()
      .from('site_admins')
      .insert({ nome, email, role });

    if (error) {
      fb.style.color = '#ff5c5c';
      fb.textContent = error.code === '23505'
        ? 'Usuário com este e-mail já existe.'
        : ('Erro: ' + error.message);
      return;
    }

    fb.style.color = '#AAFF00';
    fb.textContent = '✓ Usuário adicionado! Crie a senha dele no Supabase Dashboard.';
    document.getElementById('novoUserNome').value  = '';
    document.getElementById('novoUserEmail').value = '';
    renderUsersTable();
    setTimeout(() => { fb.textContent = ''; }, 5000);
  });
}

async function renderUsersTable() {
  const tbody = document.getElementById('usersTableBody');
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--c-muted)">Carregando...</td></tr>';

  const { data, error } = await sb()
    .from('site_admins')
    .select('id, nome, email, role, criado_em')
    .order('criado_em', { ascending: true });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="5" style="color:#ff5c5c;text-align:center">Erro: ${escHtml(error.message)}</td></tr>`;
    return;
  }

  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--c-muted)">Nenhum usuário cadastrado.</td></tr>';
    return;
  }

  tbody.innerHTML = data.map((u) => {
    const criado = u.criado_em ? new Date(u.criado_em).toLocaleDateString('pt-BR') : '—';
    return `<tr>
      <td data-label="Nome">${escHtml(u.nome || '—')}</td>
      <td data-label="E-mail">${escHtml(u.email)}</td>
      <td data-label="Função"><span class="role-badge role-${escHtml(u.role)}">${escHtml(u.role)}</span></td>
      <td data-label="Criado em">${criado}</td>
      <td class="action-cell"><button class="adm-btn adm-btn--danger" data-uid="${escHtml(u.id)}" onclick="removeUser(this)">Remover</button></td>
    </tr>`;
  }).join('');
}

async function removeUser(btn) {
  const uid = btn.dataset.uid;
  if (!confirm('Remover este usuário do painel?')) return;
  const { error } = await sb().from('site_admins').delete().eq('id', uid);
  if (!error) renderUsersTable();
  else showToast('Erro ao remover: ' + error.message);
}

// ─────────────────────────────────────────────────────────────
// ALTERAR SENHA — Supabase Auth
// ─────────────────────────────────────────────────────────────
async function changeSenha() {
  const nova     = document.getElementById('senhaNova').value;
  const confirm  = document.getElementById('senhaConfirm').value;
  const feedback = document.getElementById('senhaFeedback');

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

  const { error } = await sb().auth.updateUser({ password: nova });
  if (error) {
    feedback.style.color = '#ff5c5c';
    feedback.textContent = 'Erro: ' + error.message;
    return;
  }

  feedback.style.color = '#AAFF00';
  feedback.textContent = '✓ Senha alterada com sucesso!';
  document.getElementById('senhaNova').value    = '';
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
