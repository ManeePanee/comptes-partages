import { type Category } from '@/types'

const KEY = 'comptes_category_rules'

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getRules(): Record<string, Category> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  catch { return {} }
}

export function learnFromExpense(description: string, category: Category): void {
  if (typeof window === 'undefined' || !description || category === 'Autre') return
  const rules = getRules()
  const words = normalize(description).split(' ').filter(w => w.length >= 3)
  for (const w of words) rules[w] = category
  try { localStorage.setItem(KEY, JSON.stringify(rules)) } catch {}
}

function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 99
  const row = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let prev = i - 1
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const temp = row[j]
      row[j] = a[i - 1] === b[j - 1]
        ? prev
        : 1 + Math.min(prev, row[j], row[j - 1])
      prev = temp
    }
  }
  return row[b.length]
}

export function smartGuessCategory(description: string): Category | null {
  if (!description || description.length < 3) return null
  const words = normalize(description).split(' ').filter(w => w.length >= 3)
  const rules = getRules()
  if (Object.keys(rules).length === 0) return null

  for (const word of words) {
    if (rules[word]) return rules[word]
  }

  for (const word of words) {
    if (word.length < 5) continue
    for (const [kw, cat] of Object.entries(rules)) {
      if (kw.length < 5) continue
      const maxDist = word.length <= 6 ? 1 : 2
      if (editDistance(word, kw) <= maxDist) return cat
    }
  }

  return null
}
