import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, Edit, Trash2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Expense } from "@/lib/settlement";

const expenseSchema = z.object({
  expense_date: z.date(),
  paid_by: z.string().min(1, "Please select who paid"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  beneficiaries: z.array(z.string()).min(1, "Select at least one beneficiary"),
  is_gift: z.boolean(),
  gift_to: z.array(z.string()),
  joint_treat_shares: z.record(z.number()).optional(),
  notes: z.string()
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface EditExpenseFormProps {
  expense: Expense;
  members: string[];
  onUpdate: (id: string, data: ExpenseFormData) => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
}

const EditExpenseForm = ({ expense, members, onUpdate, onDelete, onCancel }: EditExpenseFormProps) => {
  const [isGift, setIsGift] = useState(expense.is_gift);
  const [isJointTreat, setIsJointTreat] = useState(!!expense.joint_treat_shares);
  const [jointShares, setJointShares] = useState<Record<string, number>>(expense.joint_treat_shares || {});

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      expense_date: new Date(expense.expense_date),
      paid_by: expense.paid_by,
      amount: expense.amount,
      beneficiaries: expense.beneficiaries,
      is_gift: expense.is_gift,
      gift_to: expense.gift_to,
      notes: expense.notes
    }
  });

  const handleSubmit = (data: ExpenseFormData) => {
    const finalData = {
      ...data,
      is_gift: isGift,
      joint_treat_shares: isJointTreat ? jointShares : undefined
    };
    onUpdate(expense.id, finalData);
  };

  const toggleBeneficiary = (member: string, checked: boolean) => {
    const current = form.getValues("beneficiaries");
    if (checked) {
      form.setValue("beneficiaries", [...current, member]);
    } else {
      form.setValue("beneficiaries", current.filter(m => m !== member));
    }
  };

  const toggleGiftRecipient = (member: string, checked: boolean) => {
    const current = form.getValues("gift_to");
    if (checked) {
      form.setValue("gift_to", [...current, member]);
    } else {
      form.setValue("gift_to", current.filter(m => m !== member));
    }
  };

  const updateJointShare = (member: string, share: number) => {
    setJointShares(prev => ({ ...prev, [member]: share }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit className="w-5 h-5" />
          Edit Expense
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !form.watch("expense_date") && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.watch("expense_date") ? (
                    format(form.watch("expense_date"), "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={form.watch("expense_date")}
                  onSelect={(date) => date && form.setValue("expense_date", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              {...form.register("amount", { valueAsNumber: true })}
            />
            {form.formState.errors.amount && (
              <p className="text-sm text-red-500">{form.formState.errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Paid By</Label>
            <Select value={form.watch("paid_by")} onValueChange={(value) => form.setValue("paid_by", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select who paid" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member} value={member}>
                    {member}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center space-x-2">
            <Switch
              id="is-gift"
              checked={isGift}
              onCheckedChange={setIsGift}
            />
            <Label htmlFor="is-gift">This is a gift</Label>
          </div>

          {!isGift && (
            <div className="flex items-center space-x-2">
              <Switch
                id="joint-treat"
                checked={isJointTreat}
                onCheckedChange={setIsJointTreat}
              />
              <Label htmlFor="joint-treat">Joint treat (multiple sponsors)</Label>
            </div>
          )}

          {isGift && (
            <div className="space-y-3">
              <Label>Gift To</Label>
              <div className="grid grid-cols-2 gap-2">
                {members.map((member) => (
                  <div key={member} className="flex items-center space-x-2">
                    <Checkbox
                      id={`gift-${member}`}
                      checked={form.watch("gift_to").includes(member)}
                      onCheckedChange={(checked) => 
                        toggleGiftRecipient(member, checked as boolean)
                      }
                    />
                    <Label htmlFor={`gift-${member}`} className="text-sm">
                      {member}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isJointTreat && !isGift && (
            <div className="space-y-3">
              <Label>Sponsor Shares</Label>
              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member} className="flex items-center space-x-2">
                    <Label className="w-24 text-sm">{member}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={jointShares[member] || ""}
                      onChange={(e) => updateJointShare(member, parseFloat(e.target.value) || 0)}
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isGift && (
            <div className="space-y-3">
              <Label>Split Among (Beneficiaries)</Label>
              <div className="grid grid-cols-2 gap-2">
                {members.map((member) => (
                  <div key={member} className="flex items-center space-x-2">
                    <Checkbox
                      id={`beneficiary-${member}`}
                      checked={form.watch("beneficiaries").includes(member)}
                      onCheckedChange={(checked) => 
                        toggleBeneficiary(member, checked as boolean)
                      }
                    />
                    <Label htmlFor={`beneficiary-${member}`} className="text-sm">
                      {member}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              Update Expense
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={() => onDelete(expense.id)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EditExpenseForm;