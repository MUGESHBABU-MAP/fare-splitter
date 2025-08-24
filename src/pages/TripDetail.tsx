import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Users, Calculator, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ExpenseForm from "@/components/expense/ExpenseForm";
import ExpenseSummary from "@/components/expense/ExpenseSummary";
import type { Database } from "@/integrations/supabase/types";

type DbTrip = Database['public']['Tables']['trips']['Row'];
type DbExpense = Database['public']['Tables']['expenses']['Row'];

interface Trip {
  id: string;
  name: string;
  member_count: number;
  members: string[];
  created_at: string;
  updated_at: string;
}

interface Expense {
  id: string;
  expense_date: string;
  paid_by: string;
  amount: number;
  beneficiaries: string[];
  is_gift: boolean;
  gift_to: string[];
  joint_treat_shares?: Record<string, number> | null;
  notes: string;
}

const TripDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTripData();
    }
  }, [id]);

  const fetchTripData = async () => {
    try {
      // Fetch trip details
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', id)
        .single();

      if (tripError) throw tripError;
      
      // Transform trip data
      const transformedTrip: Trip = {
        ...tripData,
        members: Array.isArray(tripData.members) ? tripData.members.filter(m => typeof m === 'string') as string[] : []
      };
      setTrip(transformedTrip);

      // Fetch expenses for this trip
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('trip_id', id)
        .order('expense_date', { ascending: false });

      if (expensesError) throw expensesError;
      
      // Transform expenses data
      const transformedExpenses: Expense[] = (expensesData || []).map(expense => ({
        ...expense,
        beneficiaries: Array.isArray(expense.beneficiaries) ? expense.beneficiaries.filter(b => typeof b === 'string') as string[] : [],
        gift_to: Array.isArray(expense.gift_to) ? expense.gift_to.filter(g => typeof g === 'string') as string[] : [],
        notes: expense.notes || ''
      }));
      setExpenses(transformedExpenses);
    } catch (error) {
      console.error('Error fetching trip data:', error);
      toast({
        title: "Error loading trip",
        description: "Failed to load trip details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (expenseData: any) => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          trip_id: id!,
          expense_date: expenseData.expense_date.toISOString().split('T')[0],
          paid_by: expenseData.paid_by,
          amount: expenseData.amount,
          beneficiaries: expenseData.beneficiaries,
          is_gift: expenseData.is_gift,
          gift_to: expenseData.gift_to || [],
          joint_treat_shares: expenseData.joint_treat_shares || null,
          notes: expenseData.notes || ''
        })
        .select()
        .single();

      if (error) throw error;

      // Transform and add to local state
      const newExpense: Expense = {
        ...data,
        beneficiaries: Array.isArray(data.beneficiaries) ? data.beneficiaries.filter(b => typeof b === 'string') as string[] : [],
        gift_to: Array.isArray(data.gift_to) ? data.gift_to.filter(g => typeof g === 'string') as string[] : [],
        notes: data.notes || ''
      };
      
      setExpenses(prev => [newExpense, ...prev]);
      setShowExpenseForm(false);
      
      toast({
        title: "Expense added successfully!",
        description: `₹${expenseData.amount} expense recorded`
      });
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: "Error adding expense",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const handleImportExpenses = async (importedExpenses: Expense[]) => {
    try {
      // Insert imported expenses into database
      const expensesToInsert = importedExpenses.map(expense => ({
        trip_id: id!,
        expense_date: expense.expense_date,
        paid_by: expense.paid_by,
        amount: expense.amount,
        beneficiaries: expense.beneficiaries,
        is_gift: expense.is_gift,
        gift_to: expense.gift_to,
        notes: expense.notes
      }));

      const { data, error } = await supabase
        .from('expenses')
        .insert(expensesToInsert)
        .select();

      if (error) throw error;

      // Transform and add to local state
      const newExpenses: Expense[] = (data || []).map(expense => ({
        ...expense,
        beneficiaries: Array.isArray(expense.beneficiaries) ? expense.beneficiaries.filter(b => typeof b === 'string') as string[] : [],
        gift_to: Array.isArray(expense.gift_to) ? expense.gift_to.filter(g => typeof g === 'string') as string[] : [],
        notes: expense.notes || ''
      }));
      
      setExpenses(prev => [...newExpenses, ...prev]);
      
      toast({
        title: "Import successful!",
        description: `Added ${newExpenses.length} expenses to the trip`
      });
    } catch (error) {
      console.error('Error importing expenses:', error);
      toast({
        title: "Import failed",
        description: "Could not import expenses to database",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Trip not found</h1>
          <Button asChild>
            <Link to="/trips">Back to Trips</Link>
          </Button>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="outline" asChild className="mb-4">
            <Link to="/trips">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Trips
            </Link>
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-hero bg-clip-text text-transparent">
                {trip.name}
              </h1>
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {trip.member_count} members
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calculator className="w-3 h-3" />
                  ₹{totalExpenses.toLocaleString()} total
                </Badge>
              </div>
            </div>
            <Dialog open={showExpenseForm} onOpenChange={setShowExpenseForm}>
              <DialogTrigger asChild>
                <Button variant="hero">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <ExpenseForm
                  members={trip.members}
                  onSubmit={handleAddExpense}
                  onCancel={() => setShowExpenseForm(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Expense Summary */}
        <ExpenseSummary
          tripName={trip.name}
          members={trip.members}
          expenses={expenses}
          onImportExpenses={handleImportExpenses}
        />
      </div>
    </div>
  );
};

export default TripDetail;