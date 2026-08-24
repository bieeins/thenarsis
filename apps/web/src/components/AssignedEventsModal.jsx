import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Calendar, MapPin, Package, Clock, User, Banknote, ChevronRight, CalendarX, AlertCircle, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

const AssignedEventsModal = ({ isOpen, onOpenChange, events, loading, error, onRetry }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      console.group(`[AssignedEventsModal] 🔍 State Logging`);
      console.log(`(1) Modal Status: OPENED`);
      console.log(`(2) Data Received From Parent ->`);
      console.log(`    Loading: ${loading}`);
      console.log(`    Error: ${error}`);
      
      const safeEvents = Array.isArray(events) ? events : [];
      console.log(`    Events Count: ${safeEvents.length}`);
      console.log(`    Events Array:`, safeEvents);
      
      if (safeEvents.length > 0) {
        console.log(`    Structure Validation (First Event):`, safeEvents[0]);
      } else {
        console.log(`    No events available for structure validation.`);
      }
      console.groupEnd();
    } else {
      console.log(`[AssignedEventsModal] Modal Status: CLOSED`);
    }
  }, [isOpen, loading, error, events]);

  const handleEventClick = (orderId) => {
    if (!orderId) {
      toast.error('Cannot navigate: Order ID missing');
      console.error('[AssignedEventsModal] ❌ handleEventClick Failed: No orderId provided.');
      return;
    }
    console.log(`[AssignedEventsModal] Navigating to detail: ${orderId}`);
    onOpenChange(false);
    navigate(`/crew/event/${orderId}`);
  };

  const getOrderStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    switch (s) {
      case 'pending': return <Badge className="bg-[#FBBF24] text-yellow-950 border-0 font-semibold">Pending</Badge>;
      case 'confirmed': return <Badge className="bg-indigo-500 text-white border-0 font-semibold">Confirmed</Badge>;
      case 'in progress': return <Badge className="bg-blue-500 text-white border-0 font-semibold">In Progress</Badge>;
      case 'completed': return <Badge className="bg-emerald-500 text-white border-0 font-semibold">Completed</Badge>;
      case 'cancelled': return <Badge className="bg-red-500 text-white border-0 font-semibold">Cancelled</Badge>;
      default: return <Badge className="bg-slate-200 text-slate-800 border-0 font-semibold">{status || 'Unknown'}</Badge>;
    }
  };

  const getAttendanceBadge = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'confirmed') return <Badge className="bg-[hsl(var(--badge-attendance-confirmed))] text-white border-0 font-semibold shadow-sm text-[10px] px-1.5 py-0 leading-tight">Confirmed</Badge>;
    if (s === 'completed') return <Badge className="bg-[hsl(var(--badge-attendance-completed))] text-white border-0 font-semibold shadow-sm text-[10px] px-1.5 py-0 leading-tight">Completed</Badge>;
    return <Badge className="bg-[hsl(var(--badge-attendance-pending))] text-black border-0 font-semibold shadow-sm text-[10px] px-1.5 py-0 leading-tight">Pending</Badge>;
  };

  const formatCurrency = (amt) => {
    try {
      if (amt === undefined || amt === null || isNaN(Number(amt))) return 'Rp 0';
      return `Rp ${Math.round(Number(amt)).toLocaleString('id-ID')}`;
    } catch {
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

  const safeEvents = Array.isArray(events) ? events : [];

  console.log(`[AssignedEventsModal] (3) Rendering Modal Content. Open=${isOpen}`);
  
  if (error && isOpen) {
    console.error(`[AssignedEventsModal] (4) ❌ Rendering Error State:`, error);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] w-[90vw] max-h-[85vh] p-0 flex flex-col overflow-hidden bg-card border-border rounded-2xl shadow-xl">
        <DialogHeader className="p-6 border-b border-border/50 bg-slate-50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <div className="p-2 bg-[hsl(var(--accent-yellow))]/20 rounded-lg">
                <Calendar className="w-5 h-5 text-[hsl(var(--accent-yellow-active))]" />
              </div>
              Assigned Events
            </DialogTitle>
            {!loading && !error && (
              <Badge variant="outline" className="bg-background text-foreground font-bold shadow-sm px-3 py-1 text-sm border-border">
                {safeEvents.length} Total
              </Badge>
            )}
          </div>
          <DialogDescription className="text-muted-foreground mt-2">
            A complete list of all events you have been assigned to.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/10">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card border border-border/60 rounded-xl p-4 sm:p-5">
                  <div className="flex justify-between mb-3">
                    <div className="space-y-2 w-2/3">
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                  <div className="space-y-2 mb-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                  <div className="flex justify-between pt-3 border-t border-border/50">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 px-4 bg-background rounded-xl border border-dashed border-border/60">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <p className="text-lg font-bold text-foreground mb-2">Failed to load events</p>
              <p className="text-sm text-muted-foreground mb-6">{error}</p>
              {onRetry && (
                <Button onClick={onRetry} variant="outline" className="gap-2">
                  <RefreshCcw className="w-4 h-4" /> Retry
                </Button>
              )}
            </div>
          ) : safeEvents.length === 0 ? (
            <div className="text-center py-16 px-4 bg-background rounded-xl border border-dashed border-border/60">
              <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarX className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="text-lg font-bold text-foreground mb-1">No events assigned yet</p>
              <p className="text-sm text-muted-foreground">You currently do not have any valid event assignments.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {safeEvents.map((evt) => {
                if (!evt) return null;
                return (
                  <div 
                    key={evt.crew_assignment_id || `temp-${Math.random()}`} 
                    onClick={() => handleEventClick(evt.order_id)}
                    className="group bg-card border border-border/60 rounded-xl p-4 sm:p-5 hover:border-[hsl(var(--accent-yellow))] hover:shadow-md cursor-pointer transition-all duration-200 relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[hsl(var(--accent-yellow))] to-[hsl(var(--accent-yellow-active))] opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h4 className="font-bold text-base md:text-lg leading-tight text-foreground line-clamp-1 group-hover:text-[hsl(var(--accent-yellow-active))] transition-colors">
                          {evt.event_name || 'Unnamed Event'}
                        </h4>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                          <User className="w-3.5 h-3.5" />
                          <span className="truncate">{evt.customer_name || 'Unknown Customer'}</span>
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-2">
                        {getOrderStatusBadge(evt.status)}
                        {getAttendanceBadge(evt.attendance_status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 mb-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
                        <span className="font-medium text-foreground">{formatDate(evt.event_date)}</span>
                        <span className="mx-0.5">•</span>
                        <Clock className="w-3.5 h-3.5 text-muted-foreground/70" />
                        <span>{formatTime(evt.event_time)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                        <span className="line-clamp-1">{evt.event_location || 'TBD'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                        <span className="line-clamp-1">{evt.package_name || 'Custom Package'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500 font-semibold bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-md">
                        <Banknote className="w-4 h-4" />
                        <span className="font-numeric text-sm">{formatCurrency(evt.attendance_amount)}</span>
                      </div>
                      <div className="text-xs font-semibold text-muted-foreground flex items-center group-hover:text-[hsl(var(--accent-yellow-active))] transition-colors">
                        View Details
                        <ChevronRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignedEventsModal;