export type Person = 'mane' | 'myriem'

export const CATEGORIES = [
  'Maison',
  'Vacances',
  'Courses',
  'Restau',
  'Bar',
  'Culture',
  'Transport',
  'Santé',
  'Autre',
] as const

export type Category = typeof CATEGORIES[number]

export const CATEGORY_COLORS: Record<Category, string> = {
  Maison: '#6366f1',
  Vacances: '#f59e0b',
  Courses: '#10b981',
  Restau: '#ef4444',
  Bar: '#8b5cf6',
  Culture: '#06b6d4',
  Transport: '#f97316',
  Santé: '#84cc16',
  Autre: '#6b7280',
}

export interface Expense {
  id: string
  year: number
  month: number
  amount: number
  description: string
  category: Category
  paid_by: Person
  labels: string[]
  created_at: string
}

export interface Income {
  id: string
  year: number
  month: number
  mane_income: number
  myriem_income: number
  created_at: string
}

export interface Settlement {
  id: string
  year: number
  month: number
  amount: number
  from_person: Person
  to_person: Person
  settled_at: string
}

export const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

export const DEFAULT_SHARES: Record<Person, number> = {
  mane: 0.62,
  myriem: 0.38,
}

// Calcule les parts selon les revenus, ou utilise les parts par défaut
export function computeShares(income: Income | null): Record<Person, number> {
  if (!income) return DEFAULT_SHARES
  const total = income.mane_income + income.myriem_income
  if (total === 0) return DEFAULT_SHARES
  return {
    mane: income.mane_income / total,
    myriem: income.myriem_income / total,
  }
}

// Calcule le bilan pour un mois donné
export interface MonthBalance {
  mane_paid: number
  myriem_paid: number
  total: number
  mane_due: number   // ce que Mane devrait payer selon sa part
  myriem_due: number
  mane_share: number
  myriem_share: number
  // Qui doit combien à qui
  debtor: Person | null
  creditor: Person | null
  debt_amount: number
}

export function computeMonthBalance(
  expenses: Expense[],
  income: Income | null
): MonthBalance {
  const shares = computeShares(income)
  const mane_paid = expenses.filter(e => e.paid_by === 'mane').reduce((s, e) => s + e.amount, 0)
  const myriem_paid = expenses.filter(e => e.paid_by === 'myriem').reduce((s, e) => s + e.amount, 0)
  const total = mane_paid + myriem_paid
  const mane_due = total * shares.mane
  const myriem_due = total * shares.myriem

  // Mane a avancé mane_paid, devrait payer mane_due
  // Si mane_paid > mane_due → Myriem doit de l'argent à Mane
  const mane_balance = mane_paid - mane_due // positif = Myriem doit à Mane

  let debtor: Person | null = null
  let creditor: Person | null = null
  let debt_amount = 0

  if (Math.abs(mane_balance) > 0.01) {
    if (mane_balance > 0) {
      debtor = 'myriem'
      creditor = 'mane'
      debt_amount = mane_balance
    } else {
      debtor = 'mane'
      creditor = 'myriem'
      debt_amount = Math.abs(mane_balance)
    }
  }

  return {
    mane_paid,
    myriem_paid,
    total,
    mane_due,
    myriem_due,
    mane_share: shares.mane,
    myriem_share: shares.myriem,
    debtor,
    creditor,
    debt_amount,
  }
}
