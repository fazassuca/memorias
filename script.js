let memorias = [];
let filaAleatoria = [];
let memoriaAtualIndex = -1;
let slideAtual = 0;
let vistasNoCiclo = 0;
let mapaInstancia = null;

// Views e Navegação
const views = {
  reader: document.getElementById("view-reader"),
  timeline: document.getElementById("view-timeline"),
  map: document.getElementById("view-map"),
  about: document.getElementById("view-about")
};
const navButtons = document.querySelectorAll("[data-view]");

// Elementos do Leitor
const elImg = document.getElementById("slide-image");
const elPrevSlide = document.getElementById("prev-slide");
const elNextSlide = document.getElementById("next-slide");
const elSlideCounter = document.getElementById("slide-counter");
const elSlideDots = document.getElementById("slide-dots");

const elYear = document.getElementById("memory-year");
const elCity = document.getElementById("memory-city");
const elTitle = document.getElementById("memory-title");
const elTags = document.getElementById("memory-tags");
const elText = document.getElementById("memory-text");
const elCycleCounter = document.getElementById("cycle-counter");
const elNextRandom = document.getElementById("next-random");

const elTimelineTrack = document.getElementById("timeline-track");
const elOverlay = document.getElementById("filter-overlay");
const elFilterType = document.getElementById("filter-type");
const elFilterHeading = document.getElementById("filter-heading");
const elFilterResults = document.getElementById("filter-results");
const elCloseDrawer = document.getElementById("close-drawer");
const elThemeToggle = document.getElementById("theme-toggle");

// --- MODO CLARO / ESCURO ---
function aplicarTema(tema) {
  document.documentElement.setAttribute("data-theme", tema);
  localStorage.setItem("diario_tema", tema);
  if (elThemeToggle) {
    elThemeToggle.textContent = tema === "dark" ? "Claro" : "Escuro";
  }
}

const temaSalvo =
  localStorage.getItem("diario_tema") ||
  (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
aplicarTema(temaSalvo);

if (elThemeToggle) {
  elThemeToggle.addEventListener("click", () => {
    const atual = document.documentElement.getAttribute("data-theme");
    aplicarTema(atual === "dark" ? "light" : "dark");
  });
}

// --- CARREGAMENTO DOS DADOS ---
async function carregarMemorias() {
  try {
const res = await fetch(`memorias.json?t=${Date.now()}`, { cache: "no-store" });
    memorias = await res.json();
    if (!memorias.length) return;
    gerarNovaFila();
    proximaAleatoria();
    construirTimeline();
  } catch (err) {
    elTitle.textContent = "Erro ao carregar memorias.json";
    elText.innerHTML = "<p>Verifique se o arquivo memorias.json está na mesma pasta do site.</p>";
  }
}

// --- NAVEGAÇÃO ENTRE PÁGINAS ---
function mudarView(nomeView) {
  Object.entries(views).forEach(([chave, el]) => {
    el.classList.toggle("hidden", chave !== nomeView);
  });

  document.querySelectorAll(".nav-btn[data-view]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === nomeView);
  });

  if (nomeView === "map") {
    iniciarMapa();
    setTimeout(() => mapaInstancia && mapaInstancia.invalidateSize(), 100);
  }
}

navButtons.forEach((btn) => {
  btn.addEventListener("click", () => mudarView(btn.dataset.view));
});

// --- MODO ALEATÓRIO SEM REPETIÇÃO ---
function gerarNovaFila() {
  filaAleatoria = memorias.map((_, i) => i);
  for (let i = filaAleatoria.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [filaAleatoria[i], filaAleatoria[j]] = [filaAleatoria[j], filaAleatoria[i]];
  }
  if (filaAleatoria.length > 1 && filaAleatoria[0] === memoriaAtualIndex) {
    [filaAleatoria[0], filaAleatoria[1]] = [filaAleatoria[1], filaAleatoria[0]];
  }
  vistasNoCiclo = 0;
}

function proximaAleatoria() {
  if (filaAleatoria.length === 0) gerarNovaFila();
  const proximoIndex = filaAleatoria.shift();
  vistasNoCiclo++;
  renderizarMemoria(proximoIndex);
}

function renderizarMemoria(index) {
  memoriaAtualIndex = index;
  const mem = memorias[index];
  slideAtual = 0;

  elYear.textContent = mem.ano;
  elCity.textContent = mem.lugar;
  elTitle.textContent = mem.titulo;

  elText.innerHTML = mem.texto
    .split(/\n+/)
    .filter((p) => p.trim() !== "")
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join("");

  elTags.innerHTML = "";
  (mem.tags || []).forEach((tag) => {
    const btn = document.createElement("button");
    btn.className = "tag-btn";
    btn.textContent = `#${tag}`;
    btn.addEventListener("click", () => abrirFiltro("tag", tag));
    elTags.appendChild(btn);
  });

  elCycleCounter.textContent = `${String(vistasNoCiclo).padStart(2, "0")} / ${String(memorias.length).padStart(2, "0")} no ciclo`;
  atualizarSlideshow();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function atualizarSlideshow() {
  const imagens = memorias[memoriaAtualIndex].imagens || [];
  if (!imagens.length) {
    elImg.src = "";
    elSlideCounter.textContent = "00 / 00";
    return;
  }

  elImg.src = imagens[slideAtual];
  const total = imagens.length;
  elSlideCounter.textContent = `${String(slideAtual + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;

  const mostrarControles = total > 1;
  elPrevSlide.classList.toggle("hidden", !mostrarControles);
  elNextSlide.classList.toggle("hidden", !mostrarControles);

  elSlideDots.innerHTML = "";
  if (mostrarControles) {
    imagens.forEach((_, idx) => {
      const dot = document.createElement("button");
      dot.className = `dot ${idx === slideAtual ? "active" : ""}`;
      dot.addEventListener("click", () => {
        slideAtual = idx;
        atualizarSlideshow();
      });
      elSlideDots.appendChild(dot);
    });
  }
}

// --- GALERIA / TIMELINE HORIZONTAL ---
function construirTimeline() {
  elTimelineTrack.innerHTML = "";

  const porAno = {};
  memorias.forEach((mem, idx) => {
    const ano = mem.ano;
    if (!porAno[ano]) porAno[ano] = [];
    porAno[ano].push({ mem, idx });
  });

  const anosOrdenados = Object.keys(porAno).sort((a, b) => Number(a) - Number(b));

  anosOrdenados.forEach((ano) => {
    const grupo = document.createElement("div");
    grupo.className = "timeline-year-group";

    const marcador = document.createElement("div");
    marcador.className = "timeline-year-marker";
    marcador.textContent = ano;
    grupo.appendChild(marcador);

    porAno[ano].forEach(({ mem, idx }) => {
      const card = document.createElement("article");
      card.className = "gallery-card";
      const thumb = mem.imagens && mem.imagens[0] ? mem.imagens[0] : "";
      card.innerHTML = `
        <div class="gallery-frame">
          <img src="${thumb}" alt="${escapeHtml(mem.titulo)}" loading="lazy" />
        </div>
        <h3 class="gallery-card-title">${escapeHtml(mem.titulo)}</h3>
        <div class="gallery-card-meta">${escapeHtml(mem.lugar)}</div>
      `;
      card.addEventListener("click", () => {
        filaAleatoria = filaAleatoria.filter((i) => i !== idx);
        renderizarMemoria(idx);
        mudarView("reader");
      });
      grupo.appendChild(card);
    });

    elTimelineTrack.appendChild(grupo);
  });
}

elTimelineTrack.addEventListener(
  "wheel",
  (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      elTimelineTrack.scrollLeft += e.deltaY;
    }
  },
  { passive: false }
);

// --- MAPA INTERATIVO (OpenStreetMap) ---
function iniciarMapa() {
  if (mapaInstancia) return;

  mapaInstancia = L.map("map-container", { zoomControl: true }).setView([-14.235, -51.925], 3);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap",
    maxZoom: 18
  }).addTo(mapaInstancia);

  const cidades = {};
  memorias.forEach((mem) => {
    if (Array.isArray(mem.coords) && mem.coords.length === 2) {
      if (!cidades[mem.lugar]) {
        cidades[mem.lugar] = { coords: mem.coords, total: 0 };
      }
      cidades[mem.lugar].total++;
    }
  });

  const pontos = [];
  Object.entries(cidades).forEach(([cidade, info]) => {
    pontos.push(info.coords);
    const icon = L.divIcon({
      className: "custom-pin",
      html: String(info.total),
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const marker = L.marker(info.coords, { icon }).addTo(mapaInstancia);
    marker.bindTooltip(`${cidade} (${info.total})`, { direction: "top", offset: [0, -12] });
    marker.on("click", () => abrirFiltro("lugar", cidade));
  });

  if (pontos.length > 0) {
    mapaInstancia.fitBounds(pontos, { padding: [60, 60], maxZoom: 6 });
  }
}

// --- FILTROS (DRAWER LATERAL) ---
function abrirFiltro(tipo, valor) {
  const titulos = { ano: "Ano", lugar: "Lugar", tag: "Tag" };
  elFilterType.textContent = titulos[tipo];
  elFilterHeading.textContent = tipo === "tag" ? `#${valor}` : valor;

  const filtradas = memorias
    .map((mem, idx) => ({ mem, idx }))
    .filter(({ mem }) => {
      if (tipo === "ano") return String(mem.ano) === String(valor);
      if (tipo === "lugar") return mem.lugar === valor;
      if (tipo === "tag") return (mem.tags || []).includes(valor);
      return false;
    });

  elFilterResults.innerHTML = "";
  filtradas.forEach(({ mem, idx }) => {
    const li = document.createElement("li");
    li.className = "filter-item";
    const thumb = mem.imagens && mem.imagens[0] ? mem.imagens[0] : "";
    li.innerHTML = `
      <img class="filter-thumb" src="${thumb}" alt="" />
      <div>
        <div class="filter-item-title">${escapeHtml(mem.titulo)}</div>
        <div class="filter-item-meta">${escapeHtml(String(mem.ano))} · ${escapeHtml(mem.lugar)}</div>
      </div>
    `;
    li.addEventListener("click", () => {
      filaAleatoria = filaAleatoria.filter((i) => i !== idx);
      renderizarMemoria(idx);
      fecharFiltro();
      mudarView("reader");
    });
    elFilterResults.appendChild(li);
  });

  elOverlay.classList.remove("hidden");
}

function fecharFiltro() {
  elOverlay.classList.add("hidden");
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}

// --- EVENTOS ---
elNextRandom.addEventListener("click", proximaAleatoria);
elYear.addEventListener("click", () => abrirFiltro("ano", memorias[memoriaAtualIndex].ano));
elCity.addEventListener("click", () => abrirFiltro("lugar", memorias[memoriaAtualIndex].lugar));

elPrevSlide.addEventListener("click", () => {
  const total = memorias[memoriaAtualIndex].imagens.length;
  slideAtual = (slideAtual - 1 + total) % total;
  atualizarSlideshow();
});

elNextSlide.addEventListener("click", () => {
  const total = memorias[memoriaAtualIndex].imagens.length;
  slideAtual = (slideAtual + 1) % total;
  atualizarSlideshow();
});

elCloseDrawer.addEventListener("click", fecharFiltro);
elOverlay.addEventListener("click", (e) => {
  if (e.target === elOverlay) fecharFiltro();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") fecharFiltro();
  if (!elOverlay.classList.contains("hidden") || views.reader.classList.contains("hidden")) return;
  if (e.key === "ArrowRight" && memorias[memoriaAtualIndex]?.imagens.length > 1) elNextSlide.click();
  if (e.key === "ArrowLeft" && memorias[memoriaAtualIndex]?.imagens.length > 1) elPrevSlide.click();
});

carregarMemorias();
