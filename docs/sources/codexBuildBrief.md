
# Codex Master Build Brief — 18 Before 18

You are the lead full-stack engineer for this project.

Build the complete MVP of **18 Before 18**, a MERN-stack family financial learning application.

Before changing code, read:

`docs/sources/18-before-18-product-concept-v0.1.md`

Treat that file as the **product steering document and source of truth**.

Do not silently invent major features that conflict with it.

The goal is to produce a working hackathon-quality application that is clean enough to continue developing after the hackathon.

---

# 1. Product Goal

18 Before 18 is a gamified family financial learning platform.

It helps teenagers develop financial judgement by combining:

**Realistic money → decisions → consequences → reflection → parent-child conversation → better habits**

The product is NOT primarily:

* a parental surveillance app
* an expense tracker
* a financial adviser
* a bank
* a real BNPL provider

The product should help teenagers understand:

* safe-to-spend money
* needs vs wants
* saving
* financial commitments
* opportunity cost
* future consequences
* household financial trade-offs
* responsible independence

The core philosophy is:

**Conversation over control.**

---

# 2. MVP Scope

Build three primary application surfaces:

```text
/
Landing Page

/parent
Parent Dashboard

/teen
Teen Dashboard
```

Authentication pages may use additional routes such as:

```text
/login
/signup
/join
```

but the three primary product interfaces remain:

1. Landing
2. Parent
3. Teen

---

# 3. Technical Stack

Use a MERN architecture.

## Frontend

Use:

* React
* Vite
* React Router
* standard modern CSS or Tailwind CSS
* reusable functional components
* responsive desktop-first design
* fetch or Axios for API calls

Choose one state-management approach and keep it simple.

Preferred:

* React Context for authentication
* local component state for most UI
* avoid Redux unless genuinely necessary

## Backend

Use:

* Node.js
* Express
* MongoDB
* Mongoose

Use a REST API.

## Authentication

Use:

* JWT-based authentication
* password hashing with bcrypt
* HTTP-only cookies for auth tokens
* role-based authorization

Do NOT store authentication tokens in localStorage.

Roles:

```text
parent
teen
```

## Validation / Security

Use:

* Zod, Joi, or express-validator
* Helmet
* CORS configured explicitly
* rate limiting on authentication and AI endpoints
* bcrypt
* secure environment variables
* central error handling

---

# 4. Repository Structure

Create or normalize the project toward:

```text
18-before-18/
│
├── client/
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── ai/
│   │   │   ├── bank/
│   │   │   └── simulation/
│   │   ├── utils/
│   │   ├── seeds/
│   │   └── server.js
│   │
│   └── package.json
│
├── docs/
│   └── sources/
│       └── 18-before-18-product-concept-v0.1.md
│
├── .gitignore
├── README.md
└── package.json
```

The root package.json should provide convenient commands for running client and server together.

For example:

```text
npm run dev
npm run client
npm run server
npm run seed
npm run test
```

Use `concurrently` if useful.

---

# 5. Environment Variables

Create:

```text
server/.env.example
```

with placeholders such as:

```env
PORT=5000
MONGODB_URI=
JWT_SECRET=
CLIENT_URL=http://localhost:5173
OPENAI_API_KEY=
OPENAI_MODEL=
NODE_ENV=development
```

Never commit `.env`.

Do not place API keys or secrets in frontend code.

---

# 6. Authentication Flow

Implement complete working authentication.

## Parent Registration

A parent can create an account with:

```text
name
email
password
```

After registration:

1. Create parent User
2. Create Household
3. Make parent household owner
4. Generate household invite code
5. Log parent in

Example:

```text
FAMILY-7K4P
```

Invite codes must not expose database IDs.

---

# 7. Teen Registration / Household Joining

A teen should NOT create a standalone household.

Teen registration requires:

```text
name
email
password
householdInviteCode
```

Server verifies the invite.

Then:

```text
Teen User
      ↓
joins
      ↓
Existing Household
```

Teen receives `role = teen`.

---

# 8. Login

Login using:

```text
email
password
```

After authentication return user identity and role.

The frontend then redirects:

```text
parent → /parent
teen   → /teen
```

---

# 9. Authorization

Create middleware:

```text
requireAuth
requireRole("parent")
requireRole("teen")
requireHouseholdAccess
```

A teen must NEVER be able to:

* edit household privacy settings
* change independence level
* see hidden parent financial data
* access another household

A parent must NEVER automatically see private merchant-level teen data when product rules only allow category-level information.

Enforce privacy at the API layer, not just the frontend.

---

# 10. Core Database Models

Keep models practical and not excessively abstract.

## User

Suggested fields:

```text
_id
name
email
passwordHash
role
householdId
createdAt
updatedAt
```

Role:

```text
parent | teen
```

---

# 11. Household

Suggested fields:

```text
_id
name
ownerId
inviteCode

weeklyDeposit
depositFrequency

independenceLevel

householdCategories

visibleCategoriesToTeen

savingsTarget

createdAt
updatedAt
```

Example category:

```json
{
  "name": "Food",
  "weeklyBudget": 180,
  "visibleToTeen": true
}
```

Sensitive household details should NOT need to include real salary or mortgage data for the MVP.

---

# 12. Transaction

Build transactions so the MVP can later support real bank integration.

Suggested fields:

```text
_id
householdId
userId
amount
type
category
merchant
description
date
source
createdAt
```

Type:

```text
income
expense
commitment
saving
```

Source:

```text
mock
manual
future_bank
```

Important privacy rule:

Teen endpoints may return merchant information to the teen.

Parent endpoints should normally aggregate the teen's spending into categories.

For example:

Parent receives:

```text
Entertainment: $62
Food: $35
Transport: $18
```

NOT:

```text
McDonald's $18.50
Steam $42
Uber $17
```

Create separate serializers / DTOs rather than relying on the frontend to hide fields.

---

# 13. Responsibility / Bill Model

Suggested fields:

```text
_id
householdId
teenId
name
category
amount
frequency
dueDate
status
assignedAtIndependenceLevel
```

Status:

```text
upcoming
paid
overdue
```

Examples:

```text
Phone plan
Transport
Lunch
Subscription
Groceries
Savings contribution
```

---

# 14. Savings Goal

Suggested fields:

```text
_id
teenId
name
targetAmount
currentAmount
weeklyContribution
targetDate
createdAt
completedAt
```

Example:

```text
Headphones
Target: $300
Saved: $180
```

---

# 15. Family Advance

Create a model for the educational BNPL-style system.

Do NOT call this actual BNPL in financial infrastructure.

Use:

**Family Advance**

Suggested fields:

```text
_id
teenId
parentId

itemName
originalAmount
amountAdvanced

installmentAmount
installmentCount
installmentsRemaining

status

createdAt
```

Status:

```text
requested
approved
declined
active
completed
```

Example:

```text
Teen wants $80 now.

Parent approves.

Future allowance:

Week 1: -$20
Week 2: -$20
Week 3: -$20
Week 4: -$20
```

This teaches:

**Future money can already be committed.**

---

# 16. Practice Scenario

Suggested model:

```text
_id
title
type
description
minimumIndependenceLevel
difficulty
payload
```

Scenario types:

```text
bnpl
flash_sale
subscription
free_trial
fomo
unexpected_expense
impulse_purchase
```

These use simulated risk.

Do not create real credit.

---

# 17. Weekly Report

Suggested fields:

```text
_id
householdId
userId
weekStart
weekEnd

income
spendingByCategory
billsPaid
billsMissed
savingsAdded
safeToSpendAverage
goalProgress

habitScore

aiSummary
conversationPrompt
```

Reports should be readable and educational, not accounting spreadsheets.

---

# 18. Parent Dashboard

The Parent Dashboard should answer:

> "How is my child learning to manage money, and is there one useful thing we should discuss?"

Do NOT make it feel like surveillance.

---

# 19. Parent — Weekly Overview

Show:

```text
Weekly deposit
Teen safe-to-spend
Bills paid / due
Savings goal progress
Current independence level
Family habit score
```

Use clear cards.

Keep important information visible above the fold.

---

# 20. Parent — Privacy-Aware Spending

Show categories.

Example:

```text
Food          $38
Entertainment $62
Transport     $21
Subscriptions $12
```

Do not display merchant names by default.

Allow teen privacy while still providing useful learning context.

---

# 21. Parent — AI Conversation Prompt

Show ONE primary prompt.

Example:

```text
Worth discussing

Alex used 65% of their flexible budget
during the first two days of this week.

Try asking:

"If an unexpected expense came up tomorrow,
what would you change?"
```

Do not create a continuous alert feed.

Provide:

```text
Mark as discussed
Dismiss
View previous prompts
```

---

# 22. Parent — Graduated Independence

This is a major product feature.

Build levels approximately like:

```text
LEVEL 1 — Starter
Pocket money
Savings
Entertainment

LEVEL 2 — Explorer
Phone
Transport
Lunch

LEVEL 3 — Independent
Subscriptions
Groceries
Larger weekly budget

LEVEL 4 — Ready
More responsibilities
Minimal parental intervention
```

Parent can change the level.

Teen can submit:

```text
Request more responsibility
```

Parent approves or declines.

Changing the level should update available responsibilities and Practice Zone scenarios.

Make this visually engaging.

---

# 23. Parent — Household Financial Visibility

Parent chooses categories that the teen can see.

Example toggles:

```text
Housing       ON
Food          ON
Transport     ON
Utilities     ON
Subscriptions OFF
Savings       ON
```

Teen sees household proportions or simplified amounts.

Do not require parents to expose:

```text
salary
exact mortgage
bank balances
sensitive transactions
```

Purpose:

teach:

> "Where does family money go?"

without exposing the family's complete financial life.

---

# 24. Teen Dashboard

The Teen Dashboard should answer:

> "What money can I actually use, what responsibilities do I have, and what happens if I make this decision?"

The UI should feel empowering and game-like, not childish.

---

# 25. Teen — My Money Now

This is one of the most important components.

Create:

```text
Balance
Upcoming commitments
Savings commitment
Safe to spend
```

Formula:

```text
safeToSpend =
currentBalance
- upcomingRequiredBills
- activeAdvancePayments
- protectedSavingsCommitment
```

Example:

```text
Balance                  $180
Bills                     -55
Savings                   -30
Family Advance            -20
                         -----
Safe to spend             $75
```

Explain:

> Money in your account is not necessarily money available to spend.

---

# 26. Teen — Responsibilities

Show assigned obligations.

Each displays:

```text
name
amount
due date
status
```

Example:

```text
Phone plan
$15
Due Friday
UPCOMING
```

Before missing a bill, explain the consequence.

Example:

> If you don't pay this today, $15 of next week's available money will already be committed.

Avoid moral judgement.

---

# 27. Teen — Savings Goal

Show visually:

```text
Goal: Headphones

$180 / $300
60%
```

Also show:

```text
Estimated completion date
Weekly saving rate
```

Then connect decisions to time.

Example:

```text
Spend $25 today
→ Goal delayed approximately 1 week
```

---

# 28. Teen — What-If Simulator

This is a signature feature.

Input:

```text
Purchase amount
Optional category
Payment method
```

Example:

```text
What if I spend $80?
```

Output:

```text
Balance after purchase
Safe-to-spend after purchase
Bills still due
Savings goal impact
Future budget pressure
```

Provide scenarios:

```text
Buy now
Don't buy
Save first
Family Advance
```

Do not tell the teen there is only one "correct" answer.

Show trade-offs.

---

# 29. Family Advance Simulation

If teen chooses:

```text
Ask parent for advance
```

show:

```text
Price: $80

Pay back:
$20/week × 4 weeks
```

Then visualize:

```text
Week 1 available money
Week 2 available money
Week 3 available money
Week 4 available money
```

AI explanation example:

> This doesn't make the purchase cheaper. It means part of your next four weeks of money is already committed.

Teen submits request.

Parent approves or declines.

---

# 30. Practice Zone

Create a gamified practice area.

Examples:

### Flash Sale

```text
ONLY 8 MINUTES LEFT
40% OFF
```

Allow teen to:

```text
Continue
Pause and simulate
Back out
```

### Subscription

```text
First month FREE
Then $14.99/month
```

### BNPL

```text
Only $20 today!
```

Then reveal full future commitment.

### Unexpected Expense

```text
Your headphones broke.
Replacement: $75.
```

The purpose is:

**decision practice, not tricking the user.**

Clearly label scenarios as:

```text
Practice Scenario
```

---

# 31. AI Coach

Add a floating AI bubble on:

```text
Parent Dashboard
Teen Dashboard
```

Bottom-right.

It should understand the current household / user context.

Example teen questions:

```text
Can I afford this?
How long until I reach my goal?
Why is my safe-to-spend only $45?
What happens if I save $10 more?
What is BNPL?
```

Example parent questions:

```text
What should I discuss this week?
Why did the safe-to-spend amount decrease?
How can I explain committed money?
Should Alex move to the next independence level?
```

---

# 32. AI Architecture

AI calls must happen from the SERVER only.

Never expose the OpenAI API key to the client.

Create something like:

```text
server/src/services/ai/aiService.js
```

Use the OpenAI Responses API.

Design it behind an abstraction so the application still runs without the AI key.

Example:

```text
generateTeenInsight(context)

generateParentConversationPrompt(context)

answerFinancialQuestion(context, question)

explainSimulation(context, simulation)
```

If `OPENAI_API_KEY` is missing:

use deterministic fallback messages.

The demo must not crash without AI access.

---

# 33. AI Guardrails

The AI Coach is an educational coach.

It should NOT pretend to be a regulated financial adviser.

Its system instructions should include:

```text
You are an educational family financial coach.

Explain concepts and trade-offs.

Use the user's provided financial context.

Do not shame spending.

Do not tell minors to take out real loans or credit.

Do not provide instructions to access restricted financial products.

Distinguish simulated Family Advances from real BNPL.

Use age-appropriate language.

Encourage discussion with a parent for significant decisions.

Never expose information that the current user does not have permission to access.
```

---

# 34. AI Context Privacy

Build context server-side.

Parent AI context may include:

```text
teen spending categories
bill completion
savings trends
independence level
aggregated behaviour
```

It should NOT automatically receive private merchant-level details.

Teen AI should only receive household financial categories the parent has chosen to share.

Permission boundaries must apply to AI context too.

---

# 35. Family Financial Habits Score

Do NOT score wealth.

Do NOT rank:

```text
income
total savings
bank balance
absolute wealth
```

Instead calculate behaviour.

Prototype scoring categories:

```text
Saving consistency
Bills paid on time
Goal progress
Planning
Responsible committed-money use
Reflection / learning activity
Family conversation
Improvement over time
```

Example score:

```text
Family Habits Score

78 / 100

Saving consistency       18/20
Bills                    20/20
Planning                  14/20
Goal progress             16/20
Learning                  10/20
```

Keep the formula understandable.

Do not create a mathematically deceptive "financial health score."

Call it:

**Financial Habits Score**

not:

**Financial Health Score**

---

# 36. Friendly Comparison

For MVP, build optional fake/demo leaderboard data only.

Example:

```text
Family Habits

1. Team Kiwi       87
2. Money Masters   82
3. Our Family      78
```

Compare behaviours, not money.

This feature should be optional and not central to the experience.

---

# 37. Household Weekly Report

Both parent and teen can see a weekly report.

But visibility differs.

## Parent

Can see:

```text
spending categories
responsibility completion
savings
learning patterns
habit score
conversation prompt
```

## Teen

Can see:

```text
own spending
own responsibilities
own savings
safe-to-spend trend
household categories parent has shared
```

---

# 38. Bank Integration Architecture

DO NOT implement actual banking integration in MVP.

However, architect transactions through an adapter:

```text
BankProvider
```

with methods conceptually like:

```text
getAccounts()
getBalance()
getTransactions()
```

Implement:

```text
MockBankProvider
```

for MVP.

Later this can become:

```text
OpenBankingProvider
```

without rewriting the entire application.

Seed realistic transaction data.

---

# 39. Important Real-Money Boundary

The MVP may simulate real financial behaviour, but:

DO NOT:

```text
hold customer money
process bank transfers
provide credit
create real BNPL
ask users for bank passwords
store banking credentials
```

The hackathon demo should explain:

> Future versions can integrate authorised open-banking data.

The current app demonstrates the learning experience safely with mock transaction data.

---

# 40. Landing Page

Create a polished landing page.

Sections:

```text
Hero

Problem

Interactive Parent / Teen demo

How it works

Why this is different

Key features

Conversation over control

CTA
```

Hero concept:

> Practice money before money gets serious.

Supporting message:

> Help teenagers build financial judgement using realistic money decisions, future consequences, and family conversations.

Include:

> This is not a parental-control app.

---

# 41. Visual Design

Target:

```text
modern fintech
friendly
trustworthy
family-oriented
not childish
not corporate banking
```

Use:

* generous spacing
* clear cards
* strong information hierarchy
* rounded UI where appropriate
* progress visuals
* subtle gamification
* responsive layouts

Avoid:

* casino-style gamification
* flashing rewards
* manipulative streak mechanics
* excessive notifications
* red/green judgement everywhere

---

# 42. Navigation

Parent navigation:

```text
Overview
Responsibilities
Reports
Household
Settings
```

Teen navigation:

```text
This Week
Goals
Practice
History
Settings
```

Because MVP has one dashboard route per role, tabs/sections may remain within the same route instead of creating many pages.

---

# 43. Demo Data

Create a seed script.

Demo household:

```text
Household:
The Taylor Family

Parent:
Jordan Taylor

Teen:
Alex Taylor
```

Example teen state:

```text
Balance: $180

Weekly deposit: $100

Responsibilities:
Phone $15
Transport $25
Lunch $20

Savings goal:
Headphones
$180 / $300

Active Family Advance:
$20/week
2 installments remaining
```

Add realistic transactions.

Categories:

```text
Food
Entertainment
Transport
Subscriptions
Savings
Other
```

---

# 44. Demo Login Accounts

Seed convenient demo users.

Example:

```text
parent@example.com
DemoParent123!

teen@example.com
DemoTeen123!
```

Clearly mark them as development/demo credentials.

Do not use these passwords in production.

Include credentials in README only for demo mode.

---

# 45. REST API

Implement clean endpoints approximately like:

```text
POST   /api/auth/register/parent
POST   /api/auth/register/teen
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/household
PATCH  /api/household
PATCH  /api/household/visibility

GET    /api/teen/overview
GET    /api/parent/overview

GET    /api/transactions
POST   /api/transactions

GET    /api/responsibilities
POST   /api/responsibilities
PATCH  /api/responsibilities/:id

GET    /api/goals
POST   /api/goals
PATCH  /api/goals/:id

POST   /api/simulations/purchase

POST   /api/advances/request
PATCH  /api/advances/:id/approve
PATCH  /api/advances/:id/decline

GET    /api/reports/current
GET    /api/reports/history

GET    /api/prompts
PATCH  /api/prompts/:id/discussed

POST   /api/ai/chat
POST   /api/ai/insight
```

Adjust route design if a better REST structure emerges.

Keep naming consistent.

---

# 46. API Response Format

Use consistent JSON.

Successful example:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input"
  }
}
```

Do not expose stack traces in production.

---

# 47. Safe-to-Spend Service

Do not scatter calculations across React components.

Create backend/domain calculation functions.

Example:

```text
calculateSafeToSpend()

calculateGoalProjection()

calculateAdvanceImpact()

calculateHabitScore()

calculateWeeklySummary()
```

Write unit tests for them.

The UI should consume calculated values.

---

# 48. Simulation Engine

Create a simple pure-function simulation engine.

Input:

```text
balance
purchase
bills
savings
advances
weeklyIncome
```

Output:

```text
newBalance
newSafeToSpend
goalDelay
futureCommitments
riskFlags
weeklyProjection
```

Do not mutate the actual user's financial state when running a What-If simulation.

Simulation must be read-only.

---

# 49. Goal Projection

Estimate:

```text
remaining = targetAmount - currentAmount
```

and based on expected weekly savings derive approximate completion time.

When simulating spending:

show estimated delay.

Label estimates clearly:

```text
Estimated
```

Do not pretend projections are guaranteed.

---

# 50. Testing

Add meaningful automated tests.

At minimum test:

## Authentication

```text
parent registration
teen invite registration
invalid invite
login
protected routes
role authorization
```

## Privacy

Ensure parent transaction endpoint does not reveal restricted merchant-level information.

Ensure teen cannot access hidden household categories.

## Business Logic

Test:

```text
safe-to-spend
family advance repayment
goal projection
habit score
what-if simulation
```

## API

Test important endpoints using a testing library such as Supertest.

---

# 51. Frontend UX States

Every major data component needs:

```text
loading
success
empty
error
```

Do not leave blank screens.

Examples:

```text
No savings goal yet.
Create your first goal.
```

and:

```text
No conversation prompt this week.
Everything looks steady.
```

---

# 52. Accessibility

Use:

```text
semantic HTML
keyboard-accessible controls
labels for forms
adequate contrast
ARIA where necessary
clear focus states
```

Do not communicate meaning through colour alone.

---

# 53. Responsive Design

Must work reasonably on:

```text
desktop
tablet
mobile
```

Primary hackathon demo may be desktop, but mobile must remain usable.

---

# 54. Security Checklist

Implement:

```text
bcrypt password hashing
HTTP-only authentication cookie
Secure cookie in production
SameSite policy
CORS allowlist
Helmet
rate limiting
request validation
MongoDB query safety
authorization checks
environment-secret protection
central error handling
```

Never trust role, householdId or ownership IDs sent by the frontend.

Resolve permissions from authenticated server state.

---

# 55. README

Create a high-quality README containing:

```text
Product overview

Screenshots placeholder

Architecture

Technology stack

Local setup

Environment variables

MongoDB setup

How to seed demo data

Demo accounts

Run commands

Testing

Project structure

API overview

Privacy philosophy

Known limitations

Future open-banking integration
```

Include:

```bash
git clone ...
npm install
npm run dev
```

with exact working steps.

---

# 56. Development Experience

Make local setup simple.

Ideally:

```bash
npm install
npm run install:all
npm run seed
npm run dev
```

or an equally simple documented flow.

Avoid unnecessary infrastructure.

Do not require Docker unless it materially simplifies the project.

Use MongoDB Atlas or local MongoDB.

---

# 57. Git Discipline

Do not commit:

```text
node_modules
.env
build files
API keys
secrets
```

Use clear commits if making commits:

```text
chore: initialise MERN architecture
feat: add authentication
feat: add household roles
feat: add teen dashboard
feat: add parent dashboard
feat: add financial simulator
feat: add AI coach
test: add business logic tests
docs: add project README
```

Do not rewrite Git history or force push.

---

# 58. Implementation Order

Build in this sequence.

## Phase 1 — Foundation

```text
Repo structure
React
Express
MongoDB
Environment config
Shared development scripts
```

Verify client and server both run.

## Phase 2 — Authentication

```text
User model
Household model
Parent registration
Teen invite flow
Login/logout
Role-based routes
Protected frontend routes
```

Verify both roles independently.

## Phase 3 — Demo Financial Data

```text
Transaction
Responsibility
Savings Goal
Seed script
MockBankProvider
```

## Phase 4 — Teen Dashboard

Implement:

```text
My Money Now
Safe-to-spend
Responsibilities
Savings goal
```

## Phase 5 — Parent Dashboard

Implement:

```text
Weekly overview
Category-only spending
Independence controls
Household visibility
```

## Phase 6 — Simulator

Implement:

```text
What-if purchase
Future projection
Family Advance
Goal impact
```

## Phase 7 — Practice Zone

Implement several polished scenarios.

## Phase 8 — Weekly Reports

Create role-appropriate weekly reports.

## Phase 9 — Financial Habits Score

Implement understandable behaviour-based scoring.

## Phase 10 — AI

Add:

```text
Teen coach
Parent conversation prompt
Context-aware Q&A
Fallback mode
```

## Phase 11 — Landing Page

Integrate polished marketing/demo experience.

## Phase 12 — Testing and Polish

Run:

```text
tests
lint
build
security review
responsive check
```

Fix failures before declaring the project complete.

---

# 59. Acceptance Scenario

The final application must support this complete demo:

### Step 1

Parent registers.

### Step 2

Parent creates:

```text
Taylor Family
```

### Step 3

Parent receives invite code.

### Step 4

Teen joins.

### Step 5

Parent sets:

```text
Weekly money: $100
Independence Level 2
Savings commitment: $20
Phone responsibility: $15
Transport: $20
```

### Step 6

Teen opens dashboard.

Sees:

```text
Realistic balance
Committed money
Safe-to-spend
Savings goal
```

### Step 7

Teen asks:

> Can I spend $80 on a game?

### Step 8

What-If Simulator shows:

```text
balance effect
safe-to-spend effect
savings delay
future obligations
```

### Step 9

Teen tests Family Advance.

App shows future weekly deductions.

### Step 10

Teen makes/records a decision.

### Step 11

Parent sees only:

```text
Entertainment spending increased
```

not the exact merchant/item.

### Step 12

Parent receives:

```text
Worth discussing
```

with one useful AI-supported conversation prompt.

### Step 13

Both users see their weekly financial learning summary.

This complete flow is more important than implementing many unfinished secondary features.

---

# 60. Definition of Done

Do not call the MVP complete until:

```text
Parent registration works
Teen invite registration works
Login/logout works
Authorization works
Role routing works
MongoDB persistence works
Seed data works
Parent dashboard works
Teen dashboard works
Privacy rules work
Safe-to-spend works
Savings goals work
Responsibilities work
What-if simulator works
Family Advance works
Practice scenarios work
Weekly reports work
Habits Score works
AI Coach has working or fallback mode
Responsive UI works
README is complete
Tests pass
Production build succeeds
```

---

# 61. Priority Rules

When time is limited, prioritize in this order:

```text
1. Auth
2. Parent/Teen shared household
3. Teen financial picture
4. Safe-to-spend
5. Parent privacy-aware view
6. What-if simulator
7. Savings goals
8. Graduated independence
9. Parent conversation prompt
10. Family Advance
11. Practice Zone
12. Habits Score
13. Secondary polish
```

A polished core journey is preferable to twenty unfinished features.

---

# 62. Engineering Behaviour

While working:

1. Inspect the existing repo before editing.
2. Preserve working code unless there is a clear reason to refactor.
3. Keep components reasonably small.
4. Keep financial calculations out of presentation components.
5. Keep authorization server-side.
6. Do not expose secrets.
7. Do not silently weaken privacy requirements.
8. Run tests after meaningful changes.
9. Run production builds before completion.
10. Fix errors rather than documenting them as "future work" when they affect the core flow.
11. Document genuine limitations.
12. Do not implement real banking or real credit for the MVP.
13. Use the product steering document to resolve ambiguity.
14. Prefer simple maintainable code over sophisticated architecture.

---

# 63. Final Deliverables

When finished, provide:

```text
1. Working application
2. Complete frontend
3. Complete Express backend
4. MongoDB schemas
5. Working authentication
6. Parent/Teen authorization
7. Demo seed data
8. AI integration/fallback
9. Automated tests
10. .env.example
11. README
12. Clear architecture summary
13. Remaining limitations
14. Recommended next development steps
```

Also provide a final concise engineering report containing:

```text
What was built
Architecture used
Important design decisions
How privacy is enforced
How authentication works
How to run the application
Demo credentials
Tests executed
Known limitations
```

---

# Core Product Reminder

Whenever a design or engineering choice is unclear, return to this principle:

**18 Before 18 is not trying to monitor teenagers more closely.**

It is trying to give teenagers increasingly realistic responsibility while helping families turn financial decisions into learning.

The intended progression is:

**Understand → Practice → Decide → Experience consequences → Reflect → Improve → Gain independence**

Success means the teenager eventually needs the system and parental intervention less, not more.
