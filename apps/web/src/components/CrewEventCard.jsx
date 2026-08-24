import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Card, CardContent, CardFooter } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Checkbox } from '@/components/ui/checkbox.jsx';
import { Button } from '@/components/ui/button.jsx';
import { MapPin, Calendar, Clock, User, Banknote, ChevronRight, Package, File, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { crewAssignmentService } from '@/services/crewAssignmentService.js';
import DownloadFilesModal from '@/components/DownloadFilesModal.jsx';

const CrewEventCard = ({ event }) => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!event) {
      console.warn('[CrewEventCard] Rendered with null/undefined event data.');
    }
  }, [event]);

  if (!event) {
    return (
      <Card className="border border-destructive/20 bg-destructive/5 p-6 flex flex-col items-center justify-center text-center h-full">
        <AlertCircle className="w-8 h-8 text-destructive/50 mb-2" />
        <p className="text-sm font-medium text-destructive">Invalid Event Data</p>
      </Card>
    );
  }

  // Safe data extraction with fallbacks
  const eventName = event?.event_name || 'Unnamed Event';
  const customerName = event?.customer_name || 'Unknown Customer';
  const location = event?.event_location || 'Location TBD';
  const status = event?.status || 'Pending';
  const packageName = event?.package_name || 'Custom Package';
  const attendanceStatus = event?.attendance_status || 'pending';
  const attendanceAmount = event?.attendance_amount || 0;
  const filesCount = event?.files_count || 0;
  const notesPreview = event?.notes 
    ? (event.notes.length > 100 ? event.notes.substring(0, 100) + '...' : event.notes) 
    : 'No special notes provided.';

  const handleAttendanceToggle = async (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (saving) return;

    if (!event?.crew_assignment_id) {
      toast.error('Invalid assignment ID. Cannot update attendance.');
      return;
    }

    const isAttended = attendanceStatus === 'confirmed' || attendanceStatus === 'completed';
    const newStatus = isAttended ? 'pending' : 'confirmed';

    console.log(`[CrewEventCard] Toggling attendance for assignment ${event.crew_assignment_id} to ${newStatus}`);
    setSaving(true);
    try {
      await crewAssignmentService.update(event.crew_assignment_id, {
        attendance_status: newStatus,
        attendance_date: new Date().toISOString()
      });

      toast.success(`Attendance marked as ${newStatus}`);
    } catch (err) {
      console.error('[CrewEventCard] Error toggling attendance:', err);
      toast.error('Failed to update attendance status.');
    } finally {
      setSaving(false);
    }
  };

  const handleCardClick = () => {
    const targetId = event?.crew_assignment_id || event?.id || event?.order_id;
    if (targetId) {
      console.log(`[CrewEventCard] Navigating to detail for target ID: ${targetId}`);
      navigate(`/crew/events/${targetId}`);
    } else {
      toast.error('Cannot open details: Missing ID');
    }
  };

  const openDownloadModal = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!event?.order_id) {
      toast.error('Cannot open files: Missing Order ID');
      return;
    }
    console.log(`[CrewEventCard] Opening download modal for order ${event.order_id}`);
    setIsModalOpen(true);
  };

  const getOrderStatusBadge = (s) => {
    const statusLower = String(s || '').toLowerCase();
    switch (statusLower) {
      case 'pending': return <Badge className="bg-[#FBBF24] text-yellow-950 border-0 font-semibold shadow-sm">Pending</Badge>;
      case 'in progress': return <Badge className="bg-[#3B82F6] text-white border-0 font-semibold shadow-sm">In Progress</Badge>;
      case 'completed': return <Badge className="bg-[#10B981] text-white border-0 font-semibold shadow-sm">Completed</Badge>;
      case 'cancelled': return <Badge className="bg-[#EF4444] text-white border-0 font-semibold shadow-sm">Cancelled</Badge>;
      default: return <Badge className="bg-slate-200 text-slate-800 border-0 font-semibold shadow-sm">{s || 'Unknown'}</Badge>;
    }
  };

  const getAttendanceBadge = (s) => {
    const statusLower = String(s || '').toLowerCase();
    if (statusLower === 'confirmed') return <Badge className="bg-[hsl(var(--badge-attendance-confirmed))] text-white border-0 shadow-sm text-[10px] leading-tight px-1.5 py-0">Confirmed</Badge>;
    if (statusLower === 'completed') return <Badge className="bg-[hsl(var(--badge-attendance-completed))] text-white border-0 shadow-sm text-[10px] leading-tight px-1.5 py-0">Completed</Badge>;
    return <Badge className="bg-[hsl(var(--badge-attendance-pending))] text-black border-0 shadow-sm text-[10px] leading-tight px-1.5 py-0">Pending Response</Badge>;
  };

  const formatCurrency = (amt) => {
    try {
      if (amt === undefined || amt === null || isNaN(Number(amt))) return 'Rp 0';
      return `Rp ${Math.round(Number(amt)).toLocaleString('id-ID')}`;
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
    <>
      <Card 
        onClick={handleCardClick}
        className="group cursor-pointer border border-border/60 bg-card shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col h-full overflow-hidden relative"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[hsl(var(--accent-yellow))] to-[hsl(var(--accent-yellow-hover))] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <CardContent className="p-5 sm:p-6 flex-1 flex flex-col">
          <div className="flex justify-between items-start gap-4 mb-4">
            <div className="space-y-1">
              <h3 className="font-bold text-xl leading-tight text-foreground line-clamp-2 group-hover:text-[hsl(var(--accent-yellow-active))] transition-colors">
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

          <div className="space-y-2.5 mb-5">
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 text-[hsl(var(--accent-yellow))]" />
              <span className="font-medium text-foreground">{formatDate(event?.event_date)}</span>
              <span className="text-border mx-1">|</span>
              <Clock className="w-4 h-4 text-[hsl(var(--accent-yellow))]" />
              <span>{formatTime(event?.event_time)}</span>
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

          <div className="bg-muted/30 p-3 rounded-lg border border-border/50 text-xs text-muted-foreground italic mb-5 line-clamp-2">
            {notesPreview}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5 mt-auto">
            <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-3 border border-emerald-100 dark:border-emerald-900/50">
              <p className="text-[10px] text-emerald-800 dark:text-emerald-400 font-semibold uppercase tracking-wider mb-1">Your Fee</p>
              <div className="flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-numeric font-bold text-emerald-900 dark:text-emerald-300 truncate">
                  {formatCurrency(attendanceAmount)}
                </span>
              </div>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 border border-border/50 flex flex-col justify-center">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Attendance</p>
              <div className="mt-0.5">
                {getAttendanceBadge(attendanceStatus)}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-border/60 flex items-center w-full">
              <label htmlFor={`attend-${event?.crew_assignment_id || 'new'}`} className="flex items-center gap-2 cursor-pointer w-full">
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : (
                  <Checkbox 
                    id={`attend-${event?.crew_assignment_id || 'new'}`}
                    checked={isAttended}
                    onCheckedChange={(checked) => handleAttendanceToggle({ stopPropagation: () => {} })}
                    className="w-4 h-4 data-[state=checked]:bg-[hsl(var(--badge-attendance-confirmed))] data-[state=checked]:text-white data-[state=checked]:border-[hsl(var(--badge-attendance-confirmed))]"
                  />
                )}
                <span className="text-sm font-medium text-foreground select-none">Mark as Attended</span>
              </label>
            </div>
            <Button 
              size="sm"
              variant="outline"
              className="w-full sm:w-auto shrink-0 bg-[hsl(var(--accent-yellow))]/10 text-[hsl(var(--accent-yellow-active))] border-[hsl(var(--accent-yellow))]/50 hover:bg-[hsl(var(--accent-yellow))] hover:text-black transition-colors"
              onClick={openDownloadModal}
            >
              <File className="w-4 h-4 mr-2" />
              Files ({filesCount})
            </Button>
          </div>
        </CardContent>

        <CardFooter className="px-5 py-3 border-t border-border/50 bg-muted/20 group-hover:bg-[#FFFBEB]/40 transition-colors flex justify-end items-center">
          <div className="flex items-center gap-1 text-sm font-semibold text-[hsl(var(--accent-yellow-active))] transition-colors">
            View Details <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardFooter>
      </Card>

      {isModalOpen && event?.order_id && (
        <DownloadFilesModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          orderId={event.order_id} 
        />
      )}
    </>
  );
};

export default CrewEventCard;