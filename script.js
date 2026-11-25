// CONFIGURAÇÃO DE SENHA OPCIONAL
// Deixe USAR_SENHA = false se for usar apenas localmente ou com Cloudflare Access.
const USAR_SENHA = false;
const SENHA_ACESSO = "minhasenha123";

let memorias = [];
let filaAleatoria = [];
let memoriaAtualIndex = -1;
let slideAtual = 0;
let vistasNoCiclo = 0;

// Elementos DOM
const elApp = document.getElementById("app");
const elLockScreen = document.getElementById("lock-screen");
const elLockForm = document.getElementById("lock-form");
const elLockInput = document.getElementById("lock-input");
const elLockError = document.getElementById("lock-error");

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

const elOverlay = document.getElementById("filter-overlay");
const elFilterType = document.getElementById("filter-type");
const elFilterHeading = document.getElementById("filter-heading");
const elFilterResults = document.getElementById("filter-results");
const elCloseDrawer = document.getElementById("close-drawer");

// Inicialização com trava opcional
function iniciar() {
  if (USAR_SENHA && sessionStorage.getItem("diario_auth") !== "ok") {
    elLockScreen.classList.remove("hidden");
    elApp.classList.add("hidden");
    elLockForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (elLockInput.value === SENHA_ACESSO) {
        sessionStorage.setItem("diario_auth", "ok");
        elLockScreen.classList.add("hidden");
        elApp.classList.remove("hidden");
        carregarMemorias();
      } else {
        elLockError.textContent = "Senha incorreta.";
        elLockInput.value = "";
      }
    });
  } else {
    carregarMemorias();
  }
}

async function carregarMemorias() {
  try {
    const res = await fetch("memorias.json");
    memorias = await res.json();
    if (!memorias.length) return;
    gerarNovaFila();
    proximaAleatoria();
  } catch (err) {
    elTitle.textContent = "Erro ao carregar memorias.json";
    elText.innerHTML = "<p>Abra este site usando o Live Server no VS Code.</p>";
  }
}

// Algoritmo Fisher-Yates: embaralha tudo sem repetir até acabar o ciclo
function gerarNovaFila() {
  filaAleatoria = memorias.map((_, i) => i);
  for (let i = filaAleatoria.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [filaAleatoria[i], filaAleatoria[j]] = [filaAleatoria[j], filaAleatoria[i]];
  }
  // Evita repetir a mesma memória na virada de um ciclo para o outro
  if (filaAleatoria.length > 1 && filaAleatoria[0] === memoriaAtualIndex) {
    [filaAleatoria[0], filaAleatoria[1]] = [filaAleatoria[1], filaAleatoria[0]];
  }
  vistasNoCiclo = 0;
}

function proximaAleatoria() {
  if (filaAleatoria.length === 0) {
    gerarNovaFila();
  }
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

  // Parágrafos do texto
  elText.innerHTML = mem.texto
    .split(/\n+/)
    .filter((p) => p.trim() !== "")
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join("");

  // Tags clicáveis
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

// Filtros por Ano, Lugar ou Tag
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
      // Remove da fila atual caso ainda não tenha aparecido, para não repetir
      filaAleatoria = filaAleatoria.filter((i) => i !== idx);
      renderizarMemoria(idx);
      fecharFiltro();
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
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}

// Eventos
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

// Atalhos de teclado (setas para fotos, Esc para fechar filtro)
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") fecharFiltro();
  if (!elOverlay.classList.contains("hidden")) return;
  if (e.key === "ArrowRight" && memorias[memoriaAtualIndex]?.imagens.length > 1) elNextSlide.click();
  if (e.key === "ArrowLeft" && memorias[memoriaAtualIndex]?.imagens.length > 1) elPrevSlide.click();
});

iniciar();