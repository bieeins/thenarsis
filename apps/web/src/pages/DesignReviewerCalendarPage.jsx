import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { useDesignWorkSubscription } from '@/hooks/useDesignWorkSubscription.js';
import { Button } from '@/components/ui/button.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import CalendarControls from '@/components/CalendarControls.jsx';
import CalendarGrid from '@/components/CalendarGrid.jsx';
import CalendarSummaryCards from '@/components/CalendarSummaryCards.jsx';
import CalendarEventModal from '@/components/CalendarEventModal.jsx';

const DesignReviewerCalendarPage = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timezone, setTimezone] = useState('Asia/Jakarta');
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  const { designWorks, loading, error } = useDesignWorkSubscription();

  const formattedEvents = useMemo(() => {
    return designWorks.map(w => {
      const order = w.expand?.order_id || {};
      const designer = w.expand?.designer_id || {};
      const crewNames = w.assigned_crews && w.assigned_crews.length > 0 
        ? w.assigned_crews.map(c => c.name).join(', ') 
        : null;

      return {
        ...order,
        id: order.id || w.id,
        design_work_id: w.id,
        event_name: `${order.event_name || 'Unnamed Event'} (${designer.name || 'Unassigned'})`,
        event_date: order.event_date || w.created,
        status: w.status || 'pending',
        design_file_link: w.design_file_link,
        designer_name: designer.name,
        crew_names: crewNames,
        expand: { ...order.expand }
      };
    });
  }, [designWorks]);

  const eventsByDate = useMemo(() => {
    return formattedEvents.reduce((acc, event) => {
      if (!event.event_date) return acc;
      try {
        const dateStr = format(parseISO(event.event_date), 'yyyy-MM-dd');
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(event);
      } catch (err) {
        console.warn(`Error parsing date for event ${event.id}`);
      }
      return acc;
    }, {});
  }, [formattedEvents]);

  const stats = useMemo(() => {
    const currentMonthEvents = formattedEvents.filter(e => {
      if (!e.event_date) return false;
      const d = parseISO(e.event_date);
      return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });

    return {
      total: currentMonthEvents.length,
      pending: currentMonthEvents.filter(e => e.status === 'pending').length,
      inProgress: currentMonthEvents.filter(e => e.status === 'in_progress').length,
      completed: currentMonthEvents.filter(e => e.status === 'completed' || e.status === 'revision').length,
      cancelled: currentMonthEvents.filter(e => e.status === 'cancelled').length,
    };
  }, [formattedEvents, currentDate]);

  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  const handleModalClose = () => {
    setSelectedEvent(null);
  };

  return (
    <>
      <Helmet>
        <title>Reviewer Calendar - Thenarsis</title>
      </Helmet>

      <div className="min-h-screen bg-muted/30 py-8">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-balance">
              <CalendarIcon className="w-8 h-8 text-primary" />
              Design Review Calendar
            </h1>
            <p className="text-muted-foreground mt-1">Calendar view of all scheduled design work across the organization</p>
          </div>

          <CalendarSummaryCards stats={stats} />
          
          <CalendarControls 
            currentDate={currentDate} 
            setCurrentDate={setCurrentDate} 
            timezone={timezone} 
            setTimezone={setTimezone} 
          />

          {error && !loading && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-6 mb-6 flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-10 h-10 mb-3 text-destructive" />
              <h3 className="font-bold text-lg mb-1">Failed to load calendar data</h3>
              <p className="text-sm opacity-90 mb-4">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="bg-card border rounded-xl p-6 shadow-sm h-[800px] flex flex-col">
              <div className="grid grid-cols-7 gap-4 mb-4">
                {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
              <div className="flex-1 grid grid-cols-7 grid-rows-5 gap-4">
                {Array.from({ length: 35 }).map((_, i) => <Skeleton key={i} className="h-full w-full rounded-lg" />)}
              </div>
            </div>
          ) : !error ? (
            <CalendarGrid 
              currentDate={currentDate} 
              eventsByDate={eventsByDate} 
              onEventClick={handleEventClick}
              timezone={timezone}
            />
          ) : null}

        </div>
      </div>

      <CalendarEventModal 
        isOpen={!!selectedEvent} 
        onClose={handleModalClose} 
        event={selectedEvent} 
      />
    </>
  );
};

export default DesignReviewerCalendarPage;