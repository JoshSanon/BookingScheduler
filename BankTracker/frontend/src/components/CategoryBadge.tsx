import { CATEGORY_COLORS } from '../types'

interface Props {
  category: string
  size?: 'sm' | 'md'
}

export default function CategoryBadge({ category, size = 'md' }: Props) {
  const color = CATEGORY_COLORS[category] ?? '#9ca3af'
  const bg = color + '20'

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      }`}
      style={{ backgroundColor: bg, color }}
    >
      {category}
    </span>
  )
}
