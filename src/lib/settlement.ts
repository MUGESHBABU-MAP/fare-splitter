export interface Expense {
  id: string;
  expense_date: string;
  paid_by: string;
  amount: number;
  beneficiaries: string[];
  is_gift: boolean;
  gift_to: string[];
  joint_treat_shares?: Record<string, number>;
  split_type?: 'equal' | 'percentage' | 'weight';
  split_data?: Record<string, number>;
  notes: string;
}

export interface MemberBalance {
  paid: number;
  owes: number;
  balance: number;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export const calculateBalances = (members: string[], expenses: Expense[]): Record<string, MemberBalance> => {
  const balances: Record<string, MemberBalance> = {};
  
  // Initialize balances
  members.forEach(member => {
    balances[member] = { paid: 0, owes: 0, balance: 0 };
  });

  expenses.forEach(expense => {
    // Handle joint treat shares
    if (expense.joint_treat_shares && Object.keys(expense.joint_treat_shares).length > 0) {
      // Multiple sponsors case
      Object.entries(expense.joint_treat_shares).forEach(([sponsor, share]) => {
        if (balances[sponsor] && share > 0) {
          balances[sponsor].paid += share;
        }
      });
    } else {
      // Single payer case
      if (balances[expense.paid_by]) {
        balances[expense.paid_by].paid += expense.amount;
      }
    }

    // Calculate what each person owes
    if (expense.is_gift) {
      // For gifts, no one owes anything - it's a pure gift
      // Gift recipients don't owe the gift amount
    } else {
      // Regular expense split among beneficiaries
      if (expense.beneficiaries.length > 0) {
        let totalOwed = 0;
        
        if (expense.split_type === 'percentage' && expense.split_data) {
          // Percentage-based split
          expense.beneficiaries.forEach(beneficiary => {
            if (balances[beneficiary] && expense.split_data![beneficiary]) {
              const owedAmount = (expense.amount * expense.split_data[beneficiary]) / 100;
              balances[beneficiary].owes += owedAmount;
              totalOwed += owedAmount;
            }
          });
        } else if (expense.split_type === 'weight' && expense.split_data) {
          // Weight-based split
          const totalWeight = expense.beneficiaries.reduce((sum, member) => {
            return sum + (expense.split_data![member] || 1);
          }, 0);
          
          expense.beneficiaries.forEach(beneficiary => {
            if (balances[beneficiary]) {
              const weight = expense.split_data![beneficiary] || 1;
              const owedAmount = (expense.amount * weight) / totalWeight;
              balances[beneficiary].owes += owedAmount;
              totalOwed += owedAmount;
            }
          });
        } else {
          // Equal split (default)
          const sharePerBeneficiary = expense.amount / expense.beneficiaries.length;
          expense.beneficiaries.forEach(beneficiary => {
            if (balances[beneficiary]) {
              balances[beneficiary].owes += sharePerBeneficiary;
              totalOwed += sharePerBeneficiary;
            }
          });
        }
      }
    }
  });

  // Calculate final balances
  Object.keys(balances).forEach(member => {
    balances[member].balance = balances[member].paid - balances[member].owes;
  });

  return balances;
};

export const calculateSettlements = (balances: Record<string, MemberBalance>): Settlement[] => {
  const settlements: Settlement[] = [];
  
  // Create arrays of creditors (positive balance) and debtors (negative balance)
  const creditors = Object.entries(balances)
    .filter(([_, balance]) => balance.balance > 0.01)
    .map(([member, balance]) => ({ member, amount: balance.balance }))
    .sort((a, b) => b.amount - a.amount);
    
  const debtors = Object.entries(balances)
    .filter(([_, balance]) => balance.balance < -0.01)
    .map(([member, balance]) => ({ member, amount: Math.abs(balance.balance) }))
    .sort((a, b) => b.amount - a.amount);

  // Settle debts using greedy algorithm
  let i = 0, j = 0;
  
  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    
    const settleAmount = Math.min(creditor.amount, debtor.amount);
    
    if (settleAmount > 0.01) {
      settlements.push({
        from: debtor.member,
        to: creditor.member,
        amount: Math.round(settleAmount * 100) / 100
      });
    }
    
    creditor.amount -= settleAmount;
    debtor.amount -= settleAmount;
    
    if (creditor.amount < 0.01) i++;
    if (debtor.amount < 0.01) j++;
  }
  
  return settlements;
};

export const exportToExcel = async (tripName: string, members: string[], expenses: Expense[], balances: Record<string, MemberBalance>, settlements: Settlement[]) => {
  const XLSX = await import('xlsx');
  
  const workbook = XLSX.utils.book_new();
  
  // Expenses sheet - compatible with import format
  const expensesData = expenses.map(expense => {
    let splitData = '';
    if (expense.split_type !== 'equal' && expense.split_data) {
      splitData = Object.entries(expense.split_data)
        .map(([member, value]) => `${member}:${value}`)
        .join(',');
    }
    
    return {
      Date: expense.expense_date,
      'Paid By': expense.paid_by,
      Amount: expense.amount,
      Beneficiaries: expense.beneficiaries.join(', '),
      'Is Gift': expense.is_gift ? 'Yes' : 'No',
      'Gift To': expense.gift_to.join(', '),
      'Split Type': expense.split_type || 'equal',
      'Split Data': splitData,
      Notes: expense.notes
    };
  });
  
  const expensesSheet = XLSX.utils.json_to_sheet(expensesData);
  XLSX.utils.book_append_sheet(workbook, expensesSheet, 'Expenses');
  
  // Summary sheet
  const summaryData = members.map(member => ({
    Member: member,
    'Total Paid': balances[member]?.paid || 0,
    'Total Owes': balances[member]?.owes || 0,
    Balance: balances[member]?.balance || 0
  }));
  
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  
  // Settlements sheet
  const settlementsData = settlements.map(settlement => ({
    From: settlement.from,
    To: settlement.to,
    Amount: settlement.amount
  }));
  
  const settlementsSheet = XLSX.utils.json_to_sheet(settlementsData);
  XLSX.utils.book_append_sheet(workbook, settlementsSheet, 'Settlements');
  
  // Download file
  XLSX.writeFile(workbook, `${tripName.replace(/[^a-zA-Z0-9]/g, '_')}_expenses.xlsx`);
};