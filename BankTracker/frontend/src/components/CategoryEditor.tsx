import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { CATEGORIES, CATEGORY_COLORS } from '../types'
import CategoryBadge from './CategoryBadge'

interface Props {
  transactionId: string
  currentCategory: string
  isUserEdited: boolean
}

export default function CategoryEditor({ transactionId, currentCategory, isUserEdited }: Props) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (category: string) =>
      api.patch(`/transactions/${transactionId}/category`, { category }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      setOpen(false)
    },
  })

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="group flex items-center gap-1.5 hover:opacity-80 transition-opacity"
        title="Edit category"
      >
        <CategoryBadge category={currentCategory} />
        {isUserEdited && (
          <span className="text-xs text-gray-400" title="Manually set">✎</span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-xl shadow-xl w-56 py-2 max-h-80 overflow-y-auto">
            <p className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Select Category
            </p>
            {CATEGORIES.map((cat) => {
              const color = CATEGORY_COLORS[cat] ?? '#9ca3af'
              const isSelected = cat === currentCategory
              return (
                <button
                  key={cat}
                  onClick={() => mutation.mutate(cat)}
                  disabled={mutation.isPending}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-green-50' : ''
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className={isSelected ? 'font-medium text-green-700' : 'text-gray-700'}>
                    {cat}
                  </span>
                  {isSelected && <span className="ml-auto text-green-600 text-xs">✓</span>}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
