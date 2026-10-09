/* Project cards from GitHub: filters, search, README dialog and page start-up. */

let REPOS = [],
  filter = "all",
  query = "";
function drawCards() {
  const g = $("#grid");
  g.innerHTML = "";
  const q = query.toLowerCase();
  const list = REPOS.filter(
    (r) =>
      r.full &&
      (filter === "all" || r.lang === filter) &&
      (!q ||
        (r.name + " " + r.desc + " " + r.readme).toLowerCase().includes(q)),
  );
  if (!list.length)
    g.innerHTML =
      '<p class="empty">No projects match. Try another filter or search.</p>';
  list.forEach((r, i) => {
    const c = document.createElement("article");
    c.className = "card rv";
    c.style.setProperty("--d", i * 70 + "ms");
    c.innerHTML =
      '<div class="lang"><i style="background:' +
      (COL[r.lang] || "var(--accent-2)") +
      '"></i>' +
      esc(r.lang || "Code") +
      "</div><h3>" +
      esc(r.name.replace(/[-_]/g, " ")) +
      "</h3><p>" +
      esc(r.sum.text) +
      "</p>" +
      (r.sum.pts.length
        ? '<ul class="pts">' +
          r.sum.pts.map((p) => "<li>" + esc(p) + "</li>").join("") +
          "</ul>"
        : "") +
      '<div class="foot"><button class="more">Read the README</button>' +
      (PF[r.name]
        ? '<button class="more alt" data-p="' +
          PF[r.name] +
          '">How it works</button>'
        : "") +
      '<a href="' +
      r.url +
      '" target="_blank" rel="noopener">GitHub</a></div>';
    c.querySelector(".more").onclick = () => openDlg(r);
    const pb = c.querySelector("[data-p]");
    if (pb) pb.onclick = () => gotoPipe(pb.dataset.p);
    g.appendChild(c);
    reveal(c);
  });
}
function drawChips() {
  const langs = [
    ...new Set(REPOS.filter((r) => r.full && r.lang).map((r) => r.lang)),
  ];
  const c = $("#chips");
  c.innerHTML = "";
  ["all", ...langs].forEach((l) => {
    const b = document.createElement("button");
    b.className = "chip";
    b.textContent = l === "all" ? "All" : l;
    b.setAttribute("aria-pressed", l === filter);
    b.onclick = () => {
      filter = l;
      drawChips();
      drawCards();
    };
    c.appendChild(b);
  });
}
function openDlg(r) {
  $("#dt").textContent = r.name.replace(/[-_]/g, " ");
  $("#dm").innerHTML = md2html(r.readme).replace(/^<h2>.*?<\/h2>/, "");
  $("#dl").href = r.url;
  const d = $("#dlg");
  d.showModal();
  d.scrollTop = 0;
}
$("#dx").onclick = () => $("#dlg").close();
$("#dlg").addEventListener("click", (e) => {
  if (e.target.id === "dlg") e.target.close();
});
$("#q").addEventListener("input", (e) => {
  query = e.target.value.trim();
  drawCards();
});
document.querySelectorAll(".sk").forEach(
  (b) =>
    (b.onclick = () => {
      $("#q").value = b.dataset.s;
      query = b.dataset.s;
      filter = "all";
      drawChips();
      drawCards();
      $("#projects").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    }),
);

async function init() {
  let repos = null,
    days = null,
    live = false;
  try {
    repos = await liveRepos();
    live = true;
  } catch (e) {}
  try {
    days = await liveDays();
  } catch (e) {}
  if (!repos) repos = SNAP.repos;
  if (!days) days = SNAP.days;
  repos.forEach((r) => {
    r.full = !isThin(r.readme) || (!!r.desc && !isThin(r.readme));
    r.sum = summarize(r.readme || "", r.desc);
  });
  REPOS = repos;
  const when = new Date(SNAP.at + "T00:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  $("#src").className = "src" + (live ? " live" : "");
  $("#src").innerHTML =
    "<i></i>" +
    (live
      ? "Live from GitHub. New repos appear when you push them."
      : "Synced from GitHub on " + when + ".");
  drawChips();
  drawCards();
  const rest = repos.filter((r) => !r.full);
  $("#others").innerHTML = rest.length
    ? "Also on GitHub: " +
      rest
        .map(
          (r) =>
            '<a href="' +
            r.url +
            '" target="_blank" rel="noopener">' +
            esc(r.name) +
            "</a>",
        )
        .join(", ") +
      ". These have no full README yet. Add one and each gets its own card here."
    : "";
  const total = heat(days);
  const so = new IntersectionObserver(
    (e, o) => {
      if (e[0].isIntersecting) {
        countUp($("#sRepos"), repos.length);
        countUp(
          $("#sLangs"),
          new Set(repos.map((r) => r.lang).filter(Boolean)).size,
        );
        countUp($("#sContrib"), total);
        o.disconnect();
      }
    },
    { threshold: 0.3 },
  );
  so.observe($("#stats"));
}
init();
