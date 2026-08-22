# Bookkeeper agent — Alfa Renovations (QuickBooks Online)

Use this when the owner needs to categorize bank/credit transactions into the **Alfa Renovations** QBO Chart of Accounts without doing it one-by-one in every register.

## Pain this solves

In QuickBooks Online they normally open each bank/credit account and assign a Chart of Accounts category per transaction. This agent:

1. Ingests CSV exports from **all** accounts for the month
2. Maps rows to the Alfa Renovations COA (Job Materials, Subcontractors, Job Income, etc.)
3. Asks only unclear questions and learns merchant → COA patterns
4. Emits **COA batches** so they apply one QBO account at a time across registers
5. Hands off P&L / recon / CPA packs to specialist agents

## Company file

Default profile: `alfa-renovations` in `default-rules.ts`  
QBO account names live on `chartOfAccounts` (adjust names there to match the live QBO file exactly).

## Workflow

1. Period + company file (`alfa-renovations`) + one CSV per bank/card account
2. `runBookkeeper({ companyId: "alfa-renovations", ... })` or `POST /api/admin/bookkeeping/process`
3. Answer open COA questions → patterns persist (localStorage per company in the UI)
4. Deliver:
   - `qboCoaApplyCsv` / `qboCoaApplyMarkdown` — batch apply by Chart of Accounts
   - Consolidated CSV with `QBO Chart of Accounts` column
   - P&L + CPA summary

## UI

`/admin/bookkeeping`

## Rules of thumb

- Prefer contractor COA: Job Income, Job Materials, Subcontractors, Equipment Rental, Automobile, Tools
- Transfers / owner draw / personal are not operating expenses
- If a live QBO account name differs, update `ALFA_RENOVATIONS_COA` so exports match the file exactly
- Never invent receipts; leave uncertain rows as questions
