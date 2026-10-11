/* GitHub access: live repo list, READMEs and contribution calendar. */

const USER = "DeveshRayudu";

const COL = {
  Python: "#3572A5",
  R: "#198CE7",
  JavaScript: "#f1e05a",
  HTML: "#e34c26",
  TypeScript: "#3178c6",
};

async function liveRepos() {
  const r = await tmo(
    5000,
    fetch(
      "https://api.github.com/users/" +
        USER +
        "/repos?per_page=100&sort=pushed",
    ),
  );
  if (!r.ok) throw new Error("api");
  const l = (await r.json()).filter((x) => !x.fork && x.name !== USER);
  return Promise.all(
    l.map(async (x) => {
      let rd = "";
      try {
        const q = await tmo(
          5000,
          fetch(
            "https://raw.githubusercontent.com/" +
              USER +
              "/" +
              x.name +
              "/HEAD/README.md",
          ),
        );
        if (q.ok) rd = (await q.text()).slice(0, 14000);
      } catch (e) {}
      return {
        name: x.name,
        lang: x.language || "",
        desc: x.description || "",
        url: x.html_url,
        readme: rd,
      };
    }),
  );
}
async function liveDays() {
  const r = await tmo(
    5000,
    fetch(
      "https://github-contributions-api.jogruber.de/v4/" + USER + "?y=last",
    ),
  );
  if (!r.ok) throw new Error("cal");
  const j = await r.json();
  return j.contributions.map((d) => [d.date, d.count]);
}
