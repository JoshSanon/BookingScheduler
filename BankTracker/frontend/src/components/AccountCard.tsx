import type { Account } from '../types'
import { format } from 'date-fns'

interface Props {
  account: Account
}

const accountTypeIcons: Record<string, string> = {
  transaction: '💳',
  savings: '🏦',
  credit: '💰',
  investment: '📈',
  loan: '🏠',
}

const institutionNames: Record<string, string> = {
  AU00000: 'ANZ',
  AU00001: 'Commonwealth Bank',
  AU00002: 'Westpac',
  AU00003: 'NAB',
  AU00004: 'Macquarie',
  AU00005: 'ING',
}

export default function AccountCard({ account }: Props) {
  const icon = accountTypeIcons[account.type] ?? '🏦'
  const institution = institutionNames[account.institution ?? ''] ?? account.institution ?? 'Bank'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xl">
            {icon}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{account.name}</p>
            <p className="text-sm text-gray-500">{institution}</p>
          </div>
        </div>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            account.status === 'active'
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {account.status}
        </span>
      </div>

      <div className="mt-2">
        <p className="text-sm text-gray-500 mb-0.5">Balance</p>
        <p className="text-2xl font-bold text-gray-900">
          ${account.balance.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
        </p>
        {account.availableFunds !== null && account.availableFunds !== account.balance && (
          <p className="text-sm text-gray-500 mt-0.5">
            Available: ${account.availableFunds?.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
          </p>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
        <span>{account.accountNumber ? `•••• ${account.accountNumber.slice(-4)}` : account.type}</span>
        <span>
          {account.lastSynced
            ? `Synced ${format(new Date(account.lastSynced), 'dd MMM HH:mm')}`
            : 'Never synced'}
        </span>
      </div>
    </div>
  )
}
