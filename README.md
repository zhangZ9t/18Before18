# 18 Before 18

18 Before 18 is a family financial-learning platform for practising judgement before financial independence. A teen gets a realistic view of their money, commitments, savings, and safe-to-spend amount; a parent assigns responsibility and sees learning signals without receiving a surveillance feed.

This repository contains the hackathon MVP described by the [product steering document](docs/sources/18-before-18-product-concept-v0.1.md). It uses simulated money and mock bank transactions only. It does not hold funds, issue credit, or provide financial advice.

## Screenshots

> Add final landing, Parent Dashboard, and Teen Dashboard screenshots here after deployment.

## What the MVP includes

- Landing page with product explanation, graduated-independence model, safety positioning, and demo entry points.
- Parent and teen registration, invite-code joining, login/logout, protected role routing, and HTTP-only cookie sessions.
- Parent Dashboard for household settings, responsibilities, privacy controls, Family Advance decisions, learning signals, prompts, and weekly reporting.
- Teen Dashboard for real balance, committed bills, savings commitment, safe-to-spend, savings goal progress, What-If simulations, Family Advances, practice scenarios, transaction history, and weekly reporting.
- A behaviour-based Financial Habits Score with a visible, understandable breakdown.
- A role-aware AI coach with ordered OpenAI, Gemini, and deterministic fallback providers.
- Seeded Taylor family data supporting the complete demo journey.

## Architecture

```text
React/Vite client
  └── /api requests with credentialed cookies
        └── Express API
              ├── authentication and role/household authorization
              ├── request validation and privacy serializers
              ├── financial, simulation, report, and AI services
              ├── mock BankProvider adapter
              └── Mongoose models → MongoDB
```

The server owns all balances, safe-to-spend calculations, authorization decisions, and privacy filtering. React receives already-permitted view models; presentation components do not calculate authoritative financial values.

### Technology stack

- React 19, React Router, Vite 8
- Node.js 20+, Express 5
- MongoDB and Mongoose
- JWT authentication in HTTP-only cookies; bcrypt password hashing
- Zod validation, Helmet, CORS allowlisting, and rate limiting
- OpenAI and Google GenAI JavaScript SDKs with an offline fallback
- Vitest, Supertest, and MongoDB Memory Server

## Local setup

Prerequisites: Node.js 20 or later, npm, and MongoDB running locally (or a MongoDB Atlas connection string).

```bash
git clone <your-repository-url>
cd 18Before18
npm install
npm run install:all
cp server/.env.example server/.env
```

Edit `server/.env`, start MongoDB, then seed and run the application:

```bash
npm run seed
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The Vite development server proxies `/api` to Express at `http://127.0.0.1:5050`.

If the repository is already cloned and dependencies are present, only `npm run seed` and `npm run dev` are needed.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | No | Express port; defaults to `5050` to avoid macOS services that commonly occupy port 5000. |
| `MONGODB_URI` | No | MongoDB connection; defaults to `mongodb://127.0.0.1:27017/18-before-18`. |
| `JWT_SECRET` | Yes outside local defaults | Secret of at least 24 characters. Use a long random value in deployed environments. |
| `CLIENT_URL` | No | Exact allowed browser origin; defaults to `http://localhost:5173`. |
| `OPENAI_API_KEY` | No | Enables the first-priority OpenAI provider. |
| `OPENAI_MODEL` | No | OpenAI model name; defaults to `gpt-5.6`. |
| `GEMINI_API_KEY` | No | Enables Gemini when OpenAI is not configured or its request fails. |
| `GEMINI_MODEL` | No | Gemini model name; defaults to `gemini-3.6-flash`. |
| `NODE_ENV` | No | `development`, `test`, or `production`. Production enables secure cookies and hides stack traces. |
| `ALLOW_SEED` | No | Must be `true` to seed a database whose name does not contain `18-before-18`. |

Never commit `server/.env`. The checked-in `server/.env.example` contains placeholders only.

## MongoDB and demo data

The default URI targets a local `18-before-18` database. For Atlas, set `MONGODB_URI` to the database-specific connection string. The seed command clears the configured demo collections before inserting fresh data, so do not point it at valuable data.

```bash
npm run seed
```

The seed includes the Taylor family, responsibilities, a savings goal, realistic transactions, a Family Advance, practice scenarios, a weekly report, and a parent conversation prompt.

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Parent | `parent@example.com` | `DemoParent123!` |
| Teen | `teen@example.com` | `DemoTeen123!` |

These credentials exist only for demo mode and must not be reused in production.

## Commands

Run these from the repository root:

| Command | Purpose |
| --- | --- |
| `npm run install:all` | Install client and server dependencies. |
| `npm run dev` | Run the Vite client and Express API together. |
| `npm run client` | Run only the client. |
| `npm run server` | Run only the API with Nodemon. |
| `npm run seed` | Replace demo collections with the Taylor family seed. |
| `npm test` | Run backend unit and integration tests against an in-memory MongoDB. |
| `npm run lint` | Lint both applications. |
| `npm run build` | Create the production client build in `client/dist`. |

## Testing

```bash
npm test
npm run lint
npm run build
```

The automated suite covers core financial calculations, negative safe-to-spend, habits scoring, purchase and Family Advance simulations, privacy serializers, authentication, invite joining, role boundaries, parent-safe transaction data, and the main parent/teen API journey.

## Project structure

```text
client/src/
  api/             browser API client
  components/      shared dashboard, card, report, simulator, and coach UI
  context/         authentication provider
  pages/           landing, auth, Parent Dashboard, and Teen Dashboard

server/src/
  controllers/     HTTP request handlers
  middleware/      authentication, authorization, validation, limits, errors
  models/          Mongoose persistence models
  routes/          REST API definitions
  serializers/     role-specific privacy boundaries
  services/        financial, simulation, report, bank, and AI domain logic
  seeds/           deterministic demo dataset
  validation/      Zod request schemas

server/tests/       unit and API integration tests
docs/sources/       product steering document
```

## API overview

All routes except health, registration, login, and logout require an authenticated cookie. Role and household permissions are resolved from server-side user state, never from client-supplied ownership fields.

| Area | Main routes |
| --- | --- |
| Health | `GET /api/health` |
| Auth | `POST /api/auth/register/parent`, `POST /api/auth/register/teen`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` |
| Household | `GET/PATCH /api/household`, visibility updates, independence requests and decisions |
| Dashboards | `GET /api/parent/overview`, `GET /api/teen/overview` |
| Money | transactions, responsibilities, and savings goals under `/api/transactions`, `/api/responsibilities`, and `/api/goals` |
| Learning | `POST /api/simulations/purchase`, `/api/advances`, `/api/practice`, and `/api/reports` |
| Conversation | parent prompts under `/api/prompts`; role-aware coach under `/api/ai/chat` and `/api/ai/insight` |

Successful responses use `{ "success": true, "data": ... }`. Errors use `{ "success": false, "error": { "code", "message", "details" } }`.

## Privacy philosophy

The parent interface is intentionally a learning view, not a transaction-monitoring view. Parent serializers expose category-level amounts and patterns, but omit a teen's exact merchant and item descriptions. The teen sees only household categories explicitly shared by the parent; salary, mortgage, household balances, and hidden categories are not returned.

This separation is enforced in server serializers and services and covered by automated tests. Hiding fields in React is not treated as a privacy boundary.

## Security notes

- Passwords are bcrypt-hashed and JWTs are stored in HTTP-only cookies.
- Cookies use `SameSite=Lax` and become `Secure` in production.
- CORS accepts the configured client origin and credentials only.
- Helmet, payload limits, auth/AI rate limits, Zod schemas, Mongo identifier validation, role checks, household checks, and centralized errors are enabled.
- AI context is assembled from the same role-filtered overview services used by the dashboards. Live Responses calls disable storage and use a one-way hashed safety identifier.
- AI providers share the same educational guardrails and permitted context. Provider priority is OpenAI, then Gemini, then deterministic fallback; provider errors do not break the coach endpoint.

## Known limitations

- This is a learning prototype with mock transactions, not a bank, wallet, payment product, lending product, or financial adviser.
- Family Advance is a parent-approved simulation. It does not transfer money or create real credit.
- There is no email verification, password reset, multi-factor authentication, session revocation store, or production audit log yet.
- The weekly report is currently generated from seeded or API-created data; a scheduled weekly aggregation worker is not included.
- The mock bank balance is derived from local transactions. Reconciliation, pending-card states, consent renewal, and bank outage handling are future work.
- AI fallback answers are intentionally narrow. Before serving minors in production, the product needs formal age assurance/parental-consent flows where applicable, stronger content evaluation and monitoring, appropriate organizational data-retention controls, and legal/privacy review for each launch market.
- Deployment, CI/CD, observability, accessibility auditing with assistive technology, and cross-browser device testing remain outside this hackathon build.

## Future open-banking integration

`BankProvider` defines the account, balance, and transaction boundary; `MockBankProvider` is the only current implementation. A later regulated provider adapter can be added behind this interface without changing dashboard components. Production integration must add explicit consent, least-privilege scopes, encrypted token storage, webhook verification, transaction reconciliation, consent expiry/revocation, provider outage states, and jurisdiction-specific compliance. No real banking connector should be enabled until those controls are designed and reviewed.
