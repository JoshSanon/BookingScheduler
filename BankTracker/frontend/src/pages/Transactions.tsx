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
  const [showFilters, setShowFilters] = useState(false)
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

  const clearFilters = () =>
    setFilters({ category: '', search: '', from: '', to: '', accountId: '', direction: '', page: 1 })

  const hasFilters = !!(filters.category || filters.search || filters.from || filters.to || filters.direction || filters.accountId)
  const activeFilterCount = [filters.category, filters.search, filters.from, filters.to, filters.direction, filters.accountId].filter(Boolean).length
  const totalPages = Math.ceil((data?.total ?? 0) / 50)

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-500 text-sm mt-0.5">{data?.total ?? 0} total</p>
        </div>
        <button
          onClick={() => categorizeMutation.mutate()}
          disabled={categorizeMutation.isPending}
          className="flex items-center gap-1.5 border border-gray-200 hover:border-gray-300 bg-white text-gray-700 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors disabled:opacity-40"
        >
          <span>🤖</span>
          <span className="hidden sm:inline">
            {categorizeMutation.isPending ? 'Categorising...' : 'Re-categorise with AI'}
          </span>
          <span className="sm:hidden">
            {categorizeMutation.isPending ? '...' : 'AI'}
          </span>
        </button>
      </div>

      {categorizeMutation.isSuccess && (
        <div className="mb-4 bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl text-sm">
          ✓ AI categorised {(categorizeMutation.data?.data as any)?.categorized ?? 0} transactions
        </div>
      )}

      {/* Summary bar */}
      {data && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white rounded-xl border border-gray-100 px-3 sm:px-5 py-3 sm:py-4">
            <p className="text-xs text-gray-500 mb-0.5">Total</p>
            <p className="text-sm sm:text-lg font-bold text-gray-900">{data.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 px-3 sm:px-5 py-3 sm:py-4">
            <p className="text-xs text-gray-500 mb-0.5">Spent</p>
            <p className="text-sm sm:text-lg font-bold text-red-600">
              -${data.totalSpent.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 px-3 sm:px-5 py-3 sm:py-4">
            <p className="text-xs text-gray-500 mb-0.5">Income</p>
            <p className="text-sm sm:text-lg font-bold text-green-600">
              +${data.totalIncome.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 mb-4">
        {/* Mobile: search + filter toggle */}
        <div className="flex gap-2 lg:hidden mb-2">
          <input
            type="text"
            placeholder="Search transactions..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
              showFilters || hasFilters
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'border-gray-200 text-gray-600'
            }`}
          >
            <span>⚙️</span>
            {activeFilterCount > 0 && (
              <span className="bg-green-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Mobile expandable filters */}
        <div className={`${showFilters ? 'flex' : 'hidden'} lg:flex flex-wrap gap-2 sm:gap-3`}>
          {/* Hidden on mobile — shown in row above */}
          <input
            type="text"
            placeholder="Search transactions..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="hidden lg:block flex-1 min-w-48 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <select
            value={filters.category}
            onChange={(e) => updateFilter('category', e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white min-w-0"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={filters.accountId}
            onChange={(e) => updateFilter('accountId', e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white min-w-0"
          >
            <option value="">All accounts</option>
            {accounts?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>

          <select
            value={filters.direction}
            onChange={(e) => updateFilter('direction', e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="">All types</option>
            <option value="debit">Expenses</option>
            <option value="credit">Income</option>
          </select>

          <input
            type="date"
            value={filters.from}
            onChange={(e) => updateFilter('from', e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="date"
            value={filters.to}
            onChange={(e) => updateFilter('to', e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Transaction list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Desktop table header */}
        <div className="hidden lg:grid grid-cols-[1fr,160px,130px,110px] gap-4 px-5 py-3 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
          <span>Transaction</span>
          <span>Category</span>
          <span>Account</span>
          <span className="text-right">Amount</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
            Loading transactions...
          </div>
        ) : !data?.transactions.length ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-sm gap-1">
            <span>No transactions found</span>
            {hasFilters && (
              <button onClick={clearFilters} className="text-green-600 hover:underline text-xs">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile card layout */}
            <div className="lg:hidden divide-y divide-gray-50">
              {data.transactions.map((tx) => (
                <div key={tx.id} className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-sm font-medium text-gray-900 leading-snug flex-1 min-w-0 truncate">
                      {tx.merchantName ?? tx.description}
                    </p>
                    <span
                      className={`text-sm font-semibold tabular-nums flex-shrink-0 ${
                        tx.direction === 'credit' ? 'text-green-600' : 'text-gray-900'
                      }`}
                    >
                      {tx.direction === 'credit' ? '+' : '-'}$
                      {Math.abs(tx.amount).toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 min-w-0">
                      <span>{format(new Date(tx.date), 'dd MMM')}</span>
                      <span>·</span>
                      <span className="truncate">{tx.accountName}</span>
                      {tx.isPending && <span className="text-yellow-600 font-medium">· Pending</span>}
                    </div>
                    <CategoryEditor
                      transactionId={tx.id}
                      currentCategory={tx.effectiveCategory}
                      isUserEdited={tx.isUserEdited}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table layout */}
            <div className="hidden lg:block">
              {data.transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="grid grid-cols-[1fr,160px,130px,110px] gap-4 px-5 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors items-center last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {tx.merchantName ?? tx.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                      {format(new Date(tx.date), 'EEE, d MMM yyyy')}
                      {tx.isPending && <span className="text-yellow-600 font-medium">· Pending</span>}
                    </p>
                  </div>
                  <CategoryEditor
                    transactionId={tx.id}
                    currentCategory={tx.effectiveCategory}
                    isUserEdited={tx.isUserEdited}
                  />
                  <div className="text-xs text-gray-500 truncate">{tx.accountName}</div>
                  <div className={`text-sm font-semibold text-right tabular-nums ${
                    tx.direction === 'credit' ? 'text-green-600' : 'text-gray-900'
                  }`}>
                    {tx.direction === 'credit' ? '+' : '-'}$
                    {Math.abs(tx.amount).toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          </>
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
