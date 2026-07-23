import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';

const AssignDesignerModal = ({ open, onOpenChange, orderId, onSuccess }) => {
  const [designers, setDesigners] = useState([]);
  const [selectedDesigner, setSelectedDesigner] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (open && orderId) {
      loadDesigners();
    }
  }, [open, orderId]);

  const loadDesigners = async () => {
    setLoading(true);
    setError(false);
    try {
      const records = await pb.collection('users').getFullList({
        filter: "role = 'designer'",
        sort: 'name',
        $autoCancel: false
      });
      setDesigners(records || []);

      const order = await pb.collection('orders').getOne(orderId, { $autoCancel: false });
      if (order?.assigned_designer_id) {
        setSelectedDesigner(order.assigned_designer_id);
      } else {
        setSelectedDesigner('');
      }
    } catch (err) {
      setError(true);
      toast.error('Failed to load designers');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedDesigner) {
      toast.error('Please select a designer');
      return;
    }

    setSaving(true);
    try {
      await pb.collection('orders').update(orderId, {
        assigned_designer_id: selectedDesigner
      }, { $autoCancel: false });

      const existingDesignWork = await pb.collection('design_work').getFullList({
        filter: `order_id = "${orderId}"`,
        $autoCancel: false
      });

      if (existingDesignWork && existingDesignWork.length > 0) {
        await pb.collection('design_work').update(existingDesignWork[0].id, {
          designer_id: selectedDesigner
        }, { $autoCancel: false });
      } else {
        await pb.collection('design_work').create({
          order_id: orderId,
          designer_id: selectedDesigner,
          status: 'pending'
        }, { $autoCancel: false });
      }

      toast.success('Designer assigned successfully');
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error('Failed to assign designer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Designer</DialogTitle>
          <DialogDescription>
            Select a designer to handle the creative work for this order.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mb-2 text-primary" />
              <p className="text-sm">Loading designers...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <AlertCircle className="w-8 h-8 text-destructive mb-2" />
              <p className="text-sm text-muted-foreground mb-4">Failed to load designers data.</p>
              <Button variant="outline" size="sm" onClick={loadDesigners}>Retry</Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Available Designers</Label>
              <Select value={selectedDesigner} onValueChange={setSelectedDesigner} disabled={saving || loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a designer" />
                </SelectTrigger>
                <SelectContent>
                  {designers.length > 0 ? (
                    designers.map((designer) => (
                      <SelectItem key={designer.id} value={designer.id}>
                        {designer.name || 'Unknown Designer'}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No designers available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving || loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || saving || !selectedDesigner || error}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {saving ? 'Assigning...' : 'Assign Designer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignDesignerModal;