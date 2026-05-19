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
  'Vêtements',
  'Autre',
] as const

export type Category = typeof CATEGORIES[number]

export const CATEGORY_COLORS: Record<Category, string> = {
  Maison: '#5e7523',
  Vacances: '#f59e0b',
  Courses: '#96b040',
  Restau: '#d43a3a',
  Bar: '#b02424',
  Culture: '#06b6d4',
  Transport: '#f97316',
  Santé: '#906b5a',
  Vêtements: '#8b5cf6',
  Autre: '#ac8b7c',
}

export const SPLIT_TYPES = [
  { value: 'proportional', label: 'Proportionnel', desc: 'Selon les revenus (défaut)' },
  { value: 'equal', label: '50 / 50', desc: 'Chacune paie la moitié' },
  { value: 'full', label: 'Remboursement', desc: "L'autre doit la totalité" },
] as const

export type SplitType = 'proportional' | 'equal' | 'full'

export interface Expense {
  id: string
  year: number
  month: number
  amount: number
  description: string
  category: Category
  paid_by: Person
  split_type: SplitType
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

export function computeShares(income: Income | null): Record<Person, number> {
  if (!income) return DEFAULT_SHARES
  const total = income.mane_income + income.myriem_income
  if (total === 0) return DEFAULT_SHARES
  return {
    mane: income.mane_income / total,
    myriem: income.myriem_income / total,
  }
}

export interface MonthBalance {
  mane_paid: number
  myriem_paid: number
  total: number
  mane_due: number
  myriem_due: number
  mane_share: number
  myriem_share: number
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

  // Calcule ce que chacune doit payer selon le type de split de chaque dépense
  let mane_due = 0
  let myriem_due = 0

  for (const e of expenses) {
    const split = e.split_type ?? 'proportional'
    if (split === 'equal') {
      mane_due += e.amount * 0.5
      myriem_due += e.amount * 0.5
    } else if (split === 'full') {
      // Celle qui n'a pas payé doit tout
      if (e.paid_by === 'mane') {
        myriem_due += e.amount
      } else {
        mane_due += e.amount
      }
    } else {
      // proportional
      mane_due += e.amount * shares.mane
      myriem_due += e.amount * shares.myriem
    }
  }

  const total = mane_paid + myriem_paid
  // mane_balance positif = Myriem doit à Mane
  const mane_balance = mane_paid - mane_due

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
