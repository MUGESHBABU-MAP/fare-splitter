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
  beneficiaries: z.array(z.string()).default([]),
  is_gift: z.boolean().default(false),
  gift_to: z.array(z.string()).default([]),
  joint_treat_shares: z.record(z.number()).optional(),
  split_type: z.enum(['equal', 'percentage', 'weight']).default('equal'),
  split_data: z.record(z.number()).optional(),
  notes: z.string().default("")
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
  const [splitType, setSplitType] = useState<'equal' | 'percentage' | 'weight'>(expense.split_type || 'equal');
  const [splitData, setSplitData] = useState<Record<string, number>>(expense.split_data || {});

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      expense_date: new Date(expense.expense_date),
      paid_by: expense.paid_by,
      amount: expense.amount,
      beneficiaries: expense.beneficiaries,
      is_gift: expense.is_gift,
      gift_to: expense.gift_to,
      split_type: expense.split_type || 'equal',
      split_data: expense.split_data || {},
      notes: expense.notes
    }
  });

  const handleSubmit = (data: ExpenseFormData) => {
    const finalData = {
      ...data,
      is_gift: isGift,
      joint_treat_shares: isJointTreat ? jointShares : undefined,
      split_type: isGift ? undefined : splitType,
      split_data: isGift ? undefined : (splitType !== 'equal' ? splitData : undefined)
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

  const updateSplitData = (member: string, value: number) => {
    setSplitData(prev => ({ ...prev, [member]: value }));
  };

  const validateSplitData = () => {
    if (splitType === 'percentage') {
      const beneficiaries = form.getValues("beneficiaries");
      const total = beneficiaries.reduce((sum, member) => sum + (splitData[member] || 0), 0);
      return Math.abs(total - 100) < 0.01;
    }
    return true;
  };

  const canSubmit = () => {
    const beneficiaries = form.getValues("beneficiaries");
    const giftTo = form.getValues("gift_to");
    
    if (isGift) {
      return giftTo.length > 0;
    } else {
      return beneficiaries.length > 0 && (splitType !== 'percentage' || validateSplitData());
    }
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
              onCheckedChange={(checked) => {
                setIsGift(checked);
                form.setValue("is_gift", checked);
                if (checked) {
                  form.setValue("beneficiaries", []);
                  setSplitType('equal');
                  setSplitData({});
                } else {
                  form.setValue("gift_to", []);
                }
              }}
            />
            <Label htmlFor="is-gift">This is a gift</Label>
          </div>

          {!isGift && (
            <div className="flex items-center space-x-2">
              <Switch
                id="joint-treat"
                checked={isJointTreat}
                onCheckedChange={(checked) => {
                  setIsJointTreat(checked);
                  if (!checked) {
                    setJointShares({});
                  }
                }}
              />
              <Label htmlFor="joint-treat">Joint treat (multiple sponsors)</Label>
            </div>
          )}

          {isGift && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Gift To</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const allSelected = members.every(member => form.getValues("gift_to").includes(member));
                    if (allSelected) {
                      form.setValue("gift_to", []);
                    } else {
                      form.setValue("gift_to", members);
                    }
                  }}
                >
                  {members.every(member => form.getValues("gift_to").includes(member)) ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
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
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Split Type</Label>
                <Select value={splitType} onValueChange={(value: 'equal' | 'percentage' | 'weight') => {
                  setSplitType(value);
                  if (value === 'equal') {
                    setSplitData({});
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equal">Equal Split</SelectItem>
                    <SelectItem value="percentage">Percentage Split</SelectItem>
                    <SelectItem value="weight">Weight-based Split</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Split Among (Beneficiaries)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allSelected = members.every(member => form.getValues("beneficiaries").includes(member));
                      if (allSelected) {
                        form.setValue("beneficiaries", []);
                      } else {
                        form.setValue("beneficiaries", members);
                      }
                    }}
                  >
                    {members.every(member => form.getValues("beneficiaries").includes(member)) ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <div className="space-y-2">
                  {members.map((member) => (
                    <div key={member} className="flex items-center space-x-2">
                      <Checkbox
                        id={`beneficiary-${member}`}
                        checked={form.watch("beneficiaries").includes(member)}
                        onCheckedChange={(checked) => 
                          toggleBeneficiary(member, checked as boolean)
                        }
                      />
                      <Label htmlFor={`beneficiary-${member}`} className="w-20 text-sm">
                        {member}
                      </Label>
                      {form.watch("beneficiaries").includes(member) && splitType !== 'equal' && (
                        <Input
                          type="number"
                          step="0.01"
                          placeholder={splitType === 'percentage' ? '25.00' : '1.0'}
                          value={splitData[member] || ''}
                          onChange={(e) => updateSplitData(member, parseFloat(e.target.value) || 0)}
                          className="w-20"
                        />
                      )}
                      {splitType === 'percentage' && form.watch("beneficiaries").includes(member) && (
                        <span className="text-xs text-muted-foreground">%</span>
                      )}
                      {splitType === 'weight' && form.watch("beneficiaries").includes(member) && (
                        <span className="text-xs text-muted-foreground">x</span>
                      )}
                    </div>
                  ))}
                </div>
                {splitType === 'percentage' && (
                  <p className="text-xs text-muted-foreground">
                    Total: {form.watch("beneficiaries").reduce((sum, member) => sum + (splitData[member] || 0), 0).toFixed(1)}% (should equal 100%)
                  </p>
                )}
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
            <Button 
              type="submit" 
              className="flex-1"
              disabled={!canSubmit()}
            >
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