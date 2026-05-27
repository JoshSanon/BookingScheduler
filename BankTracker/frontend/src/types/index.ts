export interface User {
  userId: string
  email: string
  firstName: string
  lastName: string
  token: string
}

export interface Account {
  id: string
  basiqAccountId: string
  name: string
  accountNumber: string | null
  type: string
  institution: string | null
  balance: number
  availableFunds: number | null
  status: string
  currency: string
  lastSynced: string | null
  transactionCount: number
}

export interface Transaction {
  id: string
  basiqTransactionId: string
  amount: number
  description: string
  merchantName: string | null
  date: string
  basiqCategory: string | null
  aiCategory: string | null
  userCategory: string | null
  effectiveCategory: string
  isUserEdited: boolean
  isPending: boolean
  direction: 'debit' | 'credit'
  bankAccountId: string
  accountName: string | null
  institution: string | null
}

export interface TransactionListResponse {
  transactions: Transaction[]
  total: number
  totalSpent: number
  totalIncome: number
  spendingByCategory: Record<string, number>
}

export interface SyncResponse {
  accountsUpdated: number
  transactionsAdded: number
  transactionsUpdated: number
}

export interface AuthLinkResponse {
  authUrl: string
  expiresAt: string
}

export const CATEGORIES = [
  'Groceries',
  'Dining & Restaurants',
  'Shopping',
  'Transport',
  'Fuel',
  'Entertainment',
  'Health & Medical',
  'Utilities & Bills',
  'Insurance',
  'Subscriptions',
  'Rent & Mortgage',
  'Travel',
  'Education',
  'Personal Care',
  'Income',
  'Transfer',
  'Investments',
  'Government',
  'Other',
] as const

export type Category = (typeof CATEGORIES)[number]

export const CATEGORY_COLORS: Record<string, string> = {
  Groceries: '#22c55e',
  'Dining & Restaurants': '#f97316',
  Shopping: '#a855f7',
  Transport: '#3b82f6',
  Fuel: '#64748b',
  Entertainment: '#ec4899',
  'Health & Medical': '#ef4444',
  'Utilities & Bills': '#f59e0b',
  Insurance: '#06b6d4',
  Subscriptions: '#8b5cf6',
  'Rent & Mortgage': '#6366f1',
  Travel: '#14b8a6',
  Education: '#0ea5e9',
  'Personal Care': '#f43f5e',
  Income: '#10b981',
  Transfer: '#94a3b8',
  Investments: '#d97706',
  Government: '#475569',
  Other: '#9ca3af',
}
