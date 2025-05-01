export type Debtor = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  cell_phone: string | null
  birthday: string
  address: string
  city: string
  state: string
  zip: number
  loan_number: number
  account_number: number
  created_at: string
}

export type Debt = {
  id: string
  debtor_id: string
  loan_number: number
  account_number: number
  loan_type: string
  loan_amount: number
  loan_frequency: string
  loan_schedule: string
  balance: number
  amount_due: number
  payment_amount: number
  payoff_amount: number
  late_fees: number
  apr: number
  high_credit: number
  last_payment_amount: number
  amount_promised: number
  date_promise_to_pay: string | null
  date_loan_made: string
  date_first_payment: string
  date_contract_due: string
  writeoff: string | null
  bankrupt: boolean
  judgement_filed: boolean
  security: string
  created_at: string
}

export type Payment = {
  id: string
  debt_id: string
  amount: number
  payment_date: string
  payment_method: string
  transaction_id: string | null
  status: string
  created_at: string
  notes: string | null
}

export type Verification = {
  id: string
  user_id: string
  debtor_id: string | null
  verified: boolean
  verification_date: string | null
  verification_method: string | null
  created_at: string
  updated_at: string
}

export type UserProfile = {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  last_sign_in: string | null
  created_at: string
  updated_at: string
}
