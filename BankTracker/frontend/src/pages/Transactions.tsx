import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import api from '../services/api'
import CategoryEditor from '../components/CategoryEditor'
import CategoryBadge from '../components/CategoryBadge'
import type { TransactionListResponse, Account } from '../types'
import { CATEGORIES } from '../types'

export default function Transactions() {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    from: '',
    to: '',
    accountId: '',
    direction: '',
    page: 1,
  })

  const { data, isLoading } = useQuery<TransactionListResponse>({
    queryKey: ['transactions', filters],
    queryFn: () =>
      api.get('/transactions', {
        params: {
          category: filters.category || undefined,
          search: filters.search || undefined,
          from: filters.from || undefined,
          to: filters.to || undefined,
          accountId: filters.accountId || undefined,
          direction: filters.direction || undefined,
          page: filters.page,
          pageSize: 50,
        },
      }).then((r) => r.data),
  })

  const { data: accounts } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: () => api.get('/accounts').then((r) => r.data),
  })

  const categorizeMutation = useMutation({
    mutationFn: () => api.post('/transactions/categorize'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] }),
  })

  const updateFilter = (key: string, value: string) =>
    setFilters((f) => ({ ...f, [key]: value, page: 1 }))

  const totalPages = Math.ceil((data?.total ?? 0) / 50)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-500 text-sm mt-0.5">{data?.total ?? 0} total transactions</p>
        </div>
        <button
          onClick={() => categorizeMutation.mutate()}
          disabled={categorizeMutation.isPending}
          className="flex items-center gap-2 border border-gray-200 hover:border-gray-300 bg-white text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
        >
          <span>🤖</span>
          {categorizeMutation.isPending ? 'Categorising...' : 'Re-categorise with AI'}
        </button>
      </div>

      {/* Summary bar */}
      {data && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 px-5 py-4">
            <p className="text-xs text-gray-500 mb-1">Showing</p>
            <p className="text-lg font-bold text-gray-900">{data.total} transactions</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 px-5 py-4">
            <p className="text-xs text-gray-500 mb-1">Total Spent</p>
            <p className="text-lg font-bold text-red-600">
              -${data.totalSpent.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 px-5 py-4">
            <p className="text-xs text-gray-500 mb-1">Total Income</p>
            <p className="text-lg font-bold text-green-600">
              +${data.totalIncome.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="🔍  Search transactions..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="flex-1 min-w-48 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        <select
          value={filters.category}
          onChange={(e) => updateFilter('category', e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          value={filters.accountId}
          onChange={(e) => updateFilter('accountId', e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        >
          <option value="">All accounts</option>
          {accounts?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>

        <select
          value={filters.direction}
          onChange={(e) => updateFilter('direction', e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        >
          <option value="">All types</option>
          <option value="debit">Expenses</option>
          <option value="credit">Income</option>
        </select>

        <input
          type="date"
          value={filters.from}
          onChange={(e) => updateFilter('from', e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <input
          type="date"
          value={filters.to}
          onChange={(e) => updateFilter('to', e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        {(filters.category || filters.search || filters.from || filters.to || filters.direction || filters.accountId) && (
          <button
            onClick={() => setFilters({ category: '', search: '', from: '', to: '', accountId: '', direction: '', page: 1 })}
            className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Transaction table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-[1fr,160px,120px,100px] gap-4 px-5 py-3 border-b border-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
          <span>Transaction</span>
          <span>Category</span>
          <span>Account</span>
          <span className="text-right">Amount</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
            Loading...
          </div>
        ) : !data?.transactions.length ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
            No transactions found
          </div>
        ) : (
          data.transactions.map((tx) => (
            <div
              key={tx.id}
              className="grid grid-cols-[1fr,160px,120px,100px] gap-4 px-5 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors items-center"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {tx.merchantName ?? tx.description}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {format(new Date(tx.date), 'EEE, d MMM yyyy')}
                  {tx.isPending && (
                    <span className="ml-2 text-yellow-600 font-medium">Pending</span>
                  )}
                </p>
              </div>

              <div>
                <CategoryEditor
                  transactionId={tx.id}
                  currentCategory={tx.effectiveCategory}
                  isUserEdited={tx.isUserEdited}
                />
              </div>

              <div className="text-xs text-gray-500 truncate">{tx.accountName}</div>

              <div className={`text-sm font-semibold text-right tabular-nums ${
                tx.direction === 'credit' ? 'text-green-600' : 'text-gray-900'
              }`}>
                {tx.direction === 'credit' ? '+' : '-'}$
                {Math.abs(tx.amount).toLocaleString('en-AU', { minimumFractionDigits: 2 })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Page {filters.page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={filters.page === 1}
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Previous
            </button>
            <button
              disabled={filters.page >= totalPages}
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
