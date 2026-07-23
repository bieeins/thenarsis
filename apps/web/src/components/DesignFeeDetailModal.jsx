import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { designIncomeService } from '@/services/designIncomeService.js';
import { format } from 'date-fns';

const DesignFeeDetailModal = ({ isOpen, onClose, feeRecord, onSave }) => {
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (feeRecord && isOpen) {
      setAmount(feeRecord.fee_amount?.toString() || '0');
      setStatus(feeRecord.status || 'pending');
      setShowConfirm(false);
    }
  }, [feeRecord, isOpen]);

  const hasChanges = feeRecord && (
    amount !== (feeRecord.fee_amount?.toString() || '0') ||
    status !== (feeRecord.status || 'pending')
  );

  const handleSaveClick = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) < 0) {
      toast.error('Please enter a valid fee amount');
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmSave = async () => {
    setIsSubmitting(true);
    try {
      const res = await designIncomeService.update(feeRecord.id, {
        fee_amount: Number(amount),
        status: status
      });

      toast.success('Design fee updated successfully');
      if (onSave) onSave(res.data);
      onClose();
    } catch (error) {
      console.error('Error updating fee:', error);
      toast.error('Failed to update design fee');
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false);
    }
  };

  if (!feeRecord) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Design Fee</DialogTitle>
          <DialogDescription>
            Update fee details for {feeRecord.designer_name || 'Unknown Designer'}
          </DialogDescription>
        </DialogHeader>

        {!showConfirm ? (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-muted-foreground">Designer</Label>
              <div className="col-span-3 font-medium">{feeRecord.designer_name || 'Unknown Designer'}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-muted-foreground">Event</Label>
              <div className="col-span-3 font-medium truncate">
                {feeRecord.order?.event_name || 'Unknown Event'}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-muted-foreground">Submitted</Label>
              <div className="col-span-3 text-sm">
                {feeRecord.created_at ? format(new Date(feeRecord.created_at), 'MMM dd, yyyy HH:mm') : 'N/A'}
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4 mt-2">
              <Label htmlFor="amount" className="text-right">Fee (Rp)</Label>
              <div className="col-span-3 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  value={amount || ''}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-9 font-numeric"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Status</Label>
              <div className="col-span-3">
                <Select value={status || 'pending'} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Submitted (Pending)</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">Please confirm the following changes:</p>
            </div>
            
            <div className="space-y-2 text-sm bg-muted/30 p-4 rounded-lg border">
              {amount !== (feeRecord.fee_amount?.toString() || '0') && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-numeric">
                    <span className="line-through opacity-50 mr-2">Rp {feeRecord.fee_amount?.toLocaleString('id-ID') || '0'}</span>
                    <span className="font-bold text-foreground">Rp {Number(amount).toLocaleString('id-ID')}</span>
                  </span>
                </div>
              )}
              {status !== (feeRecord.status || 'pending') && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span>
                    <span className="line-through opacity-50 mr-2 capitalize">{feeRecord.status || 'pending'}</span>
                    <span className="font-bold text-foreground capitalize">{status}</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {!showConfirm ? (
            <>
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={handleSaveClick} disabled={!hasChanges || isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Review Changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={isSubmitting}>Back</Button>
              <Button onClick={handleConfirmSave} disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isSubmitting ? 'Saving...' : 'Confirm Save'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DesignFeeDetailModal;