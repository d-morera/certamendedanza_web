// ===== Utilities =====
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

// ===== Scroll progress =====
(function initProgress(){
  const bar = $("#progressBar");
  const onScroll = () => {
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop;
    const height = doc.scrollHeight - doc.clientHeight;
    const p = height > 0 ? (scrollTop / height) * 100 : 0;
    bar.style.width = `${p}%`;
  };
  window.addEventListener("scroll", onScroll, { passive:true });
  onScroll();
})();

// ===== Year =====
$("#year").textContent = new Date().getFullYear();

// ===== Theme toggle (persist) =====
(function initTheme(){
  const root = document.documentElement;
  const saved = localStorage.getItem("theme");
    if (saved !== "dark") root.setAttribute("data-theme", "light");
  

  $("#themeToggle").addEventListener("click", () => {
    const isLight = root.getAttribute("data-theme") === "light";
    if (isLight){
      root.removeAttribute("data-theme");
      localStorage.setItem("theme", "dark");
    } else {
      root.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
    }
  });
})();

// ===== Mobile menu =====
(function initMobileMenu(){
  const burger = $("#burger");
  const menu = $("#mobileMenu");

  burger.addEventListener("click", () => {
    menu.classList.toggle("is-open");
  });

  $$("#mobileMenu a").forEach(a => {
    a.addEventListener("click", () => menu.classList.remove("is-open"));
  });
})();

// ===== Fancy hover highlight on cards (mouse position) =====
(function initHoverSpotlight(){
  const cards = $$(".card");
  cards.forEach(card => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      card.style.setProperty("--mx", `${x}%`);
      card.style.setProperty("--my", `${y}%`);
    });
  });
})();

// ===== Reveal on scroll (IntersectionObserver) =====
(function initReveal(){
  const items = $$(".reveal");
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) en.target.classList.add("is-visible");
    });
  }, { threshold: 0.15 });
  items.forEach(i => obs.observe(i));
})();

// ===== Tilt effect (subtle) =====
(function initTilt(){
  const tilts = $$("[data-tilt]");
  const max = 8; // degrees

  tilts.forEach(el => {
    let raf = null;

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;   // 0..1
      const py = (e.clientY - r.top) / r.height;   // 0..1
      const rx = (py - 0.5) * -2; // -1..1
      const ry = (px - 0.5) * 2;  // -1..1
      const tiltX = clamp(rx * max, -max, max);
      const tiltY = clamp(ry * max, -max, max);

      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-2px)`;
      });
    };

    const onLeave = () => {
      if (raf) cancelAnimationFrame(raf);
      el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0px)";
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
  });
})();

// ===== Copy event info =====
(function initCopy(){
  const btn = $("#copyInfo");
  const badge = $("#copiedBadge");

  const info =
`Certamen de Danza · Colegio Mayor Santa María de Europa
Fecha: 9 de abril
Lugar: Madrid
Hora: Apertura 17:00 (duración 2–3h)`;

  btn.addEventListener("click", async () => {
    try{
      await navigator.clipboard.writeText(info);
      badge.textContent = "Copiado ✔";
      setTimeout(() => (badge.textContent = ""), 1600);
    } catch {
      badge.textContent = "No se pudo copiar";
      setTimeout(() => (badge.textContent = ""), 1600);
    }
  });
})();

// ===== Contestants (demo data + filter) =====
const contestants = [
  { name:"Luz & Movimiento", type:"grupo", style:"Contemporáneo", note:"Pieza original" },
  { name:"Aitana Ruiz", type:"solo", style:"Clásico", note:"Variación" },
  { name:"Dúo Eclipse", type:"duo", style:"Urbano", note:"Fusión" },
  { name:"Kintsugi Crew", type:"grupo", style:"Moderno", note:"Narrativa" },
  { name:"Nora Vega", type:"solo", style:"Contemporáneo", note:"Minimal" },
  { name:"Dúo Aria", type:"duo", style:"Neoclásico", note:"Líneas" }
];

function renderContestants(list){
  const grid = $("#contestantsGrid");
  grid.innerHTML = "";
  if (!list.length){
    grid.innerHTML = `<div class="card reveal is-visible"><p class="muted">No hay resultados con ese filtro.</p></div>`;
    return;
  }

  list.forEach(c => {
    const el = document.createElement("article");
    el.className = "card contestant hoverline reveal is-visible";
    el.innerHTML = `
      <div class="contestant__top">
        <h3 class="h3">${c.name}</h3>
        <span class="tag">${labelType(c.type)}</span>
      </div>
      <div class="kicker">${c.style} · <span class="muted">${c.note}</span></div>
      <div class="chips">
        <span class="chip">${labelType(c.type)}</span>
        <span class="chip">${c.style}</span>
      </div>
    `;
    grid.appendChild(el);
  });
}

function labelType(t){
  if (t === "solo") return "Solo";
  if (t === "duo") return "Dúo";
  if (t === "grupo") return "Grupo";
  return t;
}

(function initContestants(){
  const q = $("#q");
  const cat = $("#cat");

  const apply = () => {
    const query = (q.value || "").trim().toLowerCase();
    const type = cat.value;

    const filtered = contestants.filter(c => {
      const inText = `${c.name} ${c.style} ${c.note}`.toLowerCase().includes(query);
      const inType = type === "all" ? true : c.type === type;
      return inText && inType;
    });

    renderContestants(filtered);
  };

  q.addEventListener("input", apply);
  cat.addEventListener("change", apply);

  renderContestants(contestants);
})();

// ===== Form (demo) =====
(function initForm(){
  const form = $("#leadForm");
  const msg = $("#formMsg");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    msg.textContent = `Recibido: ${data.name}. Te contactaremos en ${data.email}.`;
    form.reset();
  });
})();

// ===== Maps button =====
(function initMaps(){
  $("#openMaps").addEventListener("click", () => {
    // Sustituye por una URL real cuando tengas dirección.
    const q = encodeURIComponent("Colegio Mayor Santa María de Europa, Madrid");
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
  });
})();