# Contributing

This is a GitHub profile repository — `adarsh0707-kumar/adarsh0707-kumar`. Its
only job is to render `README.md` on the profile page. There is no application
code and no test suite.

External contributions aren't really the point here. This document exists so
that future-me remembers how the card generation works before changing a cron
line and quietly breaking the profile for a week.

## How it works

Every stat card on the profile is a **static SVG committed to this repo**, not a
live image URL. `README.md` references them by relative path:

```md
![GitHub Stats](./profile/stats.svg)
```

That's deliberate. External images in a README are proxied through GitHub's
`camo` service, and camo caches them for as long as the upstream `Cache-Control`
header says. Public `github-readme-stats` instances cache the stats card for 24
hours and the top-languages card for 144 hours (6 days), and `cache_seconds` is
clamped to a 6-hour minimum, so it can't be shortened from the URL. The streak
service has a different problem: it runs on a sleeping dyno, and a cold request
takes ~16s against camo's ~5s timeout, which renders as a broken image.

Generating the SVGs in Actions and committing them sidesteps both. Relative
paths never touch camo, and the refresh rate is whatever the cron says.

## Layout

```
.github/workflows/
  generate-contributor-stats.yml   → profile/contributor-stats.svg
  generate-trophy.yml              → profile/trophy.svg
  generate-stats.yml               → profile/stats.svg, profile/top-langs.svg
  generate-streak.yml              → profile/streak.svg
profile/                           generated SVGs — never edit by hand
README.md                          the profile page
```

Anything in `profile/` is build output. Editing it directly is pointless; the
next scheduled run overwrites it.

## Schedule

All cron expressions are **UTC**. IST is UTC+5:30.

| Workflow | Cron | IST |
| --- | --- | --- |
| `generate-contributor-stats` | `10 16 * * *` | 21:40 daily |
| `generate-trophy` | `40 16 * * *` | 22:10 daily |
| `generate-stats` | `20 17 * * *` | 22:50 daily |
| `generate-streak` | `50 5,11,17 * * *` | 11:20 / 17:20 / 23:20 daily |

Three rules govern these times. Break them and things degrade quietly rather
than failing loudly.

**Never schedule at `0 0 * * *`.** Midnight UTC on the hour is the most
contended slot on GitHub's scheduler — everyone's default lands there. Runs on
that slot were being queued 1 to 8.5 hours late, drifting worse over time. Use
an off-peak hour and an odd minute.

**Run late in the IST day, not early.** 00:00 UTC is 05:30 IST, which snapshots
contributions before the local day has started, so the streak card permanently
trailed by one day. The last run of the day should land near 23:00 IST so it
captures everything committed that day.

**Stagger by at least 30 minutes.** Every one of these jobs commits and pushes
to `main`. Two landing in the same minute means the second gets rejected
non-fast-forward and that card silently stays stale.

## Secrets

| Secret | Used by | Needs |
| --- | --- | --- |
| `PROFILE_TOKEN` | contributor-stats, trophy, stats | PAT — see below |
| `GITHUB_TOKEN` | commit steps, checkout | built-in, no setup |

`PROFILE_TOKEN` is a personal access token and is the single point of failure
for three of the four cards. If it expires, they all go stale together. Scope
requirements differ by consumer:

- `read:user` — the trophy action needs it to resolve
  `user().contributionsCollection` over GraphQL. The default `GITHUB_TOKEN` is a
  repo-scoped installation token and cannot do this.
- `public_repo` — enough for cross-repo contribution reads in
  `lowlighter/metrics`.
- `repo` — required for `count_private=true` on the stats card. Without it the
  parameter is decorative: the card silently reports public repos only.

Writes always use the built-in `GITHUB_TOKEN` via `committer_token` or the
commit step, so the PAT is never used to push.

## Adding a card

1. Create `.github/workflows/generate-<name>.yml`.
2. Copy the shape of an existing workflow: `workflow_dispatch`, a `push` trigger
   with `paths` pointing at the workflow file itself, a `schedule`, and
   `permissions: contents: write`.
3. Pick a cron slot at least 30 minutes clear of every job in the table above,
   and update that table.
4. Write output to `profile/<name>.svg`.
5. End with the standard commit guard so an unchanged card is a no-op:

   ```yaml
   git add profile/<name>.svg
   if git diff --cached --quiet; then
     echo "No changes to profile/<name>.svg"
   else
     git commit -m "chore: update <name>"
     git push
   fi
   ```

6. Set `fail_on_error: true` where the action supports it. Otherwise a rate
   limit produces a "Something went wrong" error card and the commit step
   cheerfully pushes it to the profile. A red run is better than a broken
   profile.
7. Add the `![...](./profile/<name>.svg)` line to `README.md` **in the same
   commit as the workflow**, or the README points at a file that doesn't exist
   yet and renders as a broken image.

## Testing a change

The `paths` self-trigger means pushing a workflow file runs it immediately — no
waiting for the cron. For an on-demand run without pushing anything, use
**Actions → the workflow → Run workflow**; all four have `workflow_dispatch`
enabled.

Note that push-triggered runs of `generate-streak` are near-useless for
verifying data. The job starts seconds after the push, and GitHub's
contributions calendar lags a few minutes behind, so it fetches a card identical
to the one already committed and no-ops. Use it to validate YAML; trust the
scheduled run for data.

## Commits

Conventional commit prefixes, `main` only, direct pushes.

```
feat:   new card or workflow
fix:    schedule corrections, broken references
chore:  generated card updates (bot-authored)
docs:   README or this file
```

Bot commits are authored as `github-actions[bot]` and don't count toward the
contribution graph, so they can't inflate the streak card they generate.

Always `git pull --rebase` before pushing. There are four jobs committing to
`main` on their own schedule and you will be behind more often than not.

## Troubleshooting

**Broken image icon with alt text showing.** `README.md` references an SVG that
doesn't exist in `profile/`. Usually the README half of a change was pushed and
the workflow half wasn't. Check that the matching workflow is on `main`.

**Card renders but the numbers are stale.** Check Actions for the last run of
that workflow. Green with no commit means the SVG was byte-identical and the
guard skipped it — normal. No run at all means the cron didn't fire.

**Scheduled runs stopped entirely.** GitHub disables scheduled workflows after
60 days of repository inactivity. There's a banner with an "Enable workflow"
button in the Actions tab; it has to be clicked manually, as pushing a commit
doesn't re-enable it.

**Run is red on a token error.** `PROFILE_TOKEN` has expired or lacks the scope
that job needs. See the Secrets table.

**A card is stale while others update.** Likely a non-fast-forward rejection
from two jobs pushing at once. Check the crons are still staggered.

**Streak numbers look wrong rather than stale.** Verify `git config user.email`
resolves to an address listed under Settings → Emails. Commits with an
unrecognised email don't count as contributions at all. Also confirm Settings →
Profile → "Include private contributions on my profile" is enabled.
