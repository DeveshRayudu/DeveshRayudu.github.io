/* GitHub-style contribution graph: one column per week (Sunday to Saturday),
   month labels on top, GitHub's own colour levels, hover/tap tooltips. */

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"],
    v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/* days: [[YYYY-MM-DD, count, level?], ...] in date order. Returns the total. */
function heat(days) {
  const grid = $("#heat"),
    monthRow = $("#ghMonths"),
    tip = $("#ghTip"),
    box = $(".gh");
  if (!days.length) return 0;

  const max = Math.max(1, ...days.map((d) => d[1])),
    total = days.reduce((sum, d) => sum + d[1], 0),
    offset = new Date(days[0][0] + "T00:00:00Z").getUTCDay(),
    labels = [];
  let cells = "",
    lastMonth = -1;

  days.forEach((d, i) => {
    const dt = new Date(d[0] + "T00:00:00Z"),
      row = dt.getUTCDay(),
      col = Math.floor((i + offset) / 7),
      n = d[1],
      level =
        d[2] !== undefined
          ? d[2]
          : n
            ? Math.min(4, Math.ceil((n / max) * 4))
            : 0,
      when =
        dt.toLocaleDateString("en-GB", { month: "long", timeZone: "UTC" }) +
        " " +
        ordinal(dt.getUTCDate()),
      text =
        (n || "No") +
        " contribution" +
        (n === 1 ? "" : "s") +
        " on " +
        when +
        ".";
    if (row === 0 || i === 0) {
      const m = dt.getUTCMonth();
      if (m !== lastMonth) {
        labels.push({
          col,
          name: dt.toLocaleDateString("en-US", {
            month: "short",
            timeZone: "UTC",
          }),
        });
        lastMonth = m;
      }
    }
    cells +=
      '<i data-l="' +
      level +
      '" data-t="' +
      text +
      '" style="grid-row:' +
      (row + 1) +
      ";grid-column:" +
      (col + 1) +
      ";--d:" +
      col * 12 +
      'ms"></i>';
  });

  if (labels.length > 1 && labels[1].col - labels[0].col < 2)
    labels.shift(); /* avoid overlap */
  grid.innerHTML = cells;
  monthRow.innerHTML = labels
    .map(
      (l) =>
        '<span style="grid-column:' +
        (l.col + 1) +
        ' / span 3">' +
        l.name +
        "</span>",
    )
    .join("");

  const summary =
    total + " contribution" + (total === 1 ? "" : "s") + " in the last year";
  $("#ghTotal").textContent = summary;
  grid.setAttribute("aria-label", "Contribution graph: " + summary);

  function show(cell) {
    const c = cell.getBoundingClientRect(),
      b = box.getBoundingClientRect();
    tip.textContent = cell.dataset.t;
    tip.hidden = false;
    const half = tip.offsetWidth / 2 + 8;
    tip.style.left =
      Math.min(Math.max(c.left - b.left + c.width / 2, half), b.width - half) +
      "px";
    tip.style.top = c.top - b.top - 6 + "px";
  }
  grid.addEventListener("mouseover", (e) => {
    const c = e.target.closest("i[data-t]");
    if (c) show(c);
  });
  grid.addEventListener("click", (e) => {
    const c = e.target.closest("i[data-t]");
    if (c) show(c);
  });
  grid.addEventListener("mouseleave", () => (tip.hidden = true));

  const scroller = $("#ghScroll");
  scroller.scrollLeft =
    scroller.scrollWidth; /* start at the most recent week */
  new IntersectionObserver(
    (e, o) => {
      if (e[0].isIntersecting) {
        grid.classList.add("in");
        o.disconnect();
      }
    },
    { threshold: 0.2 },
  ).observe(grid);
  return total;
}
