export const createExcelTemplate = async (tripName: string, members: string[]) => {
  const XLSX = await import('xlsx');
  
  const workbook = XLSX.utils.book_new();
  
  // Template expenses with examples
  const templateExpenses = [
    {
      Date: '2024-01-01',
      'Paid By': members[0] || 'Member1',
      Amount: 1000,
      Beneficiaries: members.slice(0, 2).join(', ') || 'Member1, Member2',
      'Is Gift': 'No',
      'Gift To': '',
      'Split Type': 'equal',
      'Split Data': '',
      Notes: 'Example expense - equal split'
    },
    {
      Date: '2024-01-02', 
      'Paid By': members[1] || 'Member2',
      Amount: 2000,
      Beneficiaries: members.join(', ') || 'Member1, Member2',
      'Is Gift': 'No',
      'Gift To': '',
      'Split Type': 'percentage',
      'Split Data': members.length >= 2 ? `${members[0]}:50,${members[1]}:50` : 'Member1:50,Member2:50',
      Notes: 'Example expense - percentage split'
    },
    {
      Date: '2024-01-03',
      'Paid By': members[0] || 'Member1', 
      Amount: 500,
      Beneficiaries: '',
      'Is Gift': 'Yes',
      'Gift To': members[1] || 'Member2',
      'Split Type': '',
      'Split Data': '',
      Notes: 'Example gift'
    }
  ];
  
  const expensesSheet = XLSX.utils.json_to_sheet(templateExpenses);
  XLSX.utils.book_append_sheet(workbook, expensesSheet, 'Expenses');
  
  // Instructions sheet
  const instructions = [
    { Field: 'Date', Format: 'YYYY-MM-DD', Example: '2024-01-15', Required: 'Yes' },
    { Field: 'Paid By', Format: 'Member name', Example: members[0] || 'Alice', Required: 'Yes' },
    { Field: 'Amount', Format: 'Number', Example: '1500.50', Required: 'Yes' },
    { Field: 'Beneficiaries', Format: 'Member1, Member2', Example: members.slice(0, 2).join(', ') || 'Alice, Bob', Required: 'For regular expenses' },
    { Field: 'Is Gift', Format: 'Yes/No', Example: 'No', Required: 'Yes' },
    { Field: 'Gift To', Format: 'Member name', Example: members[1] || 'Bob', Required: 'For gifts only' },
    { Field: 'Split Type', Format: 'equal/percentage/weight', Example: 'percentage', Required: 'For non-equal splits' },
    { Field: 'Split Data', Format: 'Member:Value,Member:Value', Example: `${members[0] || 'Alice'}:60,${members[1] || 'Bob'}:40`, Required: 'For percentage/weight splits' },
    { Field: 'Notes', Format: 'Text', Example: 'Dinner at restaurant', Required: 'No' }
  ];
  
  const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');
  
  // Members sheet
  const membersData = members.map((member, index) => ({ 'Member Name': member, 'Index': index + 1 }));
  const membersSheet = XLSX.utils.json_to_sheet(membersData);
  XLSX.utils.book_append_sheet(workbook, membersSheet, 'Members');
  
  XLSX.writeFile(workbook, `${tripName.replace(/[^a-zA-Z0-9]/g, '_')}_template.xlsx`);
};

export const validateExcelData = (data: any[]): { isValid: boolean; errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!data || data.length === 0) {
    errors.push('No data found in Excel file');
    return { isValid: false, errors, warnings };
  }
  
  data.forEach((row, index) => {
    const rowNum = index + 1;
    
    // Required fields validation
    if (!row.Date) errors.push(`Row ${rowNum}: Date is required`);
    if (!row['Paid By']) errors.push(`Row ${rowNum}: Paid By is required`);
    if (!row.Amount || isNaN(parseFloat(row.Amount))) errors.push(`Row ${rowNum}: Valid amount is required`);
    
    // Gift validation
    const isGift = row['Is Gift']?.toLowerCase() === 'yes';
    if (isGift) {
      if (!row['Gift To']) errors.push(`Row ${rowNum}: Gift To is required for gifts`);
      if (row.Beneficiaries) warnings.push(`Row ${rowNum}: Beneficiaries ignored for gifts`);
    } else {
      if (!row.Beneficiaries) errors.push(`Row ${rowNum}: Beneficiaries required for regular expenses`);
    }
    
    // Split type validation
    const splitType = row['Split Type']?.toLowerCase();
    if (splitType && !['equal', 'percentage', 'weight'].includes(splitType)) {
      errors.push(`Row ${rowNum}: Invalid split type. Use: equal, percentage, or weight`);
    }
    
    // Split data validation for percentage
    if (splitType === 'percentage' && row['Split Data']) {
      try {
        const splitPairs = row['Split Data'].split(',');
        let total = 0;
        splitPairs.forEach((pair: string) => {
          const [, value] = pair.split(':');
          total += parseFloat(value) || 0;
        });
        if (Math.abs(total - 100) > 0.01) {
          errors.push(`Row ${rowNum}: Percentage split must total 100% (currently ${total}%)`);
        }
      } catch (e) {
        errors.push(`Row ${rowNum}: Invalid split data format. Use: Member:Value,Member:Value`);
      }
    }
    
    // Date validation
    if (row.Date && isNaN(Date.parse(row.Date))) {
      errors.push(`Row ${rowNum}: Invalid date format. Use YYYY-MM-DD`);
    }
  });
  
  return { isValid: errors.length === 0, errors, warnings };
};