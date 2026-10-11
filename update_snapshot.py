#!/usr/bin/env python3
"""Regenerate data/snapshot.js from public GitHub data.

The portfolio fetches GitHub live when it can. This snapshot is the fallback
that keeps the page populated when that request is blocked or fails.

Usage (from the project root):
    python scripts/update_snapshot.py [github-username]

Set GITHUB_TOKEN to avoid API rate limits (optional, read-only is enough).
If the API is rate-limited, the repo list is read from the public profile page.
"""
import html
import json
import os
import re
import sys
import urllib.request

USER = sys.argv[1] if len(sys.argv) > 1 else "DeveshRayudu"
TOKEN = os.environ.get("GITHUB_TOKEN")
OUT = os.path.join(os.path.dirname(__file__), "..", "data", "snapshot.js")
README_LIMIT = 14000  # characters kept per README


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "portfolio-snapshot"})
    if TOKEN and "api.github.com" in url:
        req.add_header("Authorization", "Bearer " + TOKEN)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8")


def readme_of(name):
    try:
        return get("https://raw.githubusercontent.com/%s/%s/HEAD/README.md" % (USER, name))[:README_LIMIT]
    except Exception:
        return ""


def repos_from_api():
    data = json.loads(get("https://api.github.com/users/%s/repos?per_page=100&sort=pushed" % USER))
    return [{"name": r["name"], "lang": r["language"] or "", "desc": r["description"] or "", "url": r["html_url"]}
            for r in data if not r["fork"]]


def repos_from_profile_page():
    page = get("https://github.com/%s?tab=repositories&type=source" % USER)
    marks = [(m.start(), m.group(1)) for m in re.finditer(
        r'<a href="/%s/([^"/]+)"[^>]*itemprop="name codeRepository"' % re.escape(USER), page)]
    repos, seen = [], set()
    for i, (pos, name) in enumerate(marks):
        if name in seen:
            continue
        seen.add(name)
        card = page[pos:marks[i + 1][0] if i + 1 < len(marks) else len(page)]
        d = re.search(r'itemprop="description">\s*(.*?)\s*</p>', card, re.S)
        lang = re.search(r'itemprop="programmingLanguage">([^<]+)<', card)
        desc = html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", d.group(1)))) if d else ""
        repos.append({"name": name, "lang": lang.group(1) if lang else "", "desc": desc,
                      "url": "https://github.com/%s/%s" % (USER, name)})
    return repos


def fetch_repos():
    try:
        repos = repos_from_api()
    except Exception as err:
        print("GitHub API unavailable (%s); reading the profile page instead." % err)
        repos = repos_from_profile_page()
    repos = [r for r in repos if r["name"] != USER]  # skip the profile README repo
    for r in repos:
        r["readme"] = readme_of(r["name"])
    return repos


def parse_days(page):
    """Return [date, count, level] per day, using GitHub's own level (0-4)."""
    cells = {}
    for m in re.finditer(r"<td[^>]*>", page):
        tag = m.group(0)
        date = re.search(r'data-date="([\d-]+)"', tag)
        cid = re.search(r'id="(contribution-day-component-\d+-\d+)"', tag)
        level = re.search(r'data-level="(\d)"', tag)
        if date and cid:
            cells[cid.group(1)] = (date.group(1), int(level.group(1)) if level else 0)
    days = []
    for m in re.finditer(r'for="(contribution-day-component-\d+-\d+)"[^>]*>([^<]*)</tool-tip>', page):
        if m.group(1) in cells:
            n = re.match(r"(\d+) contribution", m.group(2))
            date, level = cells[m.group(1)]
            days.append([date, int(n.group(1)) if n else 0, level])
    return sorted(days)


def load_existing():
    try:
        with open(OUT, encoding="utf-8") as f:
            text = f.read()
        return json.loads(text[text.index("window.SNAP = ") + 14:].rstrip().rstrip(";"))
    except Exception:
        return None


def main():
    days = parse_days(get("https://github.com/users/%s/contributions" % USER))
    snap = {"at": days[-1][0], "user": USER, "repos": fetch_repos(), "days": days}
    old = load_existing()
    if old and old.get("user") == USER and old.get("repos") == snap["repos"] and old.get("days") == snap["days"]:
        print("No changes since the last run.")
        return
    header = ("/* Fallback copy of the GitHub data, used when the live GitHub request is blocked or fails.\n"
              "   Regenerate it with: python scripts/update_snapshot.py */\n")
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(header + "window.SNAP = " + json.dumps(snap, indent=1, ensure_ascii=False) + ";\n")
    print("Wrote %d repos and %d days (%d contributions) to data/snapshot.js"
          % (len(snap["repos"]), len(days), sum(d[1] for d in days)))


if __name__ == "__main__":
    main()
