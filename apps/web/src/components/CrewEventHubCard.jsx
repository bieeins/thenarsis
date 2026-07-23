import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Card, CardContent, CardFooter } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Checkbox } from '@/components/ui/checkbox.jsx';
import { MapPin, Calendar, Clock, User, Banknote, ChevronRight, Package, CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient.js';
import { cn } from '@/lib/utils.js';

const CrewEventHubCard = ({ event }) => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  if (!event) return null;

  const eventName = event.event_name || 'Unnamed Event';
  const customerName = event.customer_name || 'Unknown Customer';
  const location = event.event_location || 'TBD';
  const status = event.status || 'Pending';
  const packageName = event.package_name || 'Custom Package';
  const attendanceStatus = event.attendance_status || 'pending';
  const attendanceAmount = event.attendance_amount || 0;
  const orderTotal = event.total_amount || 0;

  const handleAttendanceToggle = async (e) => {
    e.stopPropagation(); // Prevent card click
    if (saving) return;

    const isAttended = attendanceStatus === 'confirmed' || attendanceStatus === 'completed';
    const newStatus = isAttended ? 'pending' : 'confirmed';

    setSaving(true);
    try {
      await pb.collection('crew_assignments').update(event.crew_assignment_id, {
        attendance_status: newStatus,
        attendance_date: new Date().toISOString()
      }, { $autoCancel: false });
      
      toast.success(`Attendance marked as ${newStatus}`);
    } catch (err) {
      console.error('Error toggling attendance:', err);
      toast.error('Failed to update attendance');
    } finally {
      setSaving(false);
    }
  };

  const getOrderStatusBadge = (s) => {
    const statusLower = s.toLowerCase();
    switch (statusLower) {
      case 'pending':
        return <Badge className="bg-[#FBBF24] text-yellow-950 border-0 font-semibold shadow-sm">Pending</Badge>;
      case 'in progress':
        return <Badge className="bg-[#3B82F6] text-white border-0 font-semibold shadow-sm">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-[#10B981] text-white border-0 font-semibold shadow-sm">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-[#EF4444] text-white border-0 font-semibold shadow-sm">Cancelled</Badge>;
      default:
        return <Badge className="bg-slate-200 text-slate-800 border-0 font-semibold">{s}</Badge>;
    }
  };

  const getAttendanceBadge = (s) => {
    const statusLower = s.toLowerCase();
    if (statusLower === 'confirmed') return <Badge className="bg-[hsl(var(--badge-attendance-confirmed))] text-white border-0 shadow-sm text-[10px] leading-tight px-1.5 py-0">Confirmed</Badge>;
    if (statusLower === 'completed') return <Badge className="bg-[hsl(var(--badge-attendance-completed))] text-white border-0 shadow-sm text-[10px] leading-tight px-1.5 py-0">Completed</Badge>;
    return <Badge className="bg-[hsl(var(--badge-attendance-pending))] text-black border-0 shadow-sm text-[10px] leading-tight px-1.5 py-0">Pending</Badge>;
  };

  const formatCurrency = (amt) => {
    try {
      if (!amt || isNaN(Number(amt))) return 'Rp 0';
      return `Rp ${Number(amt).toLocaleString('id-ID')}`;
    } catch (err) {
      return 'Rp 0';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Date TBD';
    try { return format(new Date(dateStr), 'MMM dd, yyyy'); } 
    catch { return 'Invalid Date'; }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return 'Time TBD';
    try { return format(new Date(timeStr), 'h:mm a'); } 
    catch { return 'Invalid Time'; }
  };

  const isAttended = attendanceStatus === 'confirmed' || attendanceStatus === 'completed';

  return (
    <Card 
      onClick={() => navigate(`/crew/event/${event.order_id}`)}
      className="group cursor-pointer border-l-4 border-l-[hsl(var(--accent-yellow))] border-y-border border-r-border bg-card shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col h-full overflow-hidden"
    >
      <CardContent className="p-5 sm:p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start gap-4 mb-4">
          <div className="space-y-1">
            <h3 className="font-bold text-xl leading-tight text-foreground line-clamp-2">
              {eventName}
            </h3>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <User className="w-3.5 h-3.5" />
              <span className="truncate">{customerName}</span>
            </div>
          </div>
          <div className="shrink-0 pt-1">
            {getOrderStatusBadge(status)}
          </div>
        </div>

        <div className="space-y-2.5 mb-6 flex-1">
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 text-[hsl(var(--accent-yellow))]" />
            <span className="font-medium text-foreground">{formatDate(event.event_date)}</span>
            <span className="text-border mx-1">|</span>
            <Clock className="w-4 h-4 text-[hsl(var(--accent-yellow))]" />
            <span>{formatTime(event.event_time)}</span>
          </div>
          <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 text-[hsl(var(--accent-yellow))] shrink-0 mt-0.5" />
            <span className="line-clamp-1">{location}</span>
          </div>
          <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <Package className="w-4 h-4 text-[hsl(var(--accent-yellow))] shrink-0 mt-0.5" />
            <span className="line-clamp-1">{packageName}</span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Your Fee</p>
            <div className="flex items-center gap-1.5">
              <Banknote className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-numeric font-bold text-foreground truncate">
                {formatCurrency(attendanceAmount)}
              </span>
            </div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 border border-border/50 flex flex-col justify-center relative">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Status</p>
            <div className="mt-0.5">
              {getAttendanceBadge(attendanceStatus)}
            </div>
          </div>
        </div>

        {/* Quick Actions (Checklist) */}
        <div 
          className="mt-auto p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-border/60 flex items-center justify-between"
          onClick={(e) => e.stopPropagation()} // Extra guard for the whole section
        >
          <label htmlFor={`attend-${event.crew_assignment_id}`} className="flex items-center gap-2 cursor-pointer w-full">
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : (
              <Checkbox 
                id={`attend-${event.crew_assignment_id}`}
                checked={isAttended}
                onCheckedChange={(checked) => handleAttendanceToggle({ stopPropagation: () => {} })}
                className="w-4 h-4 data-[state=checked]:bg-[hsl(var(--badge-attendance-confirmed))] data-[state=checked]:border-[hsl(var(--badge-attendance-confirmed))]"
              />
            )}
            <span className="text-sm font-medium text-foreground select-none">Mark as Attended</span>
          </label>
        </div>

      </CardContent>

      <CardFooter className="px-5 py-3 border-t border-border/50 bg-muted/20 group-hover:bg-[#FFFBEB]/40 transition-colors flex justify-between items-center">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
          <CreditCard className="w-3.5 h-3.5" />
          Order Total: {formatCurrency(orderTotal)}
        </div>
        <div className="flex items-center gap-1 text-sm font-semibold text-[hsl(var(--accent-yellow-active))] transition-colors">
          View Event <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </CardFooter>
    </Card>
  );
};

export default CrewEventHubCard;