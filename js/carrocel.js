// Carrossel automático com fallback local
document.addEventListener("DOMContentLoaded", async () => {
  const el = document.getElementById("carrossel-eventos");
  if (!el) return;

  // Se já tem slides no HTML, mantém como fallback
  let temSlides = !!el.querySelector(".slide");
  let imgs = [];

  try {
    const r = await fetch("/api/eventos");
    const data = await r.json();
    const destaques = (data?.eventos || []).filter(e => e.destacar_na_homepage);

    imgs = destaques.flatMap(e => (e.imagem || e.imagens || []).map(x => (x.url || x)));
    if (imgs.length) {
      el.innerHTML = imgs.map((src, i) =>
        `<div class="slide fade" style="display:${i===0?'block':'none'}"><img src="${src}" alt="Evento"></div>`
      ).join("");
      temSlides = true;
    }
  } catch (err) {
    console.warn("Carrossel usando fallback local:", err);
  }

  if (!temSlides) return;

  let i = 0;
  setInterval(() => {
    const slides = el.querySelectorAll(".slide");
    slides.forEach(s => s.style.display = "none");
    i = (i + 1) % slides.length;
    slides[i].style.display = "block";
  }, 4000);
});
