import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { app } from '../src/app.js'
import { connectDatabase, disconnectDatabase } from '../src/config/db.js'

let mongoServer

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: { ip: '127.0.0.1' },
  })
  await connectDatabase(mongoServer.getUri())
})

beforeEach(async () => {
  const collections = Object.values(mongoose.connection.collections)
  await Promise.all(collections.map((collection) => collection.deleteMany({})))
})

afterAll(async () => {
  await disconnectDatabase()
  if (mongoServer) await mongoServer.stop()
})

async function registerFamily() {
  const parentAgent = request.agent(app)
  const parentResponse = await parentAgent.post('/api/auth/register/parent').send({
    name: 'Jordan Taylor',
    email: 'parent@example.com',
    password: 'DemoParent123!',
    householdName: 'The Taylor Family',
  })
  const inviteCode = parentResponse.body.data.household.inviteCode
  const teenAgent = request.agent(app)
  const teenResponse = await teenAgent.post('/api/auth/register/teen').send({
    name: 'Alex Taylor',
    email: 'teen@example.com',
    password: 'DemoTeen123!',
    householdInviteCode: inviteCode,
  })

  return { parentAgent, parentResponse, teenAgent, teenResponse, inviteCode }
}

describe('authentication and household privacy API', () => {
  it('registers a parent, creates a household, and sets an HTTP-only cookie', async () => {
    const agent = request.agent(app)
    const response = await agent.post('/api/auth/register/parent').send({
      name: 'Jordan Taylor',
      email: 'parent@example.com',
      password: 'DemoParent123!',
      householdName: 'The Taylor Family',
    })

    expect(response.status).toBe(201)
    expect(response.body.data.user.role).toBe('parent')
    expect(response.body.data.household.name).toBe('The Taylor Family')
    expect(response.body.data.household.inviteCode).toMatch(/^FAMILY-/)
    expect(response.headers['set-cookie'][0]).toContain('HttpOnly')
  })

  it('allows a teen to join an existing household using an invite code', async () => {
    const { teenResponse, parentResponse } = await registerFamily()

    expect(teenResponse.status).toBe(201)
    expect(teenResponse.body.data.user.role).toBe('teen')
    expect(teenResponse.body.data.user.householdId).toBe(
      parentResponse.body.data.household.id,
    )
  })

  it('rejects an invalid teen invite code', async () => {
    const response = await request(app).post('/api/auth/register/teen').send({
      name: 'Alex Taylor',
      email: 'teen@example.com',
      password: 'DemoTeen123!',
      householdInviteCode: 'FAMILY-NOPE',
    })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('INVALID_INVITE')
  })

  it('logs in with valid credentials', async () => {
    await registerFamily()
    const response = await request(app).post('/api/auth/login').send({
      email: 'parent@example.com',
      password: 'DemoParent123!',
    })

    expect(response.status).toBe(200)
    expect(response.body.data.user.role).toBe('parent')
    expect(response.headers['set-cookie'][0]).toContain('HttpOnly')
  })

  it('protects authenticated routes and enforces role authorization', async () => {
    const unauthenticated = await request(app).get('/api/parent/overview')
    expect(unauthenticated.status).toBe(401)

    const { parentAgent, teenAgent } = await registerFamily()
    const teenOnParentRoute = await teenAgent.get('/api/parent/overview')
    const parentOnTeenRoute = await parentAgent.get('/api/teen/overview')

    expect(teenOnParentRoute.status).toBe(403)
    expect(parentOnTeenRoute.status).toBe(403)
  })

  it('never returns teen merchant details to a parent', async () => {
    const { parentAgent, teenAgent } = await registerFamily()
    const transactionResponse = await teenAgent.post('/api/transactions').send({
      amount: 18.5,
      type: 'expense',
      category: 'Food',
      merchant: "McDonald's",
      description: 'Lunch',
    })
    expect(transactionResponse.status).toBe(201)

    const parentView = await parentAgent.get('/api/transactions')
    expect(parentView.status).toBe(200)
    expect(parentView.body.data.view).toBe('category-only')
    expect(parentView.body.data.categories).toEqual([
      { category: 'Food', amount: 18.5 },
    ])
    expect(JSON.stringify(parentView.body)).not.toContain("McDonald's")
    expect(JSON.stringify(parentView.body)).not.toContain('Lunch')
  })

  it('hides unshared household categories and invite details from a teen', async () => {
    const { teenAgent } = await registerFamily()
    const response = await teenAgent.get('/api/household')
    const household = response.body.data.household
    const visibleNames = household.visibleCategories.map(({ name }) => name)

    expect(response.status).toBe(200)
    expect(visibleNames).not.toContain('Subscriptions')
    expect(household).not.toHaveProperty('inviteCode')
    expect(household).not.toHaveProperty('householdCategories')
  })

  it('supports the core parent-to-teen financial learning journey', async () => {
    const { parentAgent, teenAgent, teenResponse } = await registerFamily()
    const teenId = teenResponse.body.data.user.id

    const householdUpdate = await parentAgent.patch('/api/household').send({
      weeklyDeposit: 100,
      savingsCommitment: 20,
      independenceLevel: 2,
    })
    expect(householdUpdate.status).toBe(200)

    const responsibility = await parentAgent
      .post('/api/responsibilities')
      .send({
        teenId,
        name: 'Phone plan',
        category: 'Subscriptions',
        amount: 15,
        frequency: 'weekly',
        dueDate: '2026-08-14',
        assignedAtIndependenceLevel: 2,
      })
    expect(responsibility.status).toBe(201)

    const goal = await teenAgent.post('/api/goals').send({
      name: 'Headphones',
      targetAmount: 300,
      currentAmount: 180,
      weeklyContribution: 20,
    })
    expect(goal.status).toBe(201)

    await teenAgent.post('/api/transactions').send({
      amount: 180,
      type: 'income',
      category: 'Income',
      description: 'Demo balance',
    })

    const teenOverview = await teenAgent.get('/api/teen/overview')
    expect(teenOverview.status).toBe(200)
    expect(teenOverview.body.data.money).toEqual({
      balance: 180,
      upcomingBills: 15,
      activeAdvancePayments: 0,
      savingsCommitment: 20,
      safeToSpend: 145,
    })

    const simulation = await teenAgent.post('/api/simulations/purchase').send({
      purchaseAmount: 80,
      category: 'Entertainment',
      paymentMethod: 'money-now',
    })
    expect(simulation.status).toBe(200)
    expect(simulation.body.data.simulation.newSafeToSpend).toBe(65)
    expect(simulation.body.data.simulation.goalDelayWeeks).toBe(4)

    const waitSimulation = await teenAgent
      .post('/api/simulations/purchase')
      .send({
        purchaseAmount: 80,
        category: 'Entertainment',
        paymentMethod: 'wait',
      })
    expect(waitSimulation.body.data.simulation.newBalance).toBe(180)
    expect(waitSimulation.body.data.simulation.newSafeToSpend).toBe(145)

    const saveFirstSimulation = await teenAgent
      .post('/api/simulations/purchase')
      .send({
        purchaseAmount: 80,
        category: 'Entertainment',
        paymentMethod: 'save-first',
      })
    expect(saveFirstSimulation.body.data.simulation.saveFirstWeeks).toBe(4)
    expect(saveFirstSimulation.body.data.simulation.newBalance).toBe(180)

    const advanceSimulation = await teenAgent
      .post('/api/simulations/purchase')
      .send({
        purchaseAmount: 80,
        category: 'Entertainment',
        paymentMethod: 'family-advance',
      })
    expect(advanceSimulation.body.data.simulation.newBalance).toBe(180)
    expect(advanceSimulation.body.data.simulation.newSafeToSpend).toBe(125)
    expect(
      advanceSimulation.body.data.simulation.weeklyProjection
        .slice(0, 4)
        .map(({ availableAfterAdvances }) => availableAfterAdvances),
    ).toEqual([80, 80, 80, 80])

    const advance = await teenAgent.post('/api/advances/request').send({
      itemName: 'Game',
      amount: 80,
      installmentCount: 4,
    })
    expect(advance.status).toBe(201)
    expect(advance.body.data.impact.installmentAmount).toBe(20)

    const advanceId = advance.body.data.advance._id
    const parentOverview = await parentAgent.get('/api/parent/overview')
    expect(parentOverview.body.data.pendingAdvances).toHaveLength(1)

    const approval = await parentAgent.patch(
      `/api/advances/${advanceId}/approve`,
    )
    expect(approval.status).toBe(200)
    expect(approval.body.data.advance.status).toBe('active')

    const updatedTeenOverview = await teenAgent.get('/api/teen/overview')
    expect(updatedTeenOverview.body.data.money.activeAdvancePayments).toBe(20)
    expect(updatedTeenOverview.body.data.money.safeToSpend).toBe(125)

    const recordedDecision = await teenAgent.post('/api/transactions').send({
      amount: 80,
      type: 'expense',
      category: 'Entertainment',
      description: 'Decision recorded from the What-If Simulator',
    })
    expect(recordedDecision.status).toBe(201)

    const overviewAfterDecision = await teenAgent.get('/api/teen/overview')
    expect(overviewAfterDecision.body.data.money.balance).toBe(100)
    expect(overviewAfterDecision.body.data.money.safeToSpend).toBe(45)

    const parentTransactions = await parentAgent.get('/api/transactions')
    expect(parentTransactions.body.data.categories).toContainEqual({
      category: 'Entertainment',
      amount: 80,
    })
    expect(JSON.stringify(parentTransactions.body)).not.toContain(
      'Decision recorded',
    )

    const report = await teenAgent.get('/api/reports/current')
    expect(report.status).toBe(200)
    expect(report.body.data.report.habits.label).toBe(
      'Financial Habits Score',
    )
  })
})
