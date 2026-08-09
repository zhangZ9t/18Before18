import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { connectDatabase, disconnectDatabase } from '../config/db.js'
import { ConversationPrompt } from '../models/ConversationPrompt.js'
import { FamilyAdvance } from '../models/FamilyAdvance.js'
import { Household } from '../models/Household.js'
import { PracticeScenario } from '../models/PracticeScenario.js'
import { Responsibility } from '../models/Responsibility.js'
import { SavingsGoal } from '../models/SavingsGoal.js'
import { Transaction } from '../models/Transaction.js'
import { User } from '../models/User.js'
import { WeeklyReport } from '../models/WeeklyReport.js'

const demoCategories = [
  { name: 'Housing', weeklyBudget: 450, visibleToTeen: true },
  { name: 'Food', weeklyBudget: 180, visibleToTeen: true },
  { name: 'Transport', weeklyBudget: 90, visibleToTeen: true },
  { name: 'Utilities', weeklyBudget: 75, visibleToTeen: true },
  { name: 'Subscriptions', weeklyBudget: 28, visibleToTeen: false },
  { name: 'Savings', weeklyBudget: 100, visibleToTeen: true },
]

function relativeDate(daysFromToday, hour = 12) {
  const date = new Date()
  date.setDate(date.getDate() + daysFromToday)
  date.setHours(hour, 0, 0, 0)
  return date
}

async function clearDemoCollections() {
  await Promise.all([
    ConversationPrompt.deleteMany({}),
    FamilyAdvance.deleteMany({}),
    Household.deleteMany({}),
    PracticeScenario.deleteMany({}),
    Responsibility.deleteMany({}),
    SavingsGoal.deleteMany({}),
    Transaction.deleteMany({}),
    User.deleteMany({}),
    WeeklyReport.deleteMany({}),
  ])
}

async function seed() {
  await connectDatabase()

  const databaseName = mongoose.connection.name
  if (
    !databaseName.includes('18before18') &&
    process.env.ALLOW_SEED !== 'true'
  ) {
    throw new Error(
      `Refusing to seed database "${databaseName}". Use an 18before18 database or set ALLOW_SEED=true explicitly.`,
    )
  }

  await clearDemoCollections()

  const [parentPasswordHash, teenPasswordHash] = await Promise.all([
    bcrypt.hash('DemoParent123!', 12),
    bcrypt.hash('DemoTeen123!', 12),
  ])
  const parent = await User.create({
    name: 'Jordan Taylor',
    email: 'parent@example.com',
    passwordHash: parentPasswordHash,
    role: 'parent',
  })
  const household = await Household.create({
    name: 'The Taylor Family',
    ownerId: parent.id,
    inviteCode: 'FAMILY-7K4P',
    weeklyDeposit: 100,
    savingsCommitment: 20,
    depositFrequency: 'weekly',
    independenceLevel: 2,
    householdCategories: demoCategories,
    savingsTarget: 300,
  })
  parent.householdId = household.id
  await parent.save()

  const teen = await User.create({
    name: 'Alex Taylor',
    email: 'teen@example.com',
    passwordHash: teenPasswordHash,
    role: 'teen',
    householdId: household.id,
  })

  await Responsibility.create([
    {
      householdId: household.id,
      teenId: teen.id,
      name: 'Phone plan',
      category: 'Subscriptions',
      amount: 15,
      frequency: 'weekly',
      dueDate: relativeDate(2),
      status: 'upcoming',
      assignedAtIndependenceLevel: 2,
      consequence:
        'If this is missed, $15 of next week’s available money will already be committed.',
    },
    {
      householdId: household.id,
      teenId: teen.id,
      name: 'Transport',
      category: 'Transport',
      amount: 25,
      frequency: 'weekly',
      dueDate: relativeDate(4),
      status: 'upcoming',
      assignedAtIndependenceLevel: 2,
      consequence:
        'Missing this leaves less flexible money for getting around next week.',
    },
    {
      householdId: household.id,
      teenId: teen.id,
      name: 'Lunch',
      category: 'Food',
      amount: 20,
      frequency: 'weekly',
      dueDate: relativeDate(-1),
      status: 'paid',
      assignedAtIndependenceLevel: 2,
    },
  ])

  await SavingsGoal.create({
    householdId: household.id,
    teenId: teen.id,
    name: 'Headphones',
    targetAmount: 300,
    currentAmount: 180,
    weeklyContribution: 20,
    targetDate: relativeDate(42),
  })

  await FamilyAdvance.create({
    householdId: household.id,
    teenId: teen.id,
    parentId: parent.id,
    itemName: 'Concert ticket',
    originalAmount: 80,
    amountAdvanced: 80,
    installmentAmount: 20,
    installmentCount: 4,
    installmentsRemaining: 2,
    status: 'active',
  })

  const expenses = [
    ['Food', 22, 'Corner Cafe', 'Lunch with friends', -1],
    ['Entertainment', 42, 'Game Store', 'Weekend entertainment', -2],
    ['Transport', 18, 'City Bus', 'Bus card top-up', -3],
    ['Subscriptions', 12, 'Music App', 'Monthly music subscription', -5],
    ['Food', 13, 'Local Dairy', 'Snacks', -6],
    ['Other', 13, 'Stationery Shop', 'School supplies', -7],
  ]

  await Transaction.create([
    {
      householdId: household.id,
      userId: teen.id,
      amount: 300,
      type: 'income',
      category: 'Income',
      merchant: 'Taylor Family',
      description: 'Opening demo balance and deposits',
      date: relativeDate(-8),
      source: 'mock',
    },
    ...expenses.map(([category, amount, merchant, description, days]) => ({
      householdId: household.id,
      userId: teen.id,
      amount,
      type: 'expense',
      category,
      merchant,
      description,
      date: relativeDate(days),
      source: 'mock',
    })),
    {
      householdId: household.id,
      userId: teen.id,
      amount: 20,
      type: 'saving',
      category: 'Savings',
      description: 'Weekly headphones contribution',
      date: relativeDate(-2),
      source: 'mock',
    },
  ])

  await PracticeScenario.create([
    {
      title: 'The eight-minute sale',
      type: 'flash_sale',
      description: 'A timer says the price disappears soon. Pause and test the impact.',
      minimumIndependenceLevel: 1,
      difficulty: 'starter',
      payload: {
        headline: 'ONLY 8 MINUTES LEFT',
        offer: '40% OFF',
        amount: 54,
        actions: ['Continue', 'Pause and simulate', 'Back out'],
      },
    },
    {
      title: 'Free for now',
      type: 'subscription',
      description: 'The first month is free, then a recurring cost begins.',
      minimumIndependenceLevel: 2,
      difficulty: 'growing',
      payload: {
        headline: 'First month FREE',
        recurringAmount: 14.99,
        recurringFrequency: 'monthly',
      },
    },
    {
      title: 'Only $20 today',
      type: 'bnpl',
      description: 'Reveal the full future commitment behind a small first payment.',
      minimumIndependenceLevel: 2,
      difficulty: 'growing',
      payload: {
        purchaseAmount: 80,
        installmentAmount: 20,
        installmentCount: 4,
      },
    },
    {
      title: 'Headphones broke',
      type: 'unexpected_expense',
      description: 'A necessary replacement appears after flexible money was spent.',
      minimumIndependenceLevel: 1,
      difficulty: 'starter',
      payload: { replacementCost: 75 },
    },
  ])

  const weekStart = relativeDate(-6, 0)
  const weekEnd = relativeDate(0, 23)
  await WeeklyReport.create({
    householdId: household.id,
    userId: teen.id,
    weekStart,
    weekEnd,
    income: 100,
    spendingByCategory: {
      Food: 35,
      Entertainment: 42,
      Transport: 18,
      Subscriptions: 12,
      Other: 13,
    },
    billsPaid: 1,
    billsMissed: 0,
    savingsAdded: 20,
    safeToSpendAverage: 100,
    goalProgress: 60,
    habitScore: 78,
    scoreBreakdown: {
      savingConsistency: 18,
      bills: 20,
      planning: 14,
      goalProgress: 16,
      learning: 10,
    },
    aiSummary:
      'Alex kept savings consistent and paid lunch on time. Flexible spending was concentrated early in the week.',
    conversationPrompt:
      'If an unexpected expense came up tomorrow, what would you change?',
    householdSnapshot: {
      Housing: 450,
      Food: 180,
      Transport: 90,
      Utilities: 75,
      Subscriptions: 28,
      Savings: 100,
    },
  })

  // Conversation prompts are detected from the seeded transactions on the first parent load.

  console.log('Demo data seeded successfully.')
  console.log('Parent: parent@example.com / DemoParent123!')
  console.log('Teen: teen@example.com / DemoTeen123!')
}

seed()
  .catch((error) => {
    console.error('Seed failed', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await disconnectDatabase()
  })
