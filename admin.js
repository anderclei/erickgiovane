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

  const removeBtn = document.getElementById('removeHeroBgBtn');
  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      adminData.hero.bgImage = '';
      urlField.value = '';
      updatePreview('');
    });
  }
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

  // Remove
  const removeBtn = document.getElementById('removeAtletaImgBtn');
  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      adminData.hero.athleteImage = '';
      urlField.value = '';
      updatePreview('');
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
  if (!adminData.galeriaCategorias) {
    adminData.galeriaCategorias = 'Competição, Treino, Bastidores';
  }

  const catField = document.getElementById('galleryCategories');
  if (catField) {
    catField.value = adminData.galeriaCategorias || '';
    catField.addEventListener('input', (e) => {
      adminData.galeriaCategorias = e.target.value;
      renderGaleriaEditor(); 
    });
  }

  // Bulk Upload
  const bulkInput = document.getElementById('bulkUploadInput');
  if (bulkInput) {
    bulkInput.addEventListener('change', handleBulkUpload);
  }

  renderGaleriaEditor();
  document.getElementById('addGalleryItemBtn').addEventListener('click', () => {
    adminData.galeria.push({ src: '', alt: '', legenda: '' });
    renderGaleriaEditor();
  });
}

async function handleBulkUpload(e) {
  const files = Array.from(e.target.files);
  if (!files.length) return;

  const container   = document.getElementById('uploadProgressContainer');
  const bar         = document.getElementById('uploadProgressBar');
  const percentText = document.getElementById('uploadPercentage');
  const statusText  = document.getElementById('uploadStatusText');

  container.style.display = 'block';
  let uploadedCount = 0;
  let usedStorage   = false;
  let usedBase64    = false;

  // Pega a primeira categoria disponível como default
  const availableCats = (adminData.galeriaCategorias || 'Competição, Treino, Bastidores')
    .split(',')
    .map(c => c.trim())
    .filter(Boolean);
  const defaultCat = availableCats[0] || '';

  for (const file of files) {
    statusText.textContent = `Enviando: ${file.name} (${uploadedCount + 1}/${files.length})`;

    try {
      const client = sb();
      let src = null;

      if (client) {
        // Tenta Supabase Storage
        const fileExt  = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const filePath = `public/${fileName}`;

        const { error } = await client.storage.from('gallery').upload(filePath, file);

        if (!error) {
          const { data: { publicUrl } } = client.storage.from('gallery').getPublicUrl(filePath);
          src = publicUrl;
          usedStorage = true;
        } else {
          // Erro no Storage → fallback base64
          console.warn('[upload] Storage falhou, usando base64:', error.message);
        }
      }

      if (!src) {
        // Fallback: converte para base64
        src = await readFileAsDataURL(file);
        usedBase64 = true;
      }

      adminData.galeria.push({
        src,
        alt:    file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
        legenda: defaultCat,
      });

      uploadedCount++;
      const progress = Math.round((uploadedCount / files.length) * 100);
      bar.style.width        = `${progress}%`;
      percentText.textContent = `${progress}%`;

    } catch (err) {
      console.error('Erro no upload:', err);
      showToast(`Erro ao enviar ${file.name}`);
    }
  }

  statusText.textContent = '✓ Upload concluído!';
  setTimeout(async () => {
    container.style.display = 'none';
    bar.style.width = '0%';
    renderGaleriaEditor();
    
    let msg = `${uploadedCount} foto(s) adicionadas!`;
    if (usedBase64) msg += ' (Nota: algumas salvas localmente devido à falha no storage)';
    showToast(`${msg} Salvando tudo...`);
    
    await saveAll();
  }, 2000);

  e.target.value = '';
}

function renderGaleriaEditor() {
  const container = document.getElementById('galleryEditor');
  const countEl   = document.getElementById('galleryCount');
  if (!container) return;
  
  container.innerHTML = '';
  countEl.textContent = `${adminData.galeria.length}`;

  const availableCats = (adminData.galeriaCategorias || 'Competição, Treino, Bastidores')
    .split(',')
    .map(c => c.trim())
    .filter(Boolean);

  // Layout em Grid para o Editor
  container.style.display = 'grid';
  container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
  container.style.gap = '1.5rem';

  adminData.galeria.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'gallery-editor-item';
    div.style.background = 'rgba(255,255,255,0.05)';
    div.style.border = '1px solid var(--c-border)';
    div.style.borderRadius = 'var(--radius-md)';
    div.style.padding = '1rem';
    div.style.position = 'relative';

    const hasImg = item.src && item.src.length > 0;
    const catOptions = availableCats.map(c => 
      `<option value="${escHtml(c)}" ${item.legenda === c ? 'selected' : ''}>${escHtml(c)}</option>`
    ).join('');

    div.innerHTML = `
      <div style="position:relative; aspect-ratio: 16/10; margin-bottom:1rem; border-radius: var(--radius-sm); overflow:hidden; background:rgba(0,0,0,0.2)">
        ${hasImg
          ? `<img src="${escHtml(item.src)}" style="width:100%; height:100%; object-fit:cover" loading="lazy" />`
          : `<div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; color:var(--c-muted); font-size:0.8rem">
               <span style="font-size:1.5rem; margin-bottom:0.5rem">📷</span>
               Sem imagem
             </div>`
        }
        <button class="adm-btn adm-btn--danger" data-remove="${i}" style="position:absolute; top:0.5rem; right:0.5rem; width:30px; height:30px; padding:0; display:flex; align-items:center; justify-content:center; border-radius:50%; box-shadow:0 2px 8px rgba(0,0,0,0.4); z-index:10" title="Remover item">✕</button>
        
        <label class="adm-btn adm-btn--ghost" style="position:absolute; bottom:0.5rem; left:0.5rem; right:0.5rem; padding:0.4rem; font-size:0.7rem; cursor:pointer; background:rgba(10,22,40,0.7); backdrop-filter:blur(4px); z-index:10">
          🖼️ Alterar imagem
          <input type="file" class="gallery-item-upload" accept="image/*" data-idx="${i}" style="display:none" />
        </label>
      </div>

      <div class="gallery-editor-fields">
        <div style="margin-bottom:0.75rem">
          <label style="font-size:0.65rem; text-transform:uppercase; color:var(--c-muted); display:block; margin-bottom:0.25rem">Categoria (Álbum)</label>
          <select class="adm-input" data-idx="${i}" data-field="legenda" style="width:100%; padding:0.4rem; font-size:0.85rem">
            <option value="">Sem categoria</option>
            ${catOptions}
          </select>
        </div>
        <div>
          <label style="font-size:0.65rem; text-transform:uppercase; color:var(--c-muted); display:block; margin-bottom:0.25rem">Texto Alt / Descrição</label>
          <input type="text" class="adm-input" placeholder="O que aparece na foto?" value="${escHtml(item.alt)}" data-idx="${i}" data-field="alt" style="width:100%; padding:0.4rem; font-size:0.85rem" />
        </div>
      </div>
    `;
    container.appendChild(div);
  });

  // Event Listeners para Campos de Texto e Select
  container.querySelectorAll('input[data-field], select[data-field]').forEach(input => {
    input.addEventListener('input', (e) => {
      const { idx, field } = e.target.dataset;
      adminData.galeria[+idx][field] = e.target.value;
    });
  });

  // Event Listeners para Upload Individual
  container.querySelectorAll('.gallery-item-upload').forEach(input => {
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      const idx  = +e.target.dataset.idx;
      if (!file) return;

      try {
        showToast('Substituindo imagem...');
        const client = sb();
        let src = null;

        if (client) {
          const fileExt  = file.name.split('.').pop();
          const fileName = `item_${Date.now()}.${fileExt}`;
          const filePath = `public/${fileName}`;

          const { error } = await client.storage.from('gallery').upload(filePath, file);
          if (!error) {
            const { data: { publicUrl } } = client.storage.from('gallery').getPublicUrl(filePath);
            src = publicUrl;
          }
        }

        if (!src) {
          src = await readFileAsDataURL(file);
        }

        adminData.galeria[idx].src = src;
        renderGaleriaEditor();
        showToast('Imagem atualizada! Lembre-se de salvar.');
      } catch (err) {
        console.error(err);
        showToast('Erro ao atualizar imagem.');
      }
    });
  });

  // Event Listeners para Remover
  container.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = +e.currentTarget.dataset.remove;
      adminData.galeria.splice(idx, 1);
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
      showToast('⚠ Armazenamento cheio no navegador! Tente usar imagens menores.');
    } else {
      const msg = err.message || 'Erro desconhecido ao salvar.';
      showToast('❌ Erro ao salvar: ' + msg);
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
