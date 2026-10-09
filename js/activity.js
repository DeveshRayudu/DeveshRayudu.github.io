/* Month-by-month contribution calendar. */

function heat(days) {
  const map = new Map(days),
    months = [...new Set(days.map((d) => d[0].slice(0, 7)))].sort();
  const max = Math.max(1, ...days.map((d) => d[1])),
    total = days.reduce((s, d) => s + d[1], 0);
  let idx = months.length - 1;
  const root = $("#heat"),
    foot = $("#heatFoot");
  const fmt = (k, o) =>
    new Date(k + "T00:00:00Z").toLocaleDateString(
      "en-GB",
      Object.assign({ timeZone: "UTC" }, o),
    );
  function draw() {
    const ym = months[idx],
      y = +ym.slice(0, 4),
      m = +ym.slice(5, 7);
    $("#mLabel").textContent = fmt(ym + "-01", {
      month: "long",
      year: "numeric",
    });
    $("#mPrev").disabled = idx === 0;
    $("#mNext").disabled = idx === months.length - 1;
    const lead = new Date(Date.UTC(y, m - 1, 1)).getUTCDay(),
      dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
    let out = "",
      sum = 0;
    for (let i = 0; i < lead; i++) out += "<span></span>";
    for (let d = 1; d <= dim; d++) {
      const k = ym + "-" + String(d).padStart(2, "0"),
        v = map.get(k),
        n = v || 0;
      sum += n;
      const lab =
        v === undefined
          ? "No data for " + fmt(k, { day: "numeric", month: "short" })
          : (n || "No") +
            " contribution" +
            (n === 1 ? "" : "s") +
            " on " +
            fmt(k, { day: "numeric", month: "short", year: "numeric" });
      out +=
        '<button class="dy" data-l="' +
        (n ? Math.min(4, Math.ceil((n / max) * 4)) : 0) +
        '"' +
        (v === undefined ? ' data-x="1"' : "") +
        ' data-t="' +
        lab +
        '" aria-label="' +
        lab +
        '" style="--d:' +
        d * 12 +
        'ms">' +
        d +
        "</button>";
    }
    root.innerHTML = out;
    root.dataset.sum =
      sum +
      " contribution" +
      (sum === 1 ? "" : "s") +
      " in " +
      fmt(ym + "-01", { month: "long", year: "numeric" });
    foot.textContent = root.dataset.sum;
  }
  root.addEventListener("mouseover", (e) => {
    const b = e.target.closest(".dy");
    if (b) foot.textContent = b.dataset.t;
  });
  root.addEventListener("focusin", (e) => {
    const b = e.target.closest(".dy");
    if (b) foot.textContent = b.dataset.t;
  });
  root.addEventListener(
    "mouseleave",
    () => (foot.textContent = root.dataset.sum),
  );
  $("#mPrev").onclick = () => {
    if (idx > 0) {
      idx--;
      draw();
    }
  };
  $("#mNext").onclick = () => {
    if (idx < months.length - 1) {
      idx++;
      draw();
    }
  };
  draw();
  return total;
}
