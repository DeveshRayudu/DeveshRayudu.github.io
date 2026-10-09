/* README handling: turns Markdown into a short summary for cards and into HTML for the project dialog. */

const strip = (s) =>
  s
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
const isThin = (r) =>
  !r || r.length < 400 || /^#\s*React \+ Vite/i.test(r.trim());
function short(t, n) {
  if (t.length <= n) return t;
  const c = t.slice(0, n),
    i = Math.max(c.lastIndexOf(". "), c.lastIndexOf("; "));
  return i > n * 0.5 ? c.slice(0, i + 1) : c.replace(/\s+\S*$/, "") + "…";
}
function summarize(md, desc) {
  let para = [],
    code = false,
    toc = false,
    pts = [],
    sec = "";
  for (const raw of md.replace(/\r/g, "").split("\n")) {
    const l = raw.trim();
    if (l.startsWith("```")) {
      code = !code;
      continue;
    }
    if (code) continue;
    let h = l.match(/^#{2,4}\s+(.*)/);
    if (h) {
      sec = h[1];
      toc = /contents/i.test(sec);
      if (para.length && !para.done) para.done = 1;
      continue;
    }
    if (/^#\s/.test(l)) {
      continue;
    }
    if (!para.done && l && !/^([-*+]\s|\d+\.\s|>|\||---|<|!\[|\[!\[)/.test(l)) {
      para.push(l);
      continue;
    }
    if (para.length) para.done = 1;
    if (
      !toc &&
      pts.length < 3 &&
      /^[-*+]\s/.test(l) &&
      /feature|overview|highlight|key|what/i.test(sec)
    ) {
      const p = strip(l.replace(/^[-*+]\s+/, ""));
      if (p && !/^\[/.test(l.replace(/^[-*+]\s+/, "")) && p.length > 10)
        pts.push(short(p.split(/\s[—–-]\s/)[0], 60));
    }
  }
  let t = strip(para.join(" "));
  if (t.length < 80 || /:$/.test(t)) t = desc || t;
  return { text: short(t, 230), pts };
}
function table(rows) {
  const c = (r) => r.replace(/^\s*\||\|\s*$/g, "").split("|");
  let o = "<table>";
  rows.forEach((r, i) => {
    if (/^[\s|:-]+$/.test(r)) return;
    const tag = i === 0 ? "th" : "td";
    o +=
      "<tr>" +
      c(r)
        .map((x) => "<" + tag + ">" + inl(x.trim()) + "</" + tag + ">")
        .join("") +
      "</tr>";
  });
  return o + "</table>";
}
function inl(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(
      /\[([^\]]+)\]\((https?:[^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>',
    )
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
}
function md2html(src) {
  const L = src.replace(/\r/g, "").split("\n");
  let out = "",
    i = 0,
    list = null,
    skip = false;
  const close = () => {
    if (list) {
      out += "</" + list + ">";
      list = null;
    }
  };
  while (i < L.length) {
    const l = L[i];
    let m;
    if (l.trim().startsWith("```")) {
      let c = "";
      i++;
      while (i < L.length && !L[i].trim().startsWith("```")) {
        c += L[i] + "\n";
        i++;
      }
      i++;
      if (!skip) {
        close();
        out += "<pre><code>" + esc(c) + "</code></pre>";
      }
      continue;
    }
    if ((m = l.match(/^(#{1,4})\s+(.*)/))) {
      skip = /contents/i.test(m[2]);
      if (!skip) {
        close();
        const n = Math.min(m[1].length + 1, 5);
        out += "<h" + n + ">" + inl(m[2]) + "</h" + n + ">";
      }
      i++;
      continue;
    }
    if (skip || /^\s*</.test(l)) {
      i++;
      continue;
    }
    if (/^\s*\|/.test(l)) {
      let r = [];
      while (i < L.length && /^\s*\|/.test(L[i])) {
        r.push(L[i]);
        i++;
      }
      close();
      out += table(r);
      continue;
    }
    if ((m = l.match(/^\s*[-*+]\s+(.*)/))) {
      if (list !== "ul") {
        close();
        out += "<ul>";
        list = "ul";
      }
      out += "<li>" + inl(m[1]) + "</li>";
    } else if ((m = l.match(/^\s*\d+\.\s+(.*)/))) {
      if (list !== "ol") {
        close();
        out += "<ol>";
        list = "ol";
      }
      out += "<li>" + inl(m[1]) + "</li>";
    } else if (/^\s*>/.test(l)) {
      close();
      out += "<blockquote>" + inl(l.replace(/^\s*>\s?/, "")) + "</blockquote>";
    } else if (l.trim() === "" || /^-{3,}$/.test(l.trim())) {
      close();
    } else {
      close();
      out += "<p>" + inl(l) + "</p>";
    }
    i++;
  }
  close();
  return out;
}
