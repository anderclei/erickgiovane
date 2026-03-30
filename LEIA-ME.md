# Site Erick Giovane — Guia Rápido

## Adicionar as fotos ao site

Salve as 5 fotos enviadas no chat com EXATAMENTE estes nomes dentro da pasta `img/`:

```
img/
  foto1.jpg   → foto noturna (backhand)
  foto2.jpg   → foto diurna (forehand com bola)
  foto3.jpg   → foto noturna (backswing)
  foto4.jpg   → foto noturna (forehand com raquete borrada)
  foto5.jpg   → foto indoor (backhand agachado)
  demo_hero.png      ← já incluída (gerada)
  demo_celebra.png   ← já incluída (gerada)
  demo_bastidor.png  ← já incluída (gerada)
```

Depois que salvar, o site mostra as fotos automaticamente.

---

## Área Administrativa

**URL:** `http://localhost:5173/admin.html` (local) ou `seudomínio.com/admin.html`

**Senha padrão:** `erick2025`

### O que você pode editar no painel:

| Tab | O que muda |
|---|---|
| **Hero** | Foto de fundo, tagline, subtítulo |
| **Sobre** | 4 parágrafos da história + cards de métricas |
| **Galeria** | Adicionar/remover/trocar fotos (upload direto ou URL) |
| **Resultados** | Tabela completa de campeonatos — add/editar/deletar linhas |
| **Contato** | WhatsApp, e-mail, Instagram, treinador, clube |
| **Senha** | Trocar a senha do painel |

### Como usar:
1. Abra o admin, faça login
2. Faça suas edições
3. Clique **"Salvar alterações"** (botão verde no topo)
4. Clique **"Ver site ↗"** para conferir o resultado

---

## Servidor local

O servidor está rodando em:
- Site: http://localhost:5173
- Admin: http://localhost:5173/admin.html

Para iniciar novamente: abra o terminal na pasta do projeto e rode:
```
npx serve . -p 5173
```

---

## Arquivos do projeto

```
erickgeovane/
├── index.html      ← site principal
├── style.css       ← todo o design
├── script.js       ← lógica do site (reveal, nav, form)
├── data.js         ← dados padrão (editáveis via admin)
├── admin.html      ← painel administrativo
├── admin.css       ← estilo do painel
├── admin.js        ← lógica do painel
└── img/
    ├── foto1.jpg   ← colocar aqui as fotos reais
    ├── foto2.jpg
    ├── foto3.jpg
    ├── foto4.jpg
    ├── foto5.jpg
    ├── demo_hero.png
    ├── demo_celebra.png
    └── demo_bastidor.png
```
