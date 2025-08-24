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
    split_type: 'equal',
    notes: 'Hotel booking - Equal split'
  },
  {
    id: '2',
    expense_date: '2024-01-02',
    paid_by: 'Bob',
    amount: 2000,
    beneficiaries: ['Alice', 'Bob', 'Charlie'],
    is_gift: false,
    gift_to: [],
    split_type: 'percentage',
    split_data: { 'Alice': 50, 'Bob': 30, 'Charlie': 20 },
    notes: 'Lunch - Percentage split (50%, 30%, 20%)'
  },
  {
    id: '3',
    expense_date: '2024-01-03',
    paid_by: 'Alice',
    amount: 3000,
    beneficiaries: ['Alice', 'Bob', 'Charlie'],
    is_gift: false,
    gift_to: [],
    split_type: 'weight',
    split_data: { 'Alice': 1, 'Bob': 2, 'Charlie': 3 },
    notes: 'Dinner - Weight split (1x, 2x, 3x)'
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
  },
  {
    id: '5',
    expense_date: '2024-01-05',
    paid_by: 'Alice',
    amount: 2600,
    beneficiaries: ['Alice', 'Bob'],
    is_gift: false,
    gift_to: [],
    joint_treat_shares: { 'Alice': 1600, 'Bob': 1000 },
    split_type: 'equal',
    notes: 'Joint treat - Alice ₹1600, Bob ₹1000'
  }
];

export const runCalculationTests = () => {
  console.log('🧪 Running Enhanced Expense Calculation Tests...\n');
  console.log('📋 Test Scenarios:');
  console.log('1. Equal split: ₹10,000 hotel among 4 people');
  console.log('2. Percentage split: ₹2,000 lunch (50%, 30%, 20%)');
  console.log('3. Weight split: ₹3,000 dinner (1x, 2x, 3x)');
  console.log('4. Gift: ₹500 gift to Diana');
  console.log('5. Joint treat: ₹2,600 (Alice ₹1,600 + Bob ₹1,000)\n');
  
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