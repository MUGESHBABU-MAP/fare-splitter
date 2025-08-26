import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Users, ArrowRight, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ImportExpensesDialog from "@/components/trip/ImportExpensesDialog";
import type { Expense } from "@/lib/settlement";

const CreateTrip = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tripName, setTripName] = useState("");
  const [memberCount, setMemberCount] = useState(4);
  const [members, setMembers] = useState<string[]>(["", "", "", ""]);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importedExpenses, setImportedExpenses] = useState<Expense[]>([]);

  const handleMemberCountChange = (count: number) => {
    if (count < 2 || count > 100) return;
    
    const newMembers = [...members];
    if (count > members.length) {
      // Add empty slots
      while (newMembers.length < count) {
        newMembers.push("");
      }
    } else {
      // Remove excess slots
      newMembers.splice(count);
    }
    
    setMemberCount(count);
    setMembers(newMembers);
  };

  const updateMember = (index: number, name: string) => {
    const newMembers = [...members];
    newMembers[index] = name;
    setMembers(newMembers);
  };

  const handleCreateTrip = async () => {
    if (!tripName.trim()) {
      toast({
        title: "Trip name required",
        description: "Please enter a name for your trip",
        variant: "destructive"
      });
      return;
    }

    const filledMembers = members.filter(m => m.trim());
    if (filledMembers.length < 2) {
      toast({
        title: "Need at least 2 members",
        description: "Please add at least 2 member names",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('trips')
        .insert({
          name: tripName.trim(),
          member_count: filledMembers.length,
          members: filledMembers
        })
        .select()
        .single();

      if (error) throw error;

      // Add imported expenses if any
      if (importedExpenses.length > 0) {
        const expensesToInsert = importedExpenses.map(expense => {
          let jointTreatData = null;
          if (!expense.is_gift && expense.split_type !== 'equal' && expense.split_data) {
            jointTreatData = {
              _split_type: expense.split_type,
              _split_data: expense.split_data
            };
          }

          return {
            trip_id: data.id,
            expense_date: expense.expense_date,
            paid_by: expense.paid_by,
            amount: expense.amount,
            beneficiaries: expense.beneficiaries,
            is_gift: expense.is_gift,
            gift_to: expense.gift_to,
            joint_treat_shares: jointTreatData,
            notes: expense.notes
          };
        });

        const { error: expenseError } = await supabase
          .from('expenses')
          .insert(expensesToInsert);

        if (expenseError) {
          console.error('Error adding imported expenses:', expenseError);
          toast({
            title: "Trip created, but import failed",
            description: "You can import expenses later from the trip page",
            variant: "destructive"
          });
        }
      }

      toast({
        title: "Trip created successfully!",
        description: `${tripName} with ${filledMembers.length} members${importedExpenses.length > 0 ? ` and ${importedExpenses.length} imported expenses` : ''}`,
      });

      // Navigate to the created trip
      navigate(`/trip/${data.id}`);
    } catch (error) {
      console.error('Error creating trip:', error);
      toast({
        title: "Error creating trip",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleImportExpenses = (expenses: Expense[], newMembers?: string[]) => {
    setImportedExpenses(expenses);
    
    // Add new members to the trip members list
    if (newMembers && newMembers.length > 0) {
      const updatedMembers = [...members];
      newMembers.forEach(newMember => {
        if (!updatedMembers.includes(newMember)) {
          updatedMembers.push(newMember);
        }
      });
      setMembers(updatedMembers);
      setMemberCount(updatedMembers.length);
    }
    
    toast({
      title: "Expenses ready for import",
      description: `${expenses.length} expenses will be added when you create the trip${newMembers && newMembers.length > 0 ? ` (${newMembers.length} new members added)` : ''}`
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-3 bg-gradient-hero bg-clip-text text-transparent">
              Create New Trip
            </h1>
            <p className="text-muted-foreground text-lg">
              Set up your trip details and add members to get started
            </p>
          </div>

          <Card className="shadow-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Trip Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Trip Name */}
              <div className="space-y-2">
                <Label htmlFor="tripName">Trip Name</Label>
                <Input
                  id="tripName"
                  placeholder="e.g., Goa Beach Trip 2024"
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                  className="text-lg"
                />
              </div>

              <Separator />

              {/* Member Count */}
              <div className="space-y-3">
                <Label>Number of Members</Label>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleMemberCountChange(memberCount - 1)}
                    disabled={memberCount <= 2}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  
                  <Badge variant="secondary" className="px-4 py-2 text-lg font-semibold">
                    {memberCount} members
                  </Badge>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleMemberCountChange(memberCount + 1)}
                    disabled={memberCount >= 100}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  You can add 2-100 members per trip
                </p>
              </div>

              <Separator />

              {/* Member Names */}
              <div className="space-y-3">
                <Label>Member Names</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                  {members.map((member, index) => (
                    <Input
                      key={index}
                      placeholder={`Member ${index + 1}`}
                      value={member}
                      onChange={(e) => updateMember(index, e.target.value)}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Member names can be edited later in the trip
                </p>
              </div>

              <Separator />

              {/* Import Expenses */}
              <div className="space-y-3">
                <Label>Import Expenses (Optional)</Label>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowImportDialog(true)}
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import from Excel
                  </Button>
                  {importedExpenses.length > 0 && (
                    <Badge variant="secondary" className="px-3 py-1">
                      {importedExpenses.length} expenses ready
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Import pre-existing expenses from an Excel file
                </p>
              </div>

              <Separator />

              {/* Create Button */}
              <Button 
                variant="hero" 
                size="lg" 
                className="w-full"
                onClick={handleCreateTrip}
              >
                Create Trip{importedExpenses.length > 0 ? ` with ${importedExpenses.length} Expenses` : ''}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Import Dialog */}
        <ImportExpensesDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          tripName={tripName || 'New Trip'}
          members={members.filter(m => m.trim())}
          onImport={handleImportExpenses}
        />
      </div>
    </div>
  );
};

export default CreateTrip;