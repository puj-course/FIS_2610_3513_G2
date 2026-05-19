#!/usr/bin/env python3
"""
sprint_report.py
----------------
No inputs needed. Reads the full commit history of the repo,
splits it into 1-week sprints automatically (from the first commit),
and produces:

  sprint-reports/SPRINTS.md  — full report:
                               • commits per user per sprint
                               • average commits per sprint (per user + team)
                               • traceability: every commit linked to its author
"""

import json, os
from datetime import datetime, timezone, timedelta
from collections import defaultdict
import requests
from dateutil import parser as dateparser

# ── Config ────────────────────────────────────────────────────────────────────

TOKEN   = os.environ["GITHUB_TOKEN"]
REPO    = os.environ["REPO"]
MEMBERS_RAW = os.environ.get("TEAM_MEMBERS", "")
MEMBERS = [m.strip() for m in MEMBERS_RAW.split(",") if m.strip()]

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}

# ── GitHub API helper ─────────────────────────────────────────────────────────

def gh_get(url, params=None):
    results = []
    while url:
        r = requests.get(url, headers=HEADERS, params=params)
        if r.status_code in (422, 409):
            return []
        r.raise_for_status()
        data = r.json()
        if isinstance(data, list):
            results.extend(data)
        else:
            return data
        link = r.headers.get("Link", "")
        url, params = None, None
        for part in link.split(","):
            if 'rel="next"' in part:
                url = part.split(";")[0].strip().strip("<>")
    return results

def api(path, params=None):
    return gh_get(f"https://api.github.com/{path}", params)

# ── 1. Fetch all commits ──────────────────────────────────────────────────────

print(f"Fetching all commits for {REPO}...")
raw_commits = api(f"repos/{REPO}/commits", params={"per_page": 100})

if not raw_commits:
    print("No commits found.")
    exit(0)

# Parse into clean list sorted oldest → newest
commits = []
for c in raw_commits:
    author = (c.get("author") or {}).get("login", "") or c["commit"]["author"].get("email", "unknown")
    date   = dateparser.parse(c["commit"]["committer"]["date"])
    commits.append({
        "sha":      c["sha"][:7],
        "full_sha": c["sha"],
        "message":  c["commit"]["message"].split("\n")[0][:80],
        "date":     date,
        "author":   author,
    })

commits.sort(key=lambda c: c["date"])

# ── 2. Real sprint windows ────────────────────────────────────────────────────

now = datetime.now(timezone.utc)

SPRINT_DATES = [
    (1,  "2026-02-12", "2026-02-18"),
    (2,  "2026-02-19", "2026-02-25"),
    (3,  "2026-02-26", "2026-03-04"),
    (4,  "2026-03-05", "2026-03-10"),
    (5,  "2026-03-11", "2026-03-18"),
    (6,  "2026-03-23", "2026-03-29"),
    (7,  "2026-03-30", "2026-04-05"),
    (8,  "2026-04-06", "2026-04-12"),
    (9,  "2026-04-13", "2026-04-19"),
    (10, "2026-04-20", "2026-04-26"),
    (11, "2026-04-27", "2026-05-03"),
    (12, "2026-05-04", "2026-05-10"),
    (13, "2026-05-11", "2026-05-17"),
]

sprints = []

for number, since_str, until_str in SPRINT_DATES:
    since = datetime.fromisoformat(since_str).replace(tzinfo=timezone.utc)

    # +1 día para incluir el último día completo
    until = (
        datetime.fromisoformat(until_str)
        .replace(tzinfo=timezone.utc)
        + timedelta(days=1)
    )

    sprints.append({
        "number": number,
        "since": since,
        "until": until,
    })

print(f"Loaded {len(sprints)} configured sprint(s)")

# ── 3. Bucket commits into sprints ───────────────────────────────────────────

def commits_for_sprint(sprint):
    result = defaultdict(list)
    for c in commits:
        if sprint["since"] <= c["date"] < sprint["until"]:
            author = c["author"]
            if not MEMBERS or author in MEMBERS:
                result[author].append(c)
    # Ensure all tracked members appear
    for m in MEMBERS:
        if m not in result:
            result[m] = []
    return result

sprint_results = []
for s in sprints:
    by_member = commits_for_sprint(s)
    members   = sorted(by_member.keys())
    counts    = {m: len(by_member[m]) for m in members}
    total     = sum(counts.values())
    average   = round(total / len(members), 2) if members else 0
    sprint_results.append({
        "number":    s["number"],
        "since":     s["since"].strftime("%Y-%m-%d"),
       "until":     (s["until"] - timedelta(days=1)).strftime("%Y-%m-%d"),
        "members":   members,
        "counts":    counts,
        "log":       {m: by_member[m] for m in members},
        "total":     total,
        "average":   average,
    })

# ── 4. All-sprint averages per member ────────────────────────────────────────

all_members = sorted({m for s in sprint_results for m in s["members"]})

avg_per_member = {}
for m in all_members:
    sprints_with = [s for s in sprint_results if m in s["counts"]]
    total_commits = sum(s["counts"][m] for s in sprints_with)
    avg_per_member[m] = round(total_commits / len(sprints_with), 2) if sprints_with else 0

overall_avg = round(
    sum(s["average"] for s in sprint_results) / len(sprint_results), 2
) if sprint_results else 0

# ── 5. Fetch PRs and reviews (once, for traceability) ────────────────────────

print("Fetching pull requests and reviews...")
all_prs = api(f"repos/{REPO}/pulls", params={"state": "all", "per_page": 100, "sort": "updated", "direction": "desc"})

prs_by_author    = defaultdict(list)
reviews_by_login = defaultdict(list)

for pr in all_prs:
    login = (pr.get("user") or {}).get("login", "unknown")
    created = dateparser.parse(pr["created_at"])
    prs_by_author[login].append({
        "number":  pr["number"],
        "title":   pr["title"][:60],
        "merged":  pr.get("merged_at") is not None,
        "url":     pr["html_url"],
        "created": created,
    })
    for rv in api(f"repos/{REPO}/pulls/{pr['number']}/reviews"):
        reviewer = (rv.get("user") or {}).get("login", "unknown")
        if rv.get("state") in ("APPROVED", "CHANGES_REQUESTED", "COMMENTED"):
            reviews_by_login[reviewer].append({
                "pr":    pr["number"],
                "title": pr["title"][:50],
                "state": rv["state"],
                "date":  dateparser.parse(rv["submitted_at"]) if rv.get("submitted_at") else None,
            })

# ── 6. Render SPRINTS.md ─────────────────────────────────────────────────────

def render(sprint_results, all_members, avg_per_member, overall_avg):
    lines = []
    a = lines.append

    a(f"# Sprint participation report")
    a(f"")
    a(f"_Generated: {now.strftime('%Y-%m-%d %H:%M')} UTC · Repo: `{REPO}`_")
    a(f"")

    # ── Overall averages ──────────────────────────────────────────────────────
    a(f"## Overall averages — all sprints")
    a(f"")
    a(f"| Member | Total commits | Avg commits / sprint |")
    a(f"|--------|-------------:|---------------------:|")
    for m in all_members:
        total = sum(s["counts"].get(m, 0) for s in sprint_results)
        a(f"| `{m}` | {total} | {avg_per_member[m]} |")
    a(f"| **Team** | **{sum(s['total'] for s in sprint_results)}** | **{overall_avg}** |")
    a(f"")

    # ── Sprint summary table ──────────────────────────────────────────────────
    a(f"## Commits per sprint — summary")
    a(f"")
    header  = "| Sprint | Period |" + "".join(f" `{m}` |" for m in all_members) + " Total | Team avg |"
    divider = "|--------|--------|" + "".join("------:|" for _ in all_members) + "------:|---------:|"
    a(header)
    a(divider)
    for s in sprint_results:
        period = f"{s['since']} → {s['until']}"
        cols   = "".join(f" {s['counts'].get(m, 0)} |" for m in all_members)
        a(f"| Sprint {s['number']} | {period} |{cols} {s['total']} | {s['average']} |")
    a(f"")

    # ── Per-sprint traceability ───────────────────────────────────────────────
    a(f"## Traceability — commits per sprint per member")
    a(f"")
    for s in sprint_results:
        a(f"### Sprint {s['number']} — {s['since']} → {s['until']}")
        a(f"")
        for m in s["members"]:
            log = s["log"].get(m, [])
            # PRs and reviews in this sprint window
            since_dt = dateparser.parse(s["since"] + "T00:00:00+00:00")
            until_dt = dateparser.parse(s["until"] + "T23:59:59+00:00")
            prs      = [p for p in prs_by_author.get(m, []) if since_dt <= p["created"] <= until_dt]
            reviews  = [r for r in reviews_by_login.get(m, []) if r["date"] and since_dt <= r["date"] <= until_dt]

            a(f"#### `{m}` — {len(log)} commit(s) · {len(prs)} PR(s) · {len(reviews)} review(s)")
            a(f"")
            if log:
                a(f"| SHA | Date | Message |")
                a(f"|-----|------|---------|")
                for c in log:
                    link = f"[`{c['sha']}`](https://github.com/{REPO}/commit/{c['full_sha']})"
                    a(f"| {link} | {c['date'].strftime('%Y-%m-%d')} | {c['message']} |")
                a(f"")
            else:
                a(f"_No commits._")
                a(f"")
            if prs:
                for pr in prs:
                    tag = "✅ merged" if pr["merged"] else "open"
                    a(f"- PR [#{pr['number']}]({pr['url']}) {pr['title']} — {tag}")
                a(f"")
            if reviews:
                for rv in reviews:
                    a(f"- Reviewed PR #{rv['pr']} · {rv['title']} · `{rv['state']}`")
                a(f"")

    return "\n".join(lines)

# ── 7. Write file ─────────────────────────────────────────────────────────────

os.makedirs("sprint-reports", exist_ok=True)
out_path = "sprint-reports/SPRINTS.md"

with open(out_path, "w", encoding="utf-8") as f:
    f.write(render(sprint_results, all_members, avg_per_member, overall_avg))

# ── 8. Console summary ───────────────────────────────────────────────────────

print(f"\n{'─'*55}")
print(f"  {'Sprint':<10} {'Period':<24} {'Total':>6} {'Avg':>6}")
print(f"{'─'*55}")
for s in sprint_results:
    print(f"  {s['number']:<10} {s['since']} → {s['until']}  {s['total']:>6}  {s['average']:>6}")
print(f"{'─'*55}")
print(f"  Overall avg commits/sprint: {overall_avg}")
print(f"\n  Report → {out_path}")
