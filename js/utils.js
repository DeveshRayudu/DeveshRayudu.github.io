/* Small helpers shared by every module. */

const $ = (s) => document.querySelector(s),
  reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;

const esc = (s) =>
  s.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

const tmo = (ms, p) =>
  Promise.race([
    p,
    new Promise((_, r) => setTimeout(() => r(new Error("timeout")), ms)),
  ]);

function countUp(el, n) {
  if (reduce || n === 0) {
    el.textContent = n;
    return;
  }
  const t0 = performance.now();
  (function f(t) {
    const p = Math.min(1, (t - t0) / 1100);
    el.textContent = Math.round(n * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(f);
  })(t0);
}

const io = new IntersectionObserver(
  (es) =>
    es.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    }),
  { threshold: 0.12 },
);
function reveal(el) {
  reduce ? el.classList.add("in") : io.observe(el);
}
