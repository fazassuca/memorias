# Contexto do Projeto: Arquivo Pessoal (Diário Biográfico)

## Visão Geral
Site estático pessoal hospedado no GitHub Pages (`fazassuca/memorias`), construído em HTML, CSS e JavaScript puro (sem frameworks ou build steps).

## Identidade Visual
- Estilo: minimalista / editorial.
- Tipografia: `Instrument Serif` (títulos e citações) + `Manrope` (texto corrido e interface).
- Temas: Modo Claro (`#FAF9F6`) e Modo Escuro (`#141413`), alternável na barra superior.

## Estrutura dos Arquivos
- `index.html`: 4 views em página única (`reader`, `timeline`, `map`, `about`) + drawer lateral de filtros.
- `style.css`: Layout responsivo, tela dividida no leitor, galeria horizontal, mapa em escala de cinza e modo escuro.
- `script.js`:
  - Modo aleatório sem repetição (Fisher-Yates).
  - Slideshow de imagens com setas, dots e atalhos de teclado.
  - Filtros clicáveis por Ano, Lugar e Tag (abrem drawer lateral).
  - Galeria em timeline horizontal agrupada por ano.
  - Mapa interativo com Leaflet + OpenStreetMap (`coords: [lat, lng]`).
  - Formatação de texto simples no corpo (`**negrito**`, `*itálico*`, `> citação`).
- `memorias.json`: Base de dados das memórias (`titulo`, `ano`, `lugar`, `coords`, `tags`, `imagens`, `texto`).
- `editor.html`: CMS estático protegido por GitHub Fine-grained Token. Salva direto no `memorias.json` via API do GitHub, faz upload/compressão de fotos para `imagens/`, busca coordenadas via Nominatim, exibe tags já usadas como botões clicáveis e tem barra de formatação.

## Regras para alterações
- Responder sempre em português (pt-BR).
- Manter o projeto 100% estático (HTML/CSS/JS puro), sem exigir Node/npm para rodar.
- Nunca quebrar a compatibilidade com a estrutura atual do `memorias.json`.
- Manter localmente na pasta `_versoes/` (ignorada no `.gitignore`) as 2 versões anteriores mais recentes de `index.html`, `style.css`, `script.js` e `editor.html` antes de cada nova implementação.