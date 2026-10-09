# BOI Mortgage Rates for Baz

Snapshot retrieved from Bank of Ireland's public mortgage-rates page on **2026-10-09**.

The page itself currently labels the rate table **Last update: 26/11/2025 08:17:48**.

## Files
- `boi-mortgage-rates.json` — machine-readable runtime catalogue
- `boi-mortgage-rates.csv` — flat review/export matrix

## Headline owner-occupier rates currently published
For BER A:
- **4-year HVM:** 3.10% fixed, APRC 3.8%
- **1-year HVM:** 3.30% fixed, APRC 4.2%
- **5-year HVM:** 3.40% fixed, APRC 3.9%
- **7-year HVM:** 3.45% fixed, APRC 3.8%
- **2-year standard fixed:** 3.80%, APRC 4.2%
- **3-year standard fixed:** 3.90%, APRC 4.2%
- **5-year standard fixed:** 3.90%, APRC 4.1%
- **10-year standard fixed:** 4.20%, APRC 4.3%
- **Standard variable:** 4.15%, APRC 4.3%

HVM requires €250,000+ and carries **no cashback**. Qualifying standard fixed rates for FTBs/movers/switchers may receive Cashback Plus (2% after drawdown + 1% after five years, subject to conditions).

## Important BER note
BOI says the BER scale changed on 24 May 2026 and now includes **A0**. The public rates table still lists **A through G**. This pack intentionally does **not** invent an A0 mapping.

## Recommended Baz flow
```text
Customer asks about rates
        ↓
Mortgage type?
        ↓
BER?
        ↓
Mortgage amount?
        ↓
HVM eligibility?
        ↓
Return relevant rate choices
        ↓
Explain rate vs APRC vs cashback
        ↓
Calculate illustrative repayment if requested
```

## Production recommendation
Do not hard-code this JSON forever. Query an authoritative BOI mortgage-rate endpoint or controlled product service at answer time, cache briefly, and store `sourceUpdatedAt` alongside every answer.
