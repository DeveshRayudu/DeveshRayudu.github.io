/* Project pipelines: tab switching and the animated run. */

const PF = {
  "Radiometric-Align": "sat",
  "DOE-DTL": "ddos",
  "Screen-Time-and-Productivity": "ml",
  "Cross-Database": "xdb",
};
(function () {
  const tabs = [...document.querySelectorAll(".ptabs button")],
    panes = [...document.querySelectorAll(".pipe")],
    timers = new Map();
  const stop = (p) => {
    clearTimeout(timers.get(p));
    timers.delete(p);
  };
  function run(p) {
    stop(p);
    const sts = [...p.querySelectorAll(".st")],
      bar = p.querySelector(".prog i"),
      btn = p.querySelector(".run");
    sts.forEach((s) => s.classList.remove("on", "done"));
    bar.style.width = "0";
    if (reduce) {
      sts.forEach((s) => s.classList.add("done"));
      bar.style.width = "100%";
      btn.textContent = "Run again";
      return;
    }
    btn.textContent = "Running…";
    let i = 0;
    (function next() {
      if (i > 0) {
        sts[i - 1].classList.remove("on");
        sts[i - 1].classList.add("done");
      }
      if (i >= sts.length) {
        btn.textContent = "Run again";
        timers.delete(p);
        return;
      }
      sts[i].classList.add("on");
      bar.style.width = ((i + 1) / sts.length) * 100 + "%";
      i++;
      timers.set(p, setTimeout(next, 1200));
    })();
  }
  function select(id, play) {
    tabs.forEach((t) => t.setAttribute("aria-selected", t.dataset.p === id));
    panes.forEach((p) => {
      const on = p.id === "pipe-" + id;
      p.hidden = !on;
      if (!on) stop(p);
    });
    if (play) run($("#pipe-" + id));
  }
  tabs.forEach((t) => (t.onclick = () => select(t.dataset.p, true)));
  panes.forEach((p) => (p.querySelector(".run").onclick = () => run(p)));
  select(tabs[0].dataset.p, false);
  new IntersectionObserver(
    (e, o) => {
      if (e[0].isIntersecting) {
        const p = $("#pipelines .pipe:not([hidden])");
        if (p && !p.querySelector(".st.on,.st.done")) run(p);
        o.disconnect();
      }
    },
    { threshold: 0.3 },
  ).observe($("#pipelines .runbar"));
  window.gotoPipe = (id) => {
    select(id, true);
    $("#pipelines").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  };
})();
