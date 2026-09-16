import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { crewAssignmentService } from '@/services/crewAssignmentService.js';
import { format } from 'date-fns';
import { formatRupiah } from '@/lib/currency.js';

const CrewAttendanceDetailModal = ({ isOpen, onClose, assignmentRecord, onSave }) => {
  const [status, setStatus] = useState('');
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (assignmentRecord && isOpen) {
      setStatus(assignmentRecord.attendance_status || 'belum_jawab');
      setReason(assignmentRecord.attendance_reason || '');
      setAmount(assignmentRecord.attendance_amount?.toString() || '');
      setNotes(assignmentRecord.crew_notes || '');
      setShowConfirm(false);
    }
  }, [assignmentRecord, isOpen]);

  const hasChanges = assignmentRecord && (
    status !== (assignmentRecord.attendance_status || 'belum_jawab') ||
    reason !== (assignmentRecord.attendance_reason || '') ||
    amount !== (assignmentRecord.attendance_amount?.toString() || '') ||
    notes !== (assignmentRecord.crew_notes || '')
  );

  const handleSaveClick = () => {
    if (status === 'tidak_hadir' && !reason.trim()) {
      toast.error('Reason is required when marking as Tidak Hadir');
      return;
    }
    if (amount && (isNaN(Number(amount)) || Number(amount) < 0)) {
      toast.error('Amount must be a valid positive number');
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmSave = async () => {
    setIsSubmitting(true);
    try {
      const updateData = {
        attendance_status: status,
        attendance_reason: status === 'tidak_hadir' ? reason : '',
        attendance_date: new Date().toISOString()
      };

      if (amount !== '') {
        updateData.attendance_amount = Number(amount);
      } else {
        updateData.attendance_amount = null;
      }

      updateData.crew_notes = notes.trim() || null;

      const res = await crewAssignmentService.update(assignmentRecord.id, updateData);

      toast.success('Attendance updated successfully');
      if (onSave) onSave(res.data);
      onClose();
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast.error('Failed to update attendance');
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false);
    }
  };

  if (!assignmentRecord) return null;

  const crewName = assignmentRecord.crew?.name || 'Unknown Crew';
  const eventName = assignmentRecord.order?.event_name || 'Unknown Event';
  const eventDate = assignmentRecord.order?.event_date;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage Crew Attendance</DialogTitle>
          <DialogDescription>
            Update attendance and compensation for {crewName}
          </DialogDescription>
        </DialogHeader>

        {!showConfirm ? (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-muted-foreground">Crew</Label>
              <div className="col-span-3 font-medium">{crewName}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-muted-foreground">Event</Label>
              <div className="col-span-3 font-medium truncate">{eventName}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-muted-foreground">Date</Label>
              <div className="col-span-3 text-sm">
                {eventDate ? format(new Date(eventDate), 'MMM dd, yyyy') : 'N/A'}
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4 mt-2">
              <Label htmlFor="status" className="text-right">Status</Label>
              <div className="col-span-3">
                <Select value={status || 'belum_jawab'} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hadir">Hadir</SelectItem>
                    <SelectItem value="tidak_hadir">Tidak Hadir</SelectItem>
                    <SelectItem value="belum_jawab">Belum Jawab</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {status === 'tidak_hadir' && (
              <div className="grid grid-cols-4 items-start gap-4 mt-2">
                <Label htmlFor="reason" className="text-right mt-2">Reason</Label>
                <div className="col-span-3">
                  <Textarea
                    id="reason"
                    value={reason || ''}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Required reason for absence..."
                    className="resize-none h-20"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4 mt-2 pt-4 border-t">
              <Label htmlFor="amount" className="text-right">Amount (Rp)</Label>
              <div className="col-span-3 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  value={amount || ''}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Optional compensation"
                  className="pl-9 font-numeric"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="notes" className="text-right mt-2">Keterangan</Label>
              <div className="col-span-3">
                <Textarea
                  id="notes"
                  value={notes || ''}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes..."
                  className="resize-none h-20"
                />
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
              {status !== (assignmentRecord.attendance_status || 'belum_jawab') && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span>
                    <span className="line-through opacity-50 mr-2 capitalize">{(assignmentRecord.attendance_status || 'belum_jawab').replace('_', ' ')}</span>
                    <span className="font-bold text-foreground capitalize">{status.replace('_', ' ')}</span>
                  </span>
                </div>
              )}
              {status === 'tidak_hadir' && reason !== (assignmentRecord.attendance_reason || '') && (
                <div className="flex flex-col mt-2 pt-2 border-t">
                  <span className="text-muted-foreground mb-1">New Reason:</span>
                  <span className="italic text-foreground">"{reason}"</span>
                </div>
              )}
              {amount !== (assignmentRecord.attendance_amount?.toString() || '') && (
                <div className="flex justify-between mt-2 pt-2 border-t">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-numeric">
                    <span className="line-through opacity-50 mr-2">{formatRupiah(assignmentRecord.attendance_amount || 0)}</span>
                    <span className="font-bold text-foreground">{formatRupiah(amount || 0)}</span>
                  </span>
                </div>
              )}
              {notes !== (assignmentRecord.crew_notes || '') && (
                <div className="flex flex-col mt-2 pt-2 border-t">
                  <span className="text-muted-foreground mb-1">Keterangan:</span>
                  <span className="italic text-foreground">{notes ? `"${notes}"` : '(cleared)'}</span>
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

export default CrewAttendanceDetailModal;