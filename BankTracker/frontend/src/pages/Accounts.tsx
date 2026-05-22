import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api'
import AccountCard from '../components/AccountCard'
import type { Account, AuthLinkResponse } from '../types'

export default function Accounts() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const justConnected = searchParams.get('connected') === 'true'

  useEffect(() => {
    if (justConnected) {
      syncMutation.mutate()
      setSearchParams({})
    }
  }, [justConnected])

  const { data: accounts, isLoading } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: () => api.get('/accounts').then((r) => r.data),
  })

  const connectMutation = useMutation({
    mutationFn: (): Promise<AuthLinkResponse> =>
      api.post('/basiq/auth-link').then((r) => r.data),
    onSuccess: (data) => {
      window.open(data.authUrl, '_blank', 'width=600,height=700,scrollbars=yes')
    },
  })

  const syncMutation = useMutation({
    mutationFn: () => api.post('/basiq/sync'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })

  const totalBalance = accounts?.reduce((sum, a) => sum + a.balance, 0) ?? 0

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bank Accounts</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {accounts?.length ?? 0} account{accounts?.length !== 1 ? 's' : ''} connected
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending || !accounts?.length}
            className="flex items-center gap-2 border border-gray-200 hover:border-gray-300 bg-white text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
          >
            <span className={syncMutation.isPending ? 'animate-spin' : ''}>🔄</span>
            Sync
          </button>
          <button
            onClick={() => connectMutation.mutate()}
            disabled={connectMutation.isPending}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <span>+</span>
            Connect Bank
          </button>
        </div>
      </div>

      {syncMutation.isSuccess && (
        <div className="mb-6 bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl text-sm">
          ✓ Accounts synced — {(syncMutation.data?.data as any)?.transactionsAdded ?? 0} new transactions imported
        </div>
      )}

      {connectMutation.isSuccess && (
        <div className="mb-6 bg-blue-50 border border-blue-100 text-blue-700 px-4 py-3 rounded-xl text-sm">
          A bank connection window has opened. Complete the process there, then click Sync.
        </div>
      )}

      {connectMutation.isError && (
        <div className="mb-6 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">
          Failed to get connection link. Please check your Basiq API key.
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">Loading accounts...</div>
      ) : !accounts?.length ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <div className="text-5xl mb-4">🏦</div>
          <h3 className="font-semibold text-gray-900 text-lg mb-2">Connect your first bank account</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            Securely connect your Australian bank accounts using Open Banking (CDR).
            Supports ANZ, CommBank, Westpac, NAB, and more.
          </p>
          <button
            onClick={() => connectMutation.mutate()}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            Connect Bank Account
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6">
            <p className="text-sm text-gray-500">Total Balance Across All Accounts</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              ${totalBalance.toLocaleString('en-AU', { minimumFractionDigits: 2 })} AUD
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {accounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
