import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Users, Calculator, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  notes: string;
}

const TripDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

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

  const calculateSummary = () => {
    if (!trip) return { totalExpenses: 0, memberBalances: {} };
    
    const memberBalances: Record<string, { paid: number; owes: number }> = {};
    
    // Initialize balances for all members
    trip.members.forEach(member => {
      memberBalances[member] = { paid: 0, owes: 0 };
    });

    let totalExpenses = 0;

    expenses.forEach(expense => {
      totalExpenses += expense.amount;
      
      // Add to paid amount for the person who paid
      if (memberBalances[expense.paid_by]) {
        memberBalances[expense.paid_by].paid += expense.amount;
      }

      // Calculate what each beneficiary owes
      if (!expense.is_gift && expense.beneficiaries.length > 0) {
        const sharePerPerson = expense.amount / expense.beneficiaries.length;
        expense.beneficiaries.forEach(beneficiary => {
          if (memberBalances[beneficiary]) {
            memberBalances[beneficiary].owes += sharePerPerson;
          }
        });
      }
    });

    return { totalExpenses, memberBalances };
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

  const { totalExpenses, memberBalances } = calculateSummary();

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
            <Button variant="hero">
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Members Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {trip.members.map((member, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                    <span className="font-medium">{member}</span>
                    <div className="text-sm text-muted-foreground">
                      {memberBalances[member] && (
                        <span>
                          Paid: ₹{memberBalances[member].paid.toFixed(0)} | 
                          Owes: ₹{memberBalances[member].owes.toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Expenses */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              {expenses.length > 0 ? (
                <div className="space-y-3">
                  {expenses.slice(0, 5).map((expense) => (
                    <div key={expense.id} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <div className="font-medium">₹{expense.amount}</div>
                        <div className="text-sm text-muted-foreground">
                          Paid by {expense.paid_by} • {new Date(expense.expense_date).toLocaleDateString()}
                        </div>
                        {expense.notes && (
                          <div className="text-sm text-muted-foreground">{expense.notes}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm">
                          {expense.is_gift ? `Gift to ${expense.gift_to.join(', ')}` : `Split among ${expense.beneficiaries.length}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No expenses added yet</p>
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Expense
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TripDetail;