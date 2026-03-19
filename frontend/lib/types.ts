export type CategoryId = 'random-thoughts' | 'school' | 'personal'

export interface Category {
  id: CategoryId
  name: string
  color: string
}

export interface Note {
  id: string
  title: string
  content: string
  category: CategoryId
  createdAt: string
  updatedAt: string
}

export const CATEGORIES: Category[] = [
  { id: 'random-thoughts', name: 'Random Thoughts', color: '#EF9C66' },
  { id: 'school', name: 'School', color: '#FCDCA0' },
  { id: 'personal', name: 'Personal', color: '#78ABA8' },
]

export function getCategoryById(id: CategoryId): Category {
  return CATEGORIES.find((c) => c.id === id)!
}
