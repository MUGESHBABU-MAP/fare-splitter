import Dexie, { Table } from 'dexie';

export interface LocalTrip {
  id?: number;
  name: string;
  members: string[];
  created_at: Date;
  updated_at: Date;
}

export interface LocalExpense {
  id?: number;
  trip_id: number;
  expense_date: Date;
  paid_by: string;
  amount: number;
  beneficiaries: string[];
  is_gift: boolean;
  gift_to: string[];
  joint_treat_shares?: Record<string, number>;
  notes: string;
  created_at: Date;
}

export class TripDatabase extends Dexie {
  trips!: Table<LocalTrip>;
  expenses!: Table<LocalExpense>;

  constructor() {
    super('TripExpenseDB');
    this.version(1).stores({
      trips: '++id, name, created_at',
      expenses: '++id, trip_id, expense_date, paid_by'
    });
  }
}

export const db = new TripDatabase();