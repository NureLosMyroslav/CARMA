import { supabase } from '@/lib/supabase'

export interface Car {
  id: string
  user_id: string
  make: string
  model: string
  year: number
  mileage: number
  fuel_type: string
  transmission: string
  created_at: string
  updated_at: string
}

export type CarInput = Pick<
  Car,
  'make' | 'model' | 'year' | 'mileage' | 'fuel_type' | 'transmission'
>

export async function listCars(): Promise<Car[]> {
  const { data, error } = await supabase
    .from('cars')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Car[]
}

export async function getCar(id: string): Promise<Car> {
  const { data, error } = await supabase
    .from('cars')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Car
}

export async function createCar(input: CarInput): Promise<Car> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('cars')
    .insert({ ...input, user_id: user.id })
    .select()
    .single()

  if (error) throw error
  return data as Car
}

export async function updateCar(id: string, input: CarInput): Promise<Car> {
  const { data, error } = await supabase
    .from('cars')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Car
}

export async function deleteCar(id: string): Promise<void> {
  const { error } = await supabase.from('cars').delete().eq('id', id)
  if (error) throw error
}
