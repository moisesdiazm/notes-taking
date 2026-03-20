import { CATEGORIES, getCategoryById, getDisplayCategory } from '@/lib/types'

describe('CATEGORIES', () => {
  it('contains exactly 3 categories', () => {
    expect(CATEGORIES).toHaveLength(3)
  })

  it('has the expected category ids', () => {
    const ids = CATEGORIES.map((c) => c.id)
    expect(ids).toContain('random-thoughts')
    expect(ids).toContain('school')
    expect(ids).toContain('personal')
  })

  it('each category has a name, id, and color', () => {
    for (const cat of CATEGORIES) {
      expect(cat.id).toBeTruthy()
      expect(cat.name).toBeTruthy()
      expect(cat.color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })
})

describe('getCategoryById', () => {
  it('returns the correct category for "random-thoughts"', () => {
    const cat = getCategoryById('random-thoughts')
    expect(cat.id).toBe('random-thoughts')
    expect(cat.name).toBe('Random Thoughts')
  })

  it('returns the correct category for "school"', () => {
    const cat = getCategoryById('school')
    expect(cat.id).toBe('school')
    expect(cat.name).toBe('School')
  })

  it('returns the correct category for "personal"', () => {
    const cat = getCategoryById('personal')
    expect(cat.id).toBe('personal')
    expect(cat.name).toBe('Personal')
  })
})

describe('getDisplayCategory', () => {
  it('falls back to the default category when category is null', () => {
    const cat = getDisplayCategory(null)
    expect(cat.id).toBe('random-thoughts')
    expect(cat.name).toBe('Random Thoughts')
  })
})
