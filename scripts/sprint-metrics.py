#!/usr/bin/env python3
"""
sprint_metrics.py
-----------------
Queries the GitHub API to produce per-sprint traceability data that
GitHub Insights does not expose natively:
  - Commits per member per sprint
  - Sprint commit average
  - Balance warning when any member is below threshold
  - PR authorship and review participation
  - Links every commit SHA to its author (full traceability)

Outputs
  sprint-reports/SPRINT_LABEL.md   — human-readable Markdown report
  sprint-reports/SPRINT_LABEL.json — machine-readable data for later analysis
"""

import json
import os
import sys
from datetime import datetime, timezone, timedelta
from collections import defaultdict
import requests
from dateutil import parser as dateparser

TOKEN      = os.environ["GITHUB_TOKEN"]
REPO       = os.environ["REPO"]                   # owner/repo
DAYS_BACK  = int(os.environ.get("DAYS_BACK", 14))
SPRINT_NAME = os.environ.get("SPRINT_NAME", "")  # e.g. "Sprint-05"

TEAM_MEMBERS_RAW = os.environ.get("TEAM_MEMBERS", "")
TEAM_MEMBERS = [m.strip() for m in TEAM_MEMBERS_RAW.split(",") if m.strip()]

BALANCE_THRESHOLD = float(os.environ.get("BALANCE_THRESHOLD", 0.60))

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}

def gh_get(url, params=None):
    """GET a GitHub API URL, handling pagination automatically."""
    results = []
    while url:
        r = requests.get(url, headers=HEADERS, params=params)
        if r.status_code == 422:
            return []
        r.raise_for_status()
        data = r.json()
        if isinstance(data, list):
            results.extend(data)
        else:
            return data
        # Follow Link: <url>; rel="next" pagination
        link = r.headers.get("Link", "")
        url = None
        params = None
        for part in link.split(","):
            if 'rel="next"' in part:
                url = part.split(";")[0].strip().strip("<>")
    return results


def api(path, params=None):
    return gh_get(f"https://api.github.com/{path}", params)


# ---------------------------------------------------------------------------
# Date window
# ---------------------------------------------------------------------------

now = datetime.now(timezone.utc)
since = now - timedelta(days=DAYS_BACK)
since_iso = since.strftime("%Y-%m-%dT%H:%M:%SZ")
until_iso = now.strftime("%Y-%m-%dT%H:%M:%SZ")

if not SPRINT_NAME:
    SPRINT_NAME = f"sprint-{since.strftime('%Y%m%d')}-{now.strftime('%Y%m%d')}"

SPRINT_LABEL = SPRINT_NAME.lower().replace(" ", "-")

print(f"Sprint: {SPRINT_NAME}")
print(f"Window: {since_iso} → {until_iso}")
print(f"Repo:   {REPO}")

# ---------------------------------------------------------------------------
# 1. Commits
# ---------------------------------------------------------------------------

print("\nFetching commits...")
owner, repo_name = REPO.split("/", 1)

raw_commits = api(
    f"repos/{REPO}/commits",
    params={"since": since_iso, "until": until_iso, "per_page": 100},
)

commits_by_member = defaultdict(list)   # username -> [commit_dict]
unmatched_commits = []

for c in raw_commits:
    sha     = c["sha"]
    message = c["commit"]["message"].split("\n")[0][:80]
    date    = c["commit"]["committer"]["date"]
    author  = (c.get("author") or {}).get("login", "")
    if not author:
        author = c["commit"]["author"].get("email", "unknown")

    entry = {"sha": sha[:7], "full_sha": sha, "message": message, "date": date, "author": author}

    if TEAM_MEMBERS and author in TEAM_MEMBERS:
        commits_by_member[author].append(entry)
    elif not TEAM_MEMBERS:
        # No filter — group by whoever committed
        commits_by_member[author].append(entry)
    else:
        unmatched_commits.append(entry)

# Ensure every team member appears even with 0 commits
for m in TEAM_MEMBERS:
    if m not in commits_by_member:
        commits_by_member[m] = []

# ---------------------------------------------------------------------------
# 2. Pull requests (opened + merged in window)
# ---------------------------------------------------------------------------

print("Fetching pull requests...")
prs_raw = api(f"repos/{REPO}/pulls", params={"state": "all", "per_page": 100, "sort": "updated", "direction": "desc"})

prs_in_window = []
for pr in prs_raw:
    created = dateparser.parse(pr["created_at"])
    if created >= since:
        prs_in_window.append(pr)

prs_by_author = defaultdict(list)
for pr in prs_in_window:
    login = (pr.get("user") or {}).get("login", "unknown")
    prs_by_author[login].append({
        "number": pr["number"],
        "title": pr["title"][:60],
        "state": pr["state"],
        "merged": pr.get("merged_at") is not None,
        "url": pr["html_url"],
    })

# ---------------------------------------------------------------------------
# 3. PR Reviews
# ---------------------------------------------------------------------------

print("Fetching PR reviews...")
reviews_by_reviewer = defaultdict(list)

for pr in prs_in_window:
    pr_num = pr["number"]
    reviews = api(f"repos/{REPO}/pulls/{pr_num}/reviews")
    for rv in reviews:
        reviewer = (rv.get("user") or {}).get("login", "unknown")
        state = rv.get("state", "COMMENTED")
        if state in ("APPROVED", "CHANGES_REQUESTED", "COMMENTED"):
            reviews_by_reviewer[reviewer].append({
                "pr": pr_num,
                "pr_title": pr["title"][:50],
                "state": state,
                "submitted_at": rv.get("submitted_at", ""),
            })

# ---------------------------------------------------------------------------
# 4. Compute stats
# ---------------------------------------------------------------------------

members = sorted(commits_by_member.keys())
commit_counts = {m: len(commits_by_member[m]) for m in members}
total_commits = sum(commit_counts.values())
avg_commits   = total_commits / len(members) if members else 0

balance_warnings = []
for m in members:
    count = commit_counts[m]
    if avg_commits > 0 and count < avg_commits * BALANCE_THRESHOLD:
        balance_warnings.append({
            "member": m,
            "commits": count,
            "average": round(avg_commits, 1),
            "ratio": round(count / avg_commits, 2) if avg_commits else 0,
        })

# ---------------------------------------------------------------------------
# 5. Build output structures
# ---------------------------------------------------------------------------

report_data = {
    "sprint": SPRINT_NAME,
    "generated_at": now.isoformat(),
    "window": {"since": since_iso, "until": until_iso, "days": DAYS_BACK},
    "repo": REPO,
    "summary": {
        "total_commits": total_commits,
        "average_commits_per_member": round(avg_commits, 2),
        "total_prs": len(prs_in_window),
        "members_tracked": len(members),
    },
    "members": {},
    "balance_warnings": balance_warnings,
}

for m in members:
    report_data["members"][m] = {
        "commits": commit_counts[m],
        "commit_log": commits_by_member[m],
        "prs_opened": prs_by_author.get(m, []),
        "reviews_given": reviews_by_reviewer.get(m, []),
    }

# ---------------------------------------------------------------------------
# 6. Render Markdown
# ---------------------------------------------------------------------------

def render_markdown(data):
    d = data
    lines = []
    a = lines.append

    a(f"# Sprint metrics report — {d['sprint']}")
    a(f"")
    a(f"> Generated: {d['generated_at'][:19].replace('T',' ')} UTC  ")
    a(f"> Window: `{d['window']['since'][:10]}` → `{d['window']['until'][:10]}` ({d['window']['days']} days)  ")
    a(f"> Repository: `{d['repo']}`")
    a(f"")

    # Summary table
    s = d["summary"]
    a(f"## Summary")
    a(f"")
    a(f"| Metric | Value |")
    a(f"|--------|-------|")
    a(f"| Total commits | {s['total_commits']} |")
    a(f"| Average commits / member | {s['average_commits_per_member']} |")
    a(f"| Total PRs opened | {s['total_prs']} |")
    a(f"| Members tracked | {s['members_tracked']} |")
    a(f"")

    # Per-member commit table
    a(f"## Commits per member")
    a(f"")
    a(f"| Member | Commits | PRs opened | Reviews given |")
    a(f"|--------|---------|------------|---------------|")
    for m, info in d["members"].items():
        flag = " ⚠️" if any(w["member"] == m for w in d["balance_warnings"]) else ""
        a(f"| `{m}`{flag} | {info['commits']} | {len(info['prs_opened'])} | {len(info['reviews_given'])} |")
    a(f"")

    # Balance warnings
    if d["balance_warnings"]:
        a(f"## Balance warnings")
        a(f"")
        a(f"> Members below {int(BALANCE_THRESHOLD*100)}% of sprint average")
        a(f"")
        for w in d["balance_warnings"]:
            a(f"- **`{w['member']}`** — {w['commits']} commits (average: {w['average']}, ratio: {w['ratio']})")
        a(f"")

    # Commit traceability per member
    a(f"## Commit traceability")
    a(f"")
    for m, info in d["members"].items():
        a(f"### {m}")
        a(f"")
        if not info["commit_log"]:
            a(f"_No commits in this sprint window._")
        else:
            a(f"| SHA | Date | Message |")
            a(f"|-----|------|---------|")
            for c in info["commit_log"]:
                date_short = c["date"][:10]
                sha_link = f"[`{c['sha']}`](https://github.com/{REPO}/commit/{c['full_sha']})"
                a(f"| {sha_link} | {date_short} | {c['message']} |")
        a(f"")

        if info["prs_opened"]:
            a(f"**PRs opened**")
            a(f"")
            for pr in info["prs_opened"]:
                merged_tag = " ✅ merged" if pr["merged"] else f" ({pr['state']})"
                a(f"- [#{pr['number']}]({pr['url']}) {pr['title']}{merged_tag}")
            a(f"")

        if info["reviews_given"]:
            a(f"**Reviews given**")
            a(f"")
            for rv in info["reviews_given"]:
                a(f"- PR #{rv['pr']} — {rv['pr_title']} — `{rv['state']}`")
            a(f"")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# 7. Write files
# ---------------------------------------------------------------------------

os.makedirs("sprint-reports", exist_ok=True)

md_path   = f"sprint-reports/{SPRINT_LABEL}.md"
json_path = f"sprint-reports/{SPRINT_LABEL}.json"

with open(md_path, "w", encoding="utf-8") as f:
    f.write(render_markdown(report_data))

with open(json_path, "w", encoding="utf-8") as f:
    json.dump(report_data, f, indent=2, ensure_ascii=False)

# Write SPRINT_LABEL to env file so the workflow can use it in artifact name
with open(os.environ.get("GITHUB_ENV", "/dev/null"), "a") as env_file:
    env_file.write(f"SPRINT_LABEL={SPRINT_LABEL}\n")

# ---------------------------------------------------------------------------
# 8. Print summary to Actions log
# ---------------------------------------------------------------------------

print(f"\n{'='*60}")
print(f"  {SPRINT_NAME} — {since_iso[:10]} to {until_iso[:10]}")
print(f"{'='*60}")
print(f"  Total commits : {total_commits}")
print(f"  Average       : {avg_commits:.1f}")
print(f"")
for m in members:
    flag = "  ⚠ BELOW THRESHOLD" if any(w["member"] == m for w in balance_warnings) else ""
    print(f"  {m:<20} {commit_counts[m]:>4} commits{flag}")

if balance_warnings:
    print(f"\n  Balance warnings: {len(balance_warnings)} member(s) below {int(BALANCE_THRESHOLD*100)}% of average")
    sys.exit(1)  # Fail the workflow step so it's visible in GitHub UI

print(f"\nReport written to {md_path}")
print(f"JSON written to   {json_path}")
