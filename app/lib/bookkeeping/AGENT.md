# Bookkeeper agent — automate Alfa Renovations classification in QBO

## What you actually want

Those blue **pending** counts (Forum, Amex, Rental House, Banco Nacional) are bank-feed rows already in QuickBooks. You want **QuickBooks to classify them**, not a spreadsheet telling you what to click.

## Hard Intuit limit

QuickBooks Online’s public API **cannot** read or categorize Banking → For review / pending. Apps cannot push categories onto those 493 rows via API.

## Supported automation path

**QBO Bank Rules** — created once inside QuickBooks. Matching pending + future bank-feed transactions are categorized by QBO itself (optionally Auto-add).

This agent’s job:
1. Learn merchant → Chart of Accounts patterns from your exports / answers
2. Emit **Bank Rule suggestions** (`qboBankRulesCsv` / setup markdown)
3. You install rules in QBO once with **Also apply to transactions waiting for review**
4. Pending clears for matches; new feeds auto-classify

## Workflow

1. Export CSVs from each linked account (optional after rules exist — useful to discover new merchants)
2. `/admin/bookkeeping` → run bookkeeper → **Download Bank Rules**
3. QBO (web) → Bookkeeping → **Rules** → create rules → apply to waiting review
4. Re-run monthly only to catch new merchants → add a few new rules

## Separate entities

- Alfa Renovations (Forum) + Amex → contractor rules  
- Alfa Rental House Checking → different COA / separate rule set (don’t mix)

## UI

`/admin/bookkeeping`
