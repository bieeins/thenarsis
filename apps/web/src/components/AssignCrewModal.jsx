import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { userService } from '@/services/userService.js';
import { crewAssignmentService } from '@/services/crewAssignmentService.js';

const AssignCrewModal = ({ open, onOpenChange, orderId, onSuccess }) => {
  const [crewMembers, setCrewMembers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [existingAssignments, setExistingAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (open && orderId) {
      loadCrewData();
    }
  }, [open, orderId]);

  const loadCrewData = async () => {
    setLoading(true);
    setError(false);
    try {
      const users = await userService.listAll({ role: 'crew', sort: 'name', order: 'asc' });
      setCrewMembers(users || []);

      const assignments = await crewAssignmentService.listAll({ orderId });
      setExistingAssignments(assignments || []);
      setSelectedIds((assignments || []).map(a => a.crew_id));
    } catch (err) {
      setError(true);
      toast.error('Failed to load crew members');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id) => {
    if (saving || loading) return;
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const existingIds = existingAssignments.map(a => a.crew_id);
      
      const toAdd = selectedIds.filter(id => !existingIds.includes(id));
      const toRemove = existingAssignments.filter(a => !selectedIds.includes(a.crew_id));

      if (toRemove.length > 0) {
        await Promise.all(toRemove.map(a => crewAssignmentService.remove(a.id)));
      }

      if (toAdd.length > 0) {
        await Promise.all(toAdd.map(id =>
          crewAssignmentService.create({
            order_id: orderId,
            crew_id: id,
            status: 'pending',
            attendance_status: 'pending' // Explicitly use valid enum
          })
        ));
      }

      toast.success('Crew assignments updated successfully');
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to update crew assignments', err);
      const errorMessage = err?.message || 'Failed to update crew assignments';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Crew</DialogTitle>
          <DialogDescription>
            Select multiple crew members to handle this event on-site.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-6 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mb-2 text-primary" />
              <p className="text-sm">Loading crew members...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col justify-center items-center py-6 text-center">
              <AlertCircle className="w-8 h-8 text-destructive mb-2" />
              <p className="text-sm text-muted-foreground mb-4">Failed to load crew data.</p>
              <Button variant="outline" size="sm" onClick={loadCrewData}>Retry</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {crewMembers.length > 0 ? (
                crewMembers.map((crew) => (
                  <div key={crew.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <Checkbox 
                      id={`crew-${crew.id}`} 
                      checked={selectedIds.includes(crew.id)}
                      onCheckedChange={() => toggleSelection(crew.id)}
                      disabled={saving || loading}
                    />
                    <Label 
                      htmlFor={`crew-${crew.id}`} 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      {crew.name || 'Unknown Crew'}
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No crew members found.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving || loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || saving || error}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {saving ? 'Saving...' : 'Save Assignments'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignCrewModal;