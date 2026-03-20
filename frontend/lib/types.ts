export type CategoryId = 'random-thoughts' | 'school' | 'personal'
export const DEFAULT_CATEGORY_ID: CategoryId = 'random-thoughts'

export interface Category {
  id: CategoryId
  name: string
  color: string
}

export interface Note {
  id: string
  title: string
  content: string
  category: CategoryId | null
  createdAt: string
  updatedAt: string
}

export const CATEGORIES: Category[] = [
  { id: DEFAULT_CATEGORY_ID, name: 'Random Thoughts', color: '#EF9C66' },
  { id: 'school', name: 'School', color: '#FCDCA0' },
  { id: 'personal', name: 'Personal', color: '#78ABA8' },
]

export function getCategoryById(id: CategoryId): Category | undefined {
  return CATEGORIES.find((c) => c.id === id)
}

export function getDisplayCategory(id: CategoryId | null | undefined): Category {
  return getCategoryById(id ?? DEFAULT_CATEGORY_ID) ?? CATEGORIES[0]
}
