import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import SpendingChart from '../components/SpendingChart'
import CategoryBadge from '../components/CategoryBadge'
import CategoryEditor from '../components/CategoryEditor'
import type { TransactionListResponse, Account } from '../types'

export default function Dashboard() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: txData } = useQuery<TransactionListResponse>({
    queryKey: ['transactions', 'dashboard'],
    queryFn: () =>
      api.get('/transactions', {
        params: {
          from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
          pageSize: 10,
        },
      }).then((r) => r.data),
  })

  const { data: accounts } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: () => api.get('/accounts').then((r) => r.data),
  })

  const syncMutation = useMutation({
    mutationFn: () => api.post('/basiq/sync'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })

  const totalBalance = accounts?.reduce((sum, a) => sum + a.balance, 0) ?? 0

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good {getGreeting()}, {user?.firstName} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {format(new Date(), 'EEEE, d MMMM yyyy')}
          </p>
        </div>
        <button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <span className={syncMutation.isPending ? 'animate-spin' : ''}>🔄</span>
          {syncMutation.isPending ? 'Syncing...' : 'Sync Accounts'}
        </button>
      </div>

      {syncMutation.isError && (
        <div className="mb-6 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">
          Sync failed. Make sure you have connected a bank account.
        </div>
      )}

      {syncMutation.isSuccess && (
        <div className="mb-6 bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl text-sm">
          ✓ Sync complete — {(syncMutation.data?.data as any)?.transactionsAdded ?? 0} new transactions
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Balance"
          value={`$${totalBalance.toLocaleString('en-AU', { minimumFractionDigits: 2 })}`}
          icon="💰"
          color="bg-green-500"
        />
        <StatCard
          label="Spent This Month"
          value={`$${(txData?.totalSpent ?? 0).toLocaleString('en-AU', { minimumFractionDigits: 2 })}`}
          icon="💸"
          color="bg-red-500"
        />
        <StatCard
          label="Income This Month"
          value={`$${(txData?.totalIncome ?? 0).toLocaleString('en-AU', { minimumFractionDigits: 2 })}`}
          icon="📈"
          color="bg-blue-500"
        />
        <StatCard
          label="Transactions"
          value={String(txData?.total ?? 0)}
          icon="🧾"
          color="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Spending breakdown */}
        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Spending Breakdown</h2>
          <SpendingChart data={txData?.spendingByCategory ?? {}} />
        </div>

        {/* Recent transactions */}
        <div className="col-span-3 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Transactions</h2>
            <a href="/transactions" className="text-sm text-green-600 hover:text-green-700 font-medium">
              View all →
            </a>
          </div>

          {!txData?.transactions.length ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">🏦</p>
              <p className="font-medium text-gray-600">No transactions yet</p>
              <p className="text-sm mt-1">Connect a bank account and sync to get started</p>
            </div>
          ) : (
            <div className="space-y-1">
              {txData.transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {tx.merchantName ?? tx.description}
                    </p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(tx.date), 'dd MMM')} · {tx.accountName}
                    </p>
                  </div>
                  <CategoryEditor
                    transactionId={tx.id}
                    currentCategory={tx.effectiveCategory}
                    isUserEdited={tx.isUserEdited}
                  />
                  <span
                    className={`text-sm font-semibold ml-2 tabular-nums ${
                      tx.direction === 'credit' ? 'text-green-600' : 'text-gray-900'
                    }`}
                  >
                    {tx.direction === 'credit' ? '+' : '-'}$
                    {Math.abs(tx.amount).toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color }: {
  label: string; value: string; icon: string; color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center text-lg mb-3`}>
        {icon}
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
