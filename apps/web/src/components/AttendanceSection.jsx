import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Checkbox } from '@/components/ui/checkbox.jsx';
import { Separator } from '@/components/ui/separator.jsx';
import { CheckCircle2, Banknote, Clock, ClipboardSignature, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { crewAssignmentService } from '@/services/crewAssignmentService.js';

const AttendanceSection = ({ 
  assignmentId, 
  currentStatus, 
  attendanceAmount, 
  checkInTime, 
  checkOutTime, 
  onStatusChange 
}) => {
  const [loading, setLoading] = useState(false);

  const formatCurrency = (amt) => {
    try {
      if (!amt || isNaN(Number(amt))) return 'Rp 0';
      return `Rp ${Math.round(Number(amt)).toLocaleString('id-ID')}`;
    } catch {
      return 'Rp 0';
    }
  };

  const formatTimeFull = (timeStr) => {
    if (!timeStr) return 'Not recorded';
    try { return format(new Date(timeStr), 'MMM dd, yyyy - h:mm a'); } 
    catch { return 'Invalid Time'; }
  };

  const getAttendanceBadge = (status) => {
    const s = String(status).toLowerCase();
    if (s === 'confirmed') return <Badge className="bg-[hsl(var(--badge-attendance-confirmed))] text-white border-0 font-semibold shadow-sm">Confirmed</Badge>;
    if (s === 'completed') return <Badge className="bg-[hsl(var(--badge-attendance-completed))] text-white border-0 font-semibold shadow-sm">Completed</Badge>;
    return <Badge className="bg-[hsl(var(--badge-attendance-pending))] text-black border-0 font-semibold shadow-sm">Pending</Badge>;
  };

  const isAttended = currentStatus === 'confirmed' || currentStatus === 'completed';

  const handleToggle = async (checked) => {
    if (!assignmentId) return;
    setLoading(true);
    try {
      const newStatus = checked ? 'confirmed' : 'pending';
      const res = await crewAssignmentService.update(assignmentId, {
        attendance_status: newStatus,
        attendance_date: new Date().toISOString()
      });

      toast.success(`Attendance marked as ${newStatus}`);
      if (onStatusChange) onStatusChange(res.data);
    } catch (err) {
      console.error('Error updating attendance:', err);
      toast.error('Failed to update attendance status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border border-border/50 shadow-md bg-card overflow-hidden">
      <CardHeader className="bg-slate-950 text-white pb-5">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[hsl(var(--accent-yellow))]" />
            Attendance
          </span>
          {getAttendanceBadge(currentStatus)}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        
        {/* Toggle Area */}
        <div className="mb-6 flex items-center space-x-3 p-4 bg-muted/40 rounded-xl border border-border/50 transition-colors hover:bg-muted/60">
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : (
            <Checkbox 
              id="attendance-check" 
              checked={isAttended}
              onCheckedChange={handleToggle}
              className="w-5 h-5 data-[state=checked]:bg-[hsl(var(--badge-attendance-confirmed))] data-[state=checked]:text-white data-[state=checked]:border-[hsl(var(--badge-attendance-confirmed))]"
            />
          )}
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor="attendance-check"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Mark as Attended
            </label>
            <p className="text-xs text-muted-foreground">
              Confirm your presence for this event.
            </p>
          </div>
        </div>

        {/* Fee */}
        <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/50 mb-6">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
            <Banknote className="w-5 h-5" />
            <span className="font-semibold text-sm">Your Fee</span>
          </div>
          <span className="font-bold font-numeric text-emerald-900 dark:text-emerald-300 text-lg">
            {formatCurrency(attendanceAmount)}
          </span>
        </div>

        <Separator className="mb-5" />

        {/* Check in / Check out */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
             <ClipboardSignature className="w-4 h-4 text-muted-foreground mt-0.5" />
             <div className="flex-1">
               <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Check In</p>
               <p className="text-sm font-medium text-foreground">{formatTimeFull(checkInTime)}</p>
             </div>
          </div>
          <div className="flex items-start gap-3">
             <Clock className="w-4 h-4 text-muted-foreground mt-0.5 opacity-60" />
             <div className="flex-1">
               <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Check Out</p>
               <p className="text-sm font-medium text-foreground">{formatTimeFull(checkOutTime)}</p>
             </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};

export default AttendanceSection;