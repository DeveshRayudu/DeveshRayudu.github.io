/* Page polish: scroll reveal, hero typing line and theme toggle. */

document
  .querySelectorAll(".job,.skills div,.learn div,.stats div")
  .forEach(reveal);

/* hero typing */
(function () {
  const w = [
      "computer vision pipelines",
      "machine learning apps",
      "data migration tools",
      "network defences",
    ],
    el = $("#type");
  if (reduce) {
    el.textContent = w[0];
    return;
  }
  let i = 0,
    j = 0,
    del = false;
  (function tick() {
    const s = w[i];
    j += del ? -1 : 1;
    el.textContent = s.slice(0, j);
    let d = del ? 35 : 70;
    if (!del && j === s.length) {
      del = true;
      d = 1500;
    } else if (del && j === 0) {
      del = false;
      i = (i + 1) % w.length;
      d = 300;
    }
    setTimeout(tick, d);
  })();
})();
/* theme toggle */
$("#theme").onclick = () => {
  const r = document.documentElement,
    dark = r.dataset.theme
      ? r.dataset.theme === "dark"
      : matchMedia("(prefers-color-scheme:dark)").matches;
  r.dataset.theme = dark ? "light" : "dark";
};
