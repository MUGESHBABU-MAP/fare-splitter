import { calculateBalances, calculateSettlements, type Expense } from './settlement';

// Test data for validation
const testMembers = ['Alice', 'Bob', 'Charlie', 'Diana'];

const testExpenses: Expense[] = [
  {
    id: '1',
    expense_date: '2024-01-01',
    paid_by: 'Alice',
    amount: 10000,
    beneficiaries: ['Alice', 'Bob', 'Charlie', 'Diana'],
    is_gift: false,
    gift_to: [],
    notes: 'Hotel booking'
  },
  {
    id: '2',
    expense_date: '2024-01-02',
    paid_by: 'Bob',
    amount: 2000,
    beneficiaries: ['Alice', 'Bob', 'Charlie'],
    is_gift: false,
    gift_to: [],
    notes: 'Lunch for 3'
  },
  {
    id: '3',
    expense_date: '2024-01-03',
    paid_by: 'Alice',
    amount: 2600,
    beneficiaries: ['Alice', 'Bob'],
    is_gift: false,
    gift_to: [],
    joint_treat_shares: { 'Alice': 1600, 'Bob': 1000 },
    notes: 'Joint treat - Alice 1600, Bob 1000'
  },
  {
    id: '4',
    expense_date: '2024-01-04',
    paid_by: 'Charlie',
    amount: 500,
    beneficiaries: [],
    is_gift: true,
    gift_to: ['Diana'],
    notes: 'Gift for Diana'
  }
];

export const runCalculationTests = () => {
  console.log('🧪 Running Expense Calculation Tests...\n');
  
  const balances = calculateBalances(testMembers, testExpenses);
  const settlements = calculateSettlements(balances);
  
  console.log('📊 Member Balances:');
  testMembers.forEach(member => {
    const balance = balances[member];
    console.log(`${member}: Paid ₹${balance.paid.toFixed(2)}, Owes ₹${balance.owes.toFixed(2)}, Balance ₹${balance.balance.toFixed(2)}`);
  });
  
  console.log('\n💰 Settlement Plan:');
  settlements.forEach((settlement, index) => {
    console.log(`${index + 1}. ${settlement.from} owes ${settlement.to} ₹${settlement.amount.toFixed(2)}`);
  });
  
  // Validation checks
  console.log('\n✅ Validation Checks:');
  
  // Check if total paid equals total expenses
  const totalPaid = Object.values(balances).reduce((sum, b) => sum + b.paid, 0);
  const totalExpenses = testExpenses.reduce((sum, e) => sum + e.amount, 0);
  console.log(`Total Paid: ₹${totalPaid.toFixed(2)}, Total Expenses: ₹${totalExpenses.toFixed(2)} - ${totalPaid === totalExpenses ? '✅' : '❌'}`);
  
  // Check if balances sum to zero
  const totalBalance = Object.values(balances).reduce((sum, b) => sum + b.balance, 0);
  console.log(`Total Balance Sum: ₹${totalBalance.toFixed(2)} - ${Math.abs(totalBalance) < 0.01 ? '✅' : '❌'}`);
  
  // Check settlement amounts
  const totalSettlements = settlements.reduce((sum, s) => sum + s.amount, 0);
  const totalNegativeBalances = Object.values(balances)
    .filter(b => b.balance < 0)
    .reduce((sum, b) => sum + Math.abs(b.balance), 0);
  console.log(`Settlement Total: ₹${totalSettlements.toFixed(2)}, Expected: ₹${totalNegativeBalances.toFixed(2)} - ${Math.abs(totalSettlements - totalNegativeBalances) < 0.01 ? '✅' : '❌'}`);
  
  console.log('\n🎉 All tests completed!');
  
  return { balances, settlements, totalExpenses };
};