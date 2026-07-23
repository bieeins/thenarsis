import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import pb from '@/lib/pocketbaseClient.js';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';

import CalendarSummaryCards from '@/components/CalendarSummaryCards.jsx';
import CalendarFilterBar from '@/components/CalendarFilterBar.jsx';
import CalendarControls from '@/components/CalendarControls.jsx';
import CalendarGrid from '@/components/CalendarGrid.jsx';

const DesignerCalendarPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timezone, setTimezone] = useState('Asia/Jakarta');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [packages, setPackages] = useState([]);
  
  const [filters, setFilters] = useState({
    search: '',
    status: 'All',
    package: 'All'
  });

  const loadAssignments = useCallback(async () => {
    if (!currentUser?.id) return;
    
    setLoading(true);
    setError(null);
    try {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(monthStart);
      const startDate = startOfWeek(monthStart).toISOString();
      const endDate = endOfWeek(monthEnd).toISOString();

      const records = await pb.collection('design_work').getFullList({
        filter: `designer_id = "${currentUser.id}" && order_id.event_date >= "${startDate}" && order_id.event_date <= "${endDate}"`,
        expand: 'order_id,order_id.product_id',
        sort: 'order_id.event_date',
        $autoCancel: false
      });

      const mappedEvents = records.map(r => {
        const order = r.expand?.order_id || {};
        return {
          ...order,
          design_work_id: r.id,
          // If order is missing details, fallback to design_work data
          status: order.status || r.status || 'Pending',
          event_name: order.event_name || 'Design Task',
          event_date: order.event_date || r.created
        };
      });

      setEvents(mappedEvents);

      const uniquePkgs = [...new Set(records.map(r => r.expand?.order_id?.expand?.product_id?.package_name).filter(Boolean))];
      setPackages(uniquePkgs);

    } catch (err) {
      console.error('[DesignerCalendar] Failed to load assignments:', err);
      setError(err.message || 'Failed to load your calendar events');
      toast.error('Failed to load your calendar events');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, currentDate]);

  useEffect(() => {
    loadAssignments();

    let unsubDesign, unsubOrders;
    
    pb.collection('design_work').subscribe('*', function (e) {
      if (e.record.designer_id === currentUser?.id) {
        loadAssignments();
      }
    }).then(u => unsubDesign = u).catch(console.error);

    pb.collection('orders').subscribe('*', function (e) {
      loadAssignments();
    }).then(u => unsubOrders = u).catch(console.error);

    return () => {
      if (unsubDesign) pb.collection('design_work').unsubscribe('*').catch(console.error);
      if (unsubOrders) pb.collection('orders').unsubscribe('*').catch(console.error);
    };
  }, [loadAssignments, currentUser?.id]);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (filters.status !== 'All' && event.status !== filters.status) return false;
      if (filters.package !== 'All' && event.expand?.product_id?.package_name !== filters.package) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchName = (event.event_name || '').toLowerCase().includes(q);
        const matchCustomer = (event.customer_name || '').toLowerCase().includes(q);
        if (!matchName && !matchCustomer) return false;
      }
      return true;
    });
  }, [events, filters]);

  const eventsByDate = useMemo(() => {
    return filteredEvents.reduce((acc, event) => {
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
  }, [filteredEvents]);

  const stats = useMemo(() => {
    const currentMonthEvents = filteredEvents.filter(e => {
      if (!e.event_date) return false;
      const d = parseISO(e.event_date);
      return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });

    return {
      total: currentMonthEvents.length,
      pending: currentMonthEvents.filter(e => e.status === 'Pending').length,
      inProgress: currentMonthEvents.filter(e => e.status === 'In Progress').length,
      completed: currentMonthEvents.filter(e => e.status === 'Completed').length,
      cancelled: currentMonthEvents.filter(e => e.status === 'Cancelled').length,
    };
  }, [filteredEvents, currentDate]);

  const handleEventClick = (event) => {
    navigate(`/designer/project/${event.design_work_id}`);
  };

  return (
    <>
      <Helmet>
        <title>Designer Calendar - Thenarsis</title>
      </Helmet>

      <div className="min-h-screen bg-muted/30 py-8">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <div className="flex items-center text-sm text-muted-foreground mb-2">
                <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
                <span className="mx-2">/</span>
                <Link to="/designer-dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
                <span className="mx-2">/</span>
                <span className="text-foreground font-medium">Calendar</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-balance">
                <CalendarIcon className="w-8 h-8 text-primary" />
                Designer Calendar
              </h1>
              <p className="text-muted-foreground mt-1">View your assigned design tasks and project deadlines</p>
            </div>
          </div>

          <CalendarSummaryCards stats={stats} />
          <CalendarFilterBar filters={filters} setFilters={setFilters} packages={packages} />
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
              <Button variant="outline" onClick={loadAssignments}>Try Again</Button>
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
          ) : !error && filteredEvents.length === 0 && Object.keys(filters).every(k => filters[k] === 'All' || filters[k] === '') ? (
            <div className="bg-card border rounded-xl p-16 shadow-sm flex flex-col items-center justify-center text-center h-[600px]">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                <CalendarIcon className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">No projects scheduled</h3>
              <p className="text-muted-foreground max-w-md">
                You have no assigned design tasks for {format(currentDate, 'MMMM yyyy')}.
              </p>
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
    </>
  );
};

export default DesignerCalendarPage;