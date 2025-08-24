import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, Upload, Calculator, TrendingUp, TrendingDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { calculateBalances, calculateSettlements, exportToExcel, type Expense } from "@/lib/settlement";

interface ExpenseSummaryProps {
  tripName: string;
  members: string[];
  expenses: Expense[];
  onImportExpenses?: (expenses: Expense[]) => void;
}

const ExpenseSummary = ({ tripName, members, expenses, onImportExpenses }: ExpenseSummaryProps) => {
  const { toast } = useToast();
  const balances = calculateBalances(members, expenses);
  const settlements = calculateSettlements(balances);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const handleExport = async () => {
    await exportToExcel(tripName, members, expenses, balances, settlements);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onImportExpenses) return;

    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets['Expenses'];
      
      if (!worksheet) {
        toast({
          title: "Import Error",
          description: "No 'Expenses' sheet found in the file",
          variant: "destructive"
        });
        return;
      }

      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      const importedExpenses: Expense[] = jsonData.map((row: any, index) => ({
        id: `imported-${Date.now()}-${index}`,
        expense_date: new Date(row.Date).toISOString().split('T')[0],
        paid_by: row['Paid By'] || '',
        amount: parseFloat(row.Amount) || 0,
        beneficiaries: row.Beneficiaries ? row.Beneficiaries.split(', ') : [],
        is_gift: row['Is Gift'] === 'Yes',
        gift_to: row['Gift To'] ? row['Gift To'].split(', ') : [],
        notes: row.Notes || ''
      }));

      onImportExpenses(importedExpenses);
      toast({
        title: "Import Successful",
        description: `Imported ${importedExpenses.length} expenses`
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Error",
        description: "Failed to import expenses from file",
        variant: "destructive"
      });
    }

    // Reset file input
    event.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold">₹{totalExpenses.toLocaleString()}</p>
              </div>
              <Calculator className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{expenses.length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Settlements Needed</p>
                <p className="text-2xl font-bold">{settlements.length}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Member Balances */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Member Balances</CardTitle>
          <div className="flex gap-2">
            {onImportExpenses && (
              <>
                <Input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImport}
                  className="hidden"
                  id="import-file"
                />
                <Button variant="outline" size="sm" asChild>
                  <label htmlFor="import-file" className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Import Excel
                  </label>
                </Button>
              </>
            )}
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member) => {
              const balance = balances[member];
              if (!balance) return null;
              
              return (
                <div key={member} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="font-medium">{member}</div>
                    <Badge 
                      variant={balance.balance > 0 ? "default" : balance.balance < 0 ? "destructive" : "secondary"}
                    >
                      {balance.balance > 0 ? "Gets back" : balance.balance < 0 ? "Owes" : "Settled"}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-lg">
                      ₹{Math.abs(balance.balance).toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Paid: ₹{balance.paid.toFixed(2)} | Share: ₹{balance.owes.toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Settlements */}
      {settlements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Settlement Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {settlements.map((settlement, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{settlement.from}</span>
                    <span className="text-muted-foreground">owes</span>
                    <span className="font-medium">{settlement.to}</span>
                  </div>
                  <div className="font-semibold text-lg text-primary">
                    ₹{settlement.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length > 0 ? (
            <div className="space-y-3">
              {expenses.slice(0, 10).map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">₹{expense.amount.toFixed(2)}</span>
                      {expense.is_gift && (
                        <Badge variant="secondary" className="text-xs">Gift</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Paid by {expense.paid_by} • {new Date(expense.expense_date).toLocaleDateString()}
                    </div>
                    {expense.notes && (
                      <div className="text-sm text-muted-foreground mt-1">{expense.notes}</div>
                    )}
                  </div>
                  <div className="text-right text-sm">
                    {expense.is_gift ? (
                      <div>Gift to: {expense.gift_to.join(', ')}</div>
                    ) : (
                      <div>Split among {expense.beneficiaries.length} people</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No expenses added yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseSummary;