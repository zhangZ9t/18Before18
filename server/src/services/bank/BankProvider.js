export class BankProvider {
  async getAccounts() {
    throw new Error('getAccounts must be implemented by a bank provider')
  }

  async getBalance() {
    throw new Error('getBalance must be implemented by a bank provider')
  }

  async getTransactions() {
    throw new Error('getTransactions must be implemented by a bank provider')
  }
}
