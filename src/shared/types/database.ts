export type CurrencyType = "fiat" | "crypto";
export type HolderStatus = "active" | "inactive";
export type AccountType = "bank" | "crypto" | "betting";
export type AccountStatus = "active" | "inactive" | "blocked" | "closed";

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  type: CurrencyType;
  decimal_places: number;
  last_rate_brl: number;
  created_at: string;
  updated_at: string;
}

export interface Holder {
  id: string;
  operator_id: string;
  name: string;
  notes: string | null;
  status: HolderStatus;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  operator_id: string;
  holder_id: string;
  name: string;
  type: AccountType;
  institution: string;
  default_currency_id: string;
  initial_balance_date: string;
  status: AccountStatus;
  masked_identifier: string | null;
  operational_limit: number | null;
  notes: string | null;
  preferred_network: string | null;
  deposit_methods: string | null;
  withdrawal_methods: string | null;
  pending_balance: number;
  created_at: string;
  updated_at: string;
}

export interface AccountCurrency {
  id: string;
  account_id: string;
  currency_id: string;
  initial_balance: number;
  calculated_balance: number;
  created_at: string;
  updated_at: string;
}

export interface AccountCurrencyWithDetails extends AccountCurrency {
  currency: Currency;
}

export interface AccountWithDetails extends Account {
  holder: Pick<Holder, "id" | "name" | "status">;
  default_currency: Currency;
  balances: AccountCurrencyWithDetails[];
}

export interface HolderWithStats extends Holder {
  account_count: number;
}

export type MovementType =
  | "capital_deposit"
  | "capital_withdrawal"
  | "transfer"
  | "conversion"
  | "cashback"
  | "bonus"
  | "fee"
  | "balance_adjustment";

export type MovementDirection = "credit" | "debit";
export type MovementStatus = "pending" | "completed" | "cancelled" | "failed";

export interface Movement {
  id: string;
  operator_id: string;
  type: MovementType;
  account_id: string;
  counter_account_id: string | null;
  currency_id: string;
  amount: number;
  direction: MovementDirection;
  status: MovementStatus;
  occurred_at: string;
  description: string | null;
  external_id: string | null;
  transfer_group_id: string | null;
  exchange_rate: number;
  amount_brl: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MovementWithDetails extends Movement {
  account: Pick<Account, "id" | "name" | "type" | "holder_id"> & {
    holder: Pick<Holder, "id" | "name">;
  };
  counter_account: Pick<Account, "id" | "name"> | null;
  currency: Currency;
}

export interface PendingTransfer extends MovementWithDetails {
  credit_movement: Movement | null;
}