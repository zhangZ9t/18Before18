import { Transaction } from '../../models/Transaction.js'
import { BankProvider } from './BankProvider.js'

export class MockBankProvider extends BankProvider {
  async getAccounts(userId) {
    const balance = await this.getBalance(userId)
    return [
      {
        id: `mock-${userId}`,
        name: 'Everyday money',
        currency: 'NZD',
        balance,
        source: 'mock',
      },
    ]
  }

  async getBalance(userId) {
    const transactions = await Transaction.find({ userId })
      .select('amount type')
      .lean()

    return transactions.reduce((balance, transaction) => {
      if (transaction.type === 'income') return balance + transaction.amount
      if (transaction.type === 'expense') return balance - transaction.amount
      return balance
    }, 0)
  }

  async getTransactions(userId, query = {}) {
    return Transaction.find({ userId, ...query }).sort({ date: -1 })
  }
}
