import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { UserPlus, ArrowRight } from "lucide-react";

interface MemberMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  excelMembers: string[];
  tripMembers: string[];
  onConfirm: (mapping: Record<string, string>, newMembers: string[]) => void;
}

const MemberMappingDialog = ({ open, onOpenChange, excelMembers, tripMembers, onConfirm }: MemberMappingDialogProps) => {
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [newMembers, setNewMembers] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      // Auto-map exact matches
      const autoMapping: Record<string, string> = {};
      const unmappedExcelMembers: string[] = [];

      excelMembers.forEach(excelMember => {
        const exactMatch = tripMembers.find(tripMember => 
          tripMember.toLowerCase() === excelMember.toLowerCase()
        );
        
        if (exactMatch) {
          autoMapping[excelMember] = exactMatch;
        } else {
          unmappedExcelMembers.push(excelMember);
        }
      });

      setMapping(autoMapping);
      setNewMembers(unmappedExcelMembers);
    }
  }, [open, excelMembers, tripMembers]);

  const handleMappingChange = (excelMember: string, tripMember: string) => {
    setMapping(prev => ({ ...prev, [excelMember]: tripMember }));
    setNewMembers(prev => prev.filter(m => m !== excelMember));
  };

  const handleAddAsNew = (excelMember: string) => {
    setMapping(prev => {
      const newMapping = { ...prev };
      delete newMapping[excelMember];
      return newMapping;
    });
    if (!newMembers.includes(excelMember)) {
      setNewMembers(prev => [...prev, excelMember]);
    }
  };

  const handleConfirm = () => {
    onConfirm(mapping, newMembers);
    onOpenChange(false);
  };

  const allMembersHandled = excelMembers.every(member => 
    mapping[member] || newMembers.includes(member)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Map Excel Members to Trip Members</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-sm text-muted-foreground">
            Your Excel file contains member names that don't exactly match your trip members. 
            Please map them to existing members or add them as new members.
          </div>

          {/* Auto-mapped members */}
          {Object.keys(mapping).length > 0 && (
            <div className="space-y-3">
              <Label>Auto-mapped Members</Label>
              <div className="space-y-2">
                {Object.entries(mapping).map(([excelMember, tripMember]) => (
                  <div key={excelMember} className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <span className="text-sm">{excelMember}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <Badge variant="secondary">{tripMember}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unmapped members */}
          {excelMembers.filter(member => !mapping[member] && !newMembers.includes(member)).length > 0 && (
            <div className="space-y-3">
              <Label>Map These Members</Label>
              <div className="space-y-3">
                {excelMembers
                  .filter(member => !mapping[member] && !newMembers.includes(member))
                  .map(excelMember => (
                    <div key={excelMember} className="flex items-center gap-3 p-3 border rounded">
                      <div className="flex-1">
                        <div className="font-medium">{excelMember}</div>
                        <div className="text-sm text-muted-foreground">From Excel file</div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Select onValueChange={(value) => handleMappingChange(excelMember, value)}>
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Map to..." />
                          </SelectTrigger>
                          <SelectContent>
                            {tripMembers.map(tripMember => (
                              <SelectItem key={tripMember} value={tripMember}>
                                {tripMember}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddAsNew(excelMember)}
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Add New
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* New members to be added */}
          {newMembers.length > 0 && (
            <div className="space-y-3">
              <Label>New Members to Add</Label>
              <div className="space-y-2">
                {newMembers.map(member => (
                  <div key={member} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">{member}</span>
                    </div>
                    <Badge variant="outline">New Member</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="p-3 bg-muted rounded">
            <div className="text-sm">
              <div>Excel members: {excelMembers.length}</div>
              <div>Mapped to existing: {Object.keys(mapping).length}</div>
              <div>Adding as new: {newMembers.length}</div>
              <div>Total trip members after import: {tripMembers.length + newMembers.length}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              onClick={handleConfirm}
              disabled={!allMembersHandled}
              className="flex-1"
            >
              Confirm Mapping
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MemberMappingDialog;