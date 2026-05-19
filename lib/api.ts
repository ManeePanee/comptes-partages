import { supabase } from './supabase'
import type { Expense, Income, Settlement, Category, Person } from '@/types'

// --- EXPENSES ---

export async function getExpenses(year: number, month: number): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getAllExpenses(): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('year', { ascending: false })
    .order('month', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function addExpense(expense: Omit<Expense, 'id' | 'created_at'>): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .insert(expense)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error
}

export async function updateExpenseLabels(id: string, labels: string[]): Promise<void> {
  const { error } = await supabase.from('expenses').update({ labels }).eq('id', id)
  if (error) throw error
}

// --- INCOMES ---

export async function getIncome(year: number, month: number): Promise<Income | null> {
  const { data, error } = await supabase
    .from('incomes')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getAllIncomes(): Promise<Income[]> {
  const { data, error } = await supabase
    .from('incomes')
    .select('*')
    .order('year', { ascending: false })
    .order('month', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function upsertIncome(
  year: number,
  month: number,
  mane_income: number,
  myriem_income: number
): Promise<Income> {
  const { data, error } = await supabase
    .from('incomes')
    .upsert({ year, month, mane_income, myriem_income }, { onConflict: 'year,month' })
    .select()
    .single()
  if (error) throw error
  return data
}

// --- SETTLEMENTS ---

export async function getSettlement(year: number, month: number): Promise<Settlement | null> {
  const { data, error } = await supabase
    .from('settlements')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getAllSettlements(): Promise<Settlement[]> {
  const { data, error } = await supabase
    .from('settlements')
    .select('*')
    .order('year', { ascending: false })
    .order('month', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function settleMonth(
  year: number,
  month: number,
  amount: number,
  from_person: Person,
  to_person: Person
): Promise<Settlement> {
  const { data, error } = await supabase
    .from('settlements')
    .upsert(
      { year, month, amount, from_person, to_person, settled_at: new Date().toISOString() },
      { onConflict: 'year,month' }
    )
    .select()
    .single()
  if (error) throw error
  return data
}

export async function unsettleMonth(year: number, month: number): Promise<void> {
  const { error } = await supabase
    .from('settlements')
    .delete()
    .eq('year', year)
    .eq('month', month)
  if (error) throw error
}
