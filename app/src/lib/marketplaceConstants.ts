export const ITEM_CATEGORIES = [
  'Books',
  'Furniture',
  'Electronics',
  'Clothing',
  'Sports',
  'Kitchen',
  'Stationery',
  'Other',
] as const

export type ItemCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor'

export const ITEM_CONDITIONS: ReadonlyArray<{ value: ItemCondition; label: string }> =
  [
    { value: 'new', label: 'New' },
    { value: 'like_new', label: 'Like new' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' },
  ]

export type ListingType = 'rent' | 'sell'
