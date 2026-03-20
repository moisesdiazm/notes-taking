import { formatDate, formatLastEdited, generateId } from '@/lib/utils'

const MOCK_NOW = new Date('2026-03-19T12:00:00.000Z')

describe('formatDate', () => {
  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(MOCK_NOW)
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it('returns "Today" for a date on the same day', () => {
    const today = new Date('2026-03-19T09:00:00.000Z').toISOString()
    expect(formatDate(today)).toBe('Today')
  })

  it('returns "Yesterday" for a date on the previous day', () => {
    const yesterday = new Date('2026-03-18T09:00:00.000Z').toISOString()
    expect(formatDate(yesterday)).toBe('Yesterday')
  })

  it('returns a formatted month+day for older dates', () => {
    const older = new Date('2026-01-15T09:00:00.000Z').toISOString()
    const result = formatDate(older)
    expect(result).toMatch(/January 15/)
  })
})

describe('formatLastEdited', () => {
  it('returns a string with year, month, day, and time', () => {
    const iso = new Date('2026-03-19T14:30:00.000Z').toISOString()
    const result = formatLastEdited(iso)
    expect(result).toMatch(/2026/)
    expect(result).toMatch(/March/)
    expect(result).toMatch(/19/)
  })

  it('returns a non-empty string for any valid ISO date', () => {
    const result = formatLastEdited(new Date('2025-06-01T00:00:00Z').toISOString())
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('generateId', () => {
  it('returns a non-empty string', () => {
    expect(typeof generateId()).toBe('string')
    expect(generateId().length).toBeGreaterThan(0)
  })

  it('returns unique values on each call', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))
    expect(ids.size).toBe(100)
  })
})
