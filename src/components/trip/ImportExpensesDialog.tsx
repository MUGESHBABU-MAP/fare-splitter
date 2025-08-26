import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createExcelTemplate, validateExcelData } from "@/lib/excel-template";
import MemberMappingDialog from "./MemberMappingDialog";
import type { Expense } from "@/lib/settlement";

interface ImportExpensesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripName: string;
  members: string[];
  onImport: (expenses: Expense[], newMembers?: string[]) => void;
}

const ImportExpensesDialog = ({ open, onOpenChange, tripName, members, onImport }: ImportExpensesDialogProps) => {
  const { toast } = useToast();
  const [importing, setImporting] = useState(false);
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; errors: string[]; warnings: string[] } | null>(null);
  const [showMemberMapping, setShowMemberMapping] = useState(false);
  const [pendingExpenses, setPendingExpenses] = useState<any[]>([]);
  const [excelMembers, setExcelMembers] = useState<string[]>([]);

  const handleDownloadTemplate = async () => {
    try {
      await createExcelTemplate(tripName, members);
      toast({
        title: "Template downloaded!",
        description: "Use this template to format your expenses correctly"
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not create template file",
        variant: "destructive"
      });
    }
  };

  const parseSplitData = (splitDataStr: string): Record<string, number> => {
    if (!splitDataStr) return {};
    
    const result: Record<string, number> = {};
    const pairs = splitDataStr.split(',');
    
    pairs.forEach(pair => {
      const [member, value] = pair.split(':');
      if (member && value) {
        result[member.trim()] = parseFloat(value.trim()) || 0;
      }
    });
    
    return result;
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setValidationResult(null);

    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets['Expenses'];
      
      if (!worksheet) {
        throw new Error("No 'Expenses' sheet found. Please use the provided template.");
      }

      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      // Validate data
      const validation = validateExcelData(jsonData);
      setValidationResult(validation);
      
      if (!validation.isValid) {
        toast({
          title: "Import validation failed",
          description: `Found ${validation.errors.length} errors. Please fix them and try again.`,
          variant: "destructive"
        });
        return;
      }

      // Extract all unique member names from Excel
      const allExcelMembers = new Set<string>();
      jsonData.forEach((row: any) => {
        if (row['Paid By']) allExcelMembers.add(row['Paid By'].trim());
        if (row['Gift To']) allExcelMembers.add(row['Gift To'].trim());
        if (row.Beneficiaries) {
          row.Beneficiaries.split(',').forEach((b: string) => {
            const member = b.trim();
            if (member) allExcelMembers.add(member);
          });
        }
        if (row['Split Data']) {
          const splitPairs = row['Split Data'].split(',');
          splitPairs.forEach((pair: string) => {
            const [member] = pair.split(':');
            if (member) allExcelMembers.add(member.trim());
          });
        }
      });

      const uniqueExcelMembers = Array.from(allExcelMembers);
      
      // Check if all Excel members exist in trip members
      const unmatchedMembers = uniqueExcelMembers.filter(excelMember => 
        !members.some(tripMember => tripMember.toLowerCase() === excelMember.toLowerCase())
      );

      if (unmatchedMembers.length > 0) {
        // Show member mapping dialog
        setExcelMembers(uniqueExcelMembers);
        setPendingExpenses(jsonData);
        setShowMemberMapping(true);
        return;
      }

      // All members match, proceed with import
      const importedExpenses = processExpenses(jsonData, {}, []);
      onImport(importedExpenses);
      onOpenChange(false);
      
      toast({
        title: "Import successful!",
        description: `Imported ${importedExpenses.length} expenses${validation.warnings.length > 0 ? ` with ${validation.warnings.length} warnings` : ''}`
      });

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import expenses from file",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  const processExpenses = (jsonData: any[], memberMapping: Record<string, string>, newMembers: string[]): Expense[] => {
    return jsonData.map((row: any, index) => {
      const isGift = row['Is Gift']?.toLowerCase() === 'yes';
      const splitType = row['Split Type']?.toLowerCase() || 'equal';
      const splitData = parseSplitData(row['Split Data'] || '');
      
      // Apply member mapping
      const mapMember = (name: string) => memberMapping[name] || name;
      
      return {
        id: `imported-${Date.now()}-${index}`,
        expense_date: new Date(row.Date).toISOString().split('T')[0],
        paid_by: mapMember(row['Paid By']),
        amount: parseFloat(row.Amount),
        beneficiaries: isGift ? [] : (row.Beneficiaries ? row.Beneficiaries.split(',').map((b: string) => mapMember(b.trim())) : []),
        is_gift: isGift,
        gift_to: isGift ? (row['Gift To'] ? [mapMember(row['Gift To'].trim())] : []) : [],
        split_type: isGift ? 'equal' : splitType as 'equal' | 'percentage' | 'weight',
        split_data: isGift ? null : (splitType !== 'equal' ? 
          Object.fromEntries(Object.entries(splitData).map(([member, value]) => [mapMember(member), value])) : null),
        notes: row.Notes || ''
      };
    });
  };

  const handleMemberMappingConfirm = (memberMapping: Record<string, string>, newMembers: string[]) => {
    const importedExpenses = processExpenses(pendingExpenses, memberMapping, newMembers);
    
    // Pass both expenses and new members to parent
    onImport(importedExpenses, newMembers);
    onOpenChange(false);
    setShowMemberMapping(false);
    
    toast({
      title: "Import successful!",
      description: `Imported ${importedExpenses.length} expenses${newMembers.length > 0 ? ` and added ${newMembers.length} new members` : ''}`
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Expenses from Excel</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Template Download */}
          <div className="space-y-3">
            <Label>Step 1: Download Template</Label>
            <div className="flex items-center gap-3">
              <Button onClick={handleDownloadTemplate} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download Excel Template
              </Button>
              <span className="text-sm text-muted-foreground">
                Use this template to ensure compatibility
              </span>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-3">
            <Label>Step 2: Upload Your Excel File</Label>
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImport}
              disabled={importing}
            />
            <p className="text-sm text-muted-foreground">
              Upload an Excel file with expenses formatted according to the template
            </p>
          </div>

          {/* Validation Results */}
          {validationResult && (
            <div className="space-y-3">
              <Label>Validation Results</Label>
              
              {validationResult.isValid ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    File validation passed! Ready to import.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Found {validationResult.errors.length} errors that must be fixed:
                  </AlertDescription>
                </Alert>
              )}

              {/* Errors */}
              {validationResult.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">Errors</Badge>
                    <span className="text-sm">Must be fixed before import</span>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {validationResult.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {validationResult.warnings.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Warnings
                    </Badge>
                    <span className="text-sm">Will be handled automatically</span>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {validationResult.warnings.map((warning, index) => (
                      <div key={index} className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                        {warning}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="space-y-3">
            <Label>Template Format</Label>
            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>Required columns:</strong> Date, Paid By, Amount, Is Gift</p>
              <p><strong>For regular expenses:</strong> Beneficiaries (comma-separated member names)</p>
              <p><strong>For gifts:</strong> Gift To (member name)</p>
              <p><strong>For custom splits:</strong> Split Type (percentage/weight) and Split Data (Member:Value format)</p>
              <p><strong>Example split data:</strong> Alice:60,Bob:40 (for 60% and 40% split)</p>
            </div>
          </div>
        </div>
        
        {/* Member Mapping Dialog */}
        <MemberMappingDialog
          open={showMemberMapping}
          onOpenChange={setShowMemberMapping}
          excelMembers={excelMembers}
          tripMembers={members}
          onConfirm={handleMemberMappingConfirm}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ImportExpensesDialog;