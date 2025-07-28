Save Now Earn Later (SNEL) – Product Requirements Document
1. Purpose & Problem Statement
Consumers underestimate the long‑term opportunity cost of small, habitual purchases. SNEL quantifies how redirecting that spend into an S&P 500 index fund could grow over 10/20/30 years, giving users a data‑driven incentive to reduce discretionary spending and invest consistently.
2. Objectives
Primary: Show projected portfolio values for redirected spend in <5 s.
Secondary: Capture user intent to invest (email sign‑up, brokerage referral link).
Tertiary: Gather anonymized purchase data for future insights.
3. Success Metrics
| Metric | Target | | Daily active users (DAU) | ≥ 1 000 within 90 days | | Conversion to email list | ≥ 25 % of sessions | | Avg. time to first projection | ≤ 5 s P95 | | Projection accuracy vs. Monte Carlo baseline | ± 1 % |
4. Stakeholders
Product: You (Owner)
Engineering: 1 FE, 1 BE
Design: Contract UI/UX
Legal/Compliance: External review for disclaimers
5. Target Users & Personas
Budget‑Minded Young Professional (23‑35): Seeks to cut coffee/ride‑share spend.
Parent Planning for College (30‑45): Wants long‑term growth for kids’ fund.
F.I.R.E Enthusiast (25‑40): Already invests; uses tool to validate frugality.
6. Key User Stories
US‑01: As a user, I can search or pick an item and input purchase frequency so that I get a 10/20/30‑year growth projection.
US‑02: As a user, I can override item price and currency so the projection matches my spend.
US‑03: As a user, I can save scenarios to my profile and compare multiple items.
US‑04: As an unauthenticated user, I can run one projection without sign‑up.
US‑05: As a returning user, I can see aggregate savings if I followed prior recommendations.
7. Functional Requirements
Item Catalog
Autocomplete search; seeded with ~200 common discretionary items (coffee, streaming sub, rideshare).
Frequency & Price Input
Supported periods: daily, weekly, monthly, custom days.
Projection Engine
Formula: FV = P × (365/freq) × [((1+r)^n – 1)/r] where *r* = 0.10 nominal annual return (configurable) and *n* ∈ {10, 20, 30}.
Implemented as a Postgres SQL function calc_growth(price NUMERIC, freq_days INT, years INT).
Results Visualization
Bar or line chart (Recharts) of FV at milestones.
Text summary with total principal vs. earnings.
Accounts & Persistence
Supabase Auth (email + magic link, optional Google OAuth).
Tables: users, items, scenarios, scenario_items.
Sharing & Referral
Shareable link (hashed scenario id) with embedded results.
Optional referral CTA to partner brokerage (Phase 2).
Compliance
Display “Not financial advice” banner on every results page.
8. Non‑Functional Requirements
Performance: P95 TTFB < 200 ms, total projection < 5 s.
Scalability: Handle 10 k concurrent reads; Supabase edge functions for heavy compute if necessary.
Security: Row‑level security (RLS) on all user‑owned tables; zero PII in logs.
Accessibility: WCAG 2.1 AA.
SEO: Pre‑render public share pages; semantic HTML.
9. Technical Architecture
Frontend: Next.js 14 (App Router, React Server Components, TypeScript, Tailwind, shadcn/ui).
Backend: Supabase Postgres, Supabase Edge Functions (TypeScript, Deno) for projection calculations if FE caching insufficient.
API Layer: tRPC for typed end‑to‑end contracts between Next.js and Supabase.
Data Fetching: React Query (server actions) + SWR for revalidation.
Analytics: Supabase Analytics + PostHog (self‑hosted) for event tracking.
10. Data Model (simplified)
users(id PK, email, created_at)
items(id PK, name, default_price NUMERIC, category)
scenarios(id PK, user_id FK, title, created_at)
scenario_items(id PK, scenario_id FK, item_id FK, price NUMERIC, freq_days INT)
11. API Endpoints / RPCs
| Path / RPC | Method | Auth | Description | | /api/items?q= | GET | Public | Search catalog | | rpc/calc_growth | POST | Public | Returns FV array for {10,20,30} | | /api/scenario | POST | Auth | Save scenario | | /api/scenario/:id | GET | Public (hashed) | Retrieve shared scenario |
12. Security & Compliance
Enforce HTTPS everywhere (Vercel automatic TLS).
Supabase RLS: user isolation on scenarios.
CSP headers; no inline scripts.
Routine dependency scanning (Dependabot).
Legal: FINRA review if adding referral.
13. Analytics & Success Tracking
Page views, projection runs, scenario saves.
Funnel: projection ➜ email sign‑up ➜ referral click.
Cohort retention over 30‑day window.
14. Assumptions
Historical S&P 500 CAGR ≈ 10 % nominal; model ignores taxes and inflation (clearly disclosed).
Users accept approximation; Monte‑Carlo optional later.
15. Out‑of‑Scope / Future Enhancements
Multi‑asset projections (crypto, bonds).
Personalized risk‑adjusted returns.
Auto‑invest execution via brokerage API.
Mobile app (React Native) post‑MVP.
16. Timeline & Milestones
| Phase | Duration | Deliverables | | Sprint 0 | 1 w | Finalize PRD, wireframes | | Sprint 1‑2 | 2 w | Item catalog, projection engine, basic UI | | Sprint 3 | 1 w | Auth, scenario persistence | | Sprint 4 | 1 w | Sharing, analytics, polish | | Release Candidate | – | MVP live on Vercel + Supabase |
17. Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation | | Large deviation in future returns | Med | Med | Sensitivity analysis tooltip | | Supabase quota limits | Low | Med | Use paid tier, cache projections | | Regulatory scrutiny | Low | High | Prominent disclaimers, external legal review |
18. Open Questions
Should we localize currency & returns per region?
Do we need Monte Carlo simulation at MVP?
Which brokerage partner offers best referral terms?
Building a dependable U S‑centric “item catalog” comes down to two things: (1) what you store, and (2) whereyou source or refresh price data. Below is a pragmatic approach that keeps infrastructure light while giving credible U S retail pricing.

1. Data model in Supabase
Field
Type
Notes
id
UUID (PK)


name
text
e.g., “Latte (12 oz)”
category
enum
coffee, food, subscription, household, etc.
default_price_usd
numeric(6,2)
Today’s average retail price
price_source
text
“BLS‑AP”, “USDA‑ERS”, “Manual”, …
refresh_freq_days
smallint
30 for most items; 365 for durable goods
updated_at
timestamptz
auto‑set by trigger

A separate price_history table (item_id, price, source, collected_at) allows inflation‑adjusted trend charts later but isn’t required for v1.

2. Seeding the list (one‑time script)
Start opinionated – populate ~25 high‑leverage discretionary items most users recognize:
Daily: latte, energy drink, bottled water, breakfast sandwich, candy bar.
Weekly: fast‑food combo, movie ticket, six‑pack beer, take‑out pizza.
Monthly: streaming subscription, gym membership, cosmetics box, cloud storage, etc.
Fetch current U S averages programmatically
BLS Average Price (AP) series – public JSON via FRED; covers coffee, beer, gasoline, eggs, dozens more.
USDA ERS retail price reports – CSV for meats, produce.
FCC / private reports for telecom and streaming can be scraped once, then manually maintained.
Normalize to ounce / unit where needed so comparisons feel fair.
Run a one‑off Node script (using node-fetch + @supabase/supabase-js) to insert rows. Log the exact source URL and date for auditability.

3. Keeping prices fresh
Source
Method
Cron schedule
BLS AP series
Call FRED endpoint, upsert default_price_usd
Monthly (BLS posts mid‑month)
USDA ERS
Download CSV, parse with papaparse
Quarterly
Manually‑curated (e.g., Netflix, Spotify)
Ping public pricing pages via simple scraper or track RSS from press releases
Weekly
Hard‑to‑scrape items
Accept manual override in Supabase dashboard
Ad‑hoc

Automate with a lightweight serverless function (e.g., Vercel Cron or Supabase Edge Function) that hits each source, verifies sane deltas (±15 % guardrail), then updates default_price_usd.

4. Handling custom inputs & edge cases
Custom item flow – if user does not find their item, let them enter a name and price; store in a separate user_items table keyed by auth UID.
Regional variance – explicitly message that prices are U S averages; power users can override price locally.
Inflation visibility – optional: show last 12‑month percent change next to each default price (requires price_history table).

5. Implementation pointers
Framework / packages
GraphQL or REST via Supabase auto‑generated API for item lookup.
Use SWR/React Query on the Next.js front end for real‑time price fetch & cache.
Consider zod on both client and Edge Function for consistent schema validation.
Failure hygiene
Edge Function returns 422 if source JSON/CSV is malformed.
Alerting via Supabase Logs + Vercel Slack integration when >10 % of item prices change in one pull.

6. Minimum viable backlog
Script to seed core 25 items from BLS / USDA.
Edge Function to refresh BLS AP prices monthly.
UI component: searchable dropdown backed by items table; “Add custom item” path.
Price‑override form with optimistic UI and Supabase row‑level security (owner‑only).
Unit tests asserting default_price_usd always > 0 and < $1000.
Ship this and you’ll have a credible, U S‑focused catalog that stays current with little maintenance.

