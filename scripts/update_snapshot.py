#!/usr/bin/env python3
"""Regenerate data/snapshot.js from public GitHub data.

The portfolio fetches GitHub live when it can. This snapshot is the fallback
that keeps the page populated when that request is blocked or fails.

Usage (from the project root):
    python scripts/update_snapshot.py [github-username]

Set GITHUB_TOKEN to avoid API rate limits (optional, read-only is enough).
"""
import datetime
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


def fetch_repos():
    data = json.loads(get("https://api.github.com/users/%s/repos?per_page=100&sort=pushed" % USER))
    repos = []
    for r in data:
        if r["fork"] or r["name"] == USER:  # skip forks and the profile README repo
            continue
        try:
            readme = get("https://raw.githubusercontent.com/%s/%s/HEAD/README.md" % (USER, r["name"]))[:README_LIMIT]
        except Exception:
            readme = ""
        repos.append({"name": r["name"], "lang": r["language"] or "", "desc": r["description"] or "",
                      "url": r["html_url"], "readme": readme})
    return repos


def fetch_days():
    page = get("https://github.com/users/%s/contributions" % USER)
    dates = {m.group(2): m.group(1) for m in re.finditer(
        r'data-date="(\d{4}-\d\d-\d\d)"\s+id="(contribution-day-component-\d+-\d+)"', page)}
    days = []
    for m in re.finditer(r'for="(contribution-day-component-\d+-\d+)"[^>]*>([^<]*)</tool-tip>', page):
        if m.group(1) in dates:
            n = re.match(r"(\d+) contribution", m.group(2))
            days.append([dates[m.group(1)], int(n.group(1)) if n else 0])
    return sorted(days)


def main():
    snap = {"at": datetime.date.today().isoformat(), "user": USER, "repos": fetch_repos(), "days": fetch_days()}
    header = ("/* Fallback copy of the GitHub data, used when the live GitHub request is blocked or fails.\n"
              "   Regenerate it with: python scripts/update_snapshot.py */\n")
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(header + "window.SNAP = " + json.dumps(snap, indent=1, ensure_ascii=False) + ";\n")
    print("Wrote %d repos and %d days to data/snapshot.js" % (len(snap["repos"]), len(snap["days"])))


if __name__ == "__main__":
    main()
