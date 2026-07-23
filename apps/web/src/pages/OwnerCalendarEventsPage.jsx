import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar as CalendarIcon, Download, Printer, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { orderService } from '@/services/orderService.js';
import { crewAssignmentService } from '@/services/crewAssignmentService.js';
import { designWorkService } from '@/services/designWorkService.js';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

import CalendarSummaryCards from '@/components/CalendarSummaryCards.jsx';
import CalendarFilterBar from '@/components/CalendarFilterBar.jsx';
import CalendarControls from '@/components/CalendarControls.jsx';
import CalendarGrid from '@/components/CalendarGrid.jsx';
import CalendarEventModal from '@/components/CalendarEventModal.jsx';

const OwnerCalendarEventsPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timezone, setTimezone] = useState('Asia/Jakarta');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState([]);
  
  const [filters, setFilters] = useState({
    search: '',
    status: 'All',
    package: 'All'
  });

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch orders for the visible calendar range (plus a bit of buffer)
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(monthStart);
      const startDate = startOfWeek(monthStart).toISOString();
      const endDate = endOfWeek(monthEnd).toISOString();

      const records = await orderService.listAll({
        startDate,
        endDate,
        sort: 'event_date',
        order: 'asc',
      });
      const orderIds = new Set(records.map((r) => r.id));

      // Also fetch crew assignments to get crew names/count per order
      const allAssignments = await crewAssignmentService.listAll();
      const assignments = allAssignments.filter((a) => orderIds.has(a.order_id));

      const crewCountMap = {};
      const crewNamesMap = {};
      assignments.forEach(curr => {
        crewCountMap[curr.order_id] = (crewCountMap[curr.order_id] || 0) + 1;
        const crewName = curr.crew?.name;
        if (crewName) {
          crewNamesMap[curr.order_id] = crewNamesMap[curr.order_id]
            ? `${crewNamesMap[curr.order_id]}, ${crewName}`
            : crewName;
        }
      });

      // Fetch design_work to get the design asset link per order
      const allDesignWorks = await designWorkService.listAll({ sort: 'updated_at', order: 'desc' });
      const designWorks = allDesignWorks.filter((dw) => orderIds.has(dw.order_id));

      const designLinkMap = {};
      designWorks.forEach(dw => {
        if (!(dw.order_id in designLinkMap)) {
          designLinkMap[dw.order_id] = dw.design_file_link;
        }
      });

      const enrichedRecords = records.map(r => ({
        ...r,
        crewCount: crewCountMap[r.id] || 0,
        designer_name: r.assigned_designer?.name,
        crew_names: crewNamesMap[r.id],
        design_file_link: designLinkMap[r.id]
      }));

      setEvents(enrichedRecords);

      // Extract unique packages for filter
      const uniquePkgs = [...new Set(records.map(r => r.product?.package_name).filter(Boolean))];
      setPackages(uniquePkgs);

    } catch (error) {
      console.error('Failed to load calendar events:', error);
      toast.error('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    loadEvents();

    // Poll for updates since there's no realtime backend.
    const intervalId = setInterval(loadEvents, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [loadEvents]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isModalOpen) return;
      if (e.key === 'ArrowLeft') {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Apply filters
  const filteredEvents = events.filter(event => {
    if (filters.status !== 'All' && event.status !== filters.status) return false;
    if (filters.package !== 'All' && event.product?.package_name !== filters.package) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchName = (event.event_name || '').toLowerCase().includes(q);
      const matchCustomer = (event.customer_name || '').toLowerCase().includes(q);
      if (!matchName && !matchCustomer) return false;
    }
    return true;
  });

  // Group by date
  const eventsByDate = filteredEvents.reduce((acc, event) => {
    const dateStr = format(new Date(event.event_date), 'yyyy-MM-dd');
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(event);
    return acc;
  }, {});

  // Calculate stats for current month
  const currentMonthEvents = filteredEvents.filter(e => {
    const d = new Date(e.event_date);
    return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
  });

  const stats = {
    total: currentMonthEvents.length,
    pending: currentMonthEvents.filter(e => e.status === 'Pending').length,
    inProgress: currentMonthEvents.filter(e => e.status === 'In Progress').length,
    completed: currentMonthEvents.filter(e => e.status === 'Completed').length,
    cancelled: currentMonthEvents.filter(e => e.status === 'Cancelled').length,
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleDeleteOrder = async (id) => {
    if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      try {
        await orderService.remove(id);
        toast.success('Order deleted successfully');
        setIsModalOpen(false);
        loadEvents();
      } catch (error) {
        toast.error('Failed to delete order');
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Event Name', 'Customer', 'Date', 'Time', 'Location', 'Status', 'Package', 'Amount'];
    const rows = filteredEvents.map(e => [
      `"${e.event_name || ''}"`,
      `"${e.customer_name || ''}"`,
      format(new Date(e.event_date), 'yyyy-MM-dd'),
      format(new Date(e.event_date), 'HH:mm'),
      `"${e.event_location || ''}"`,
      e.status,
      `"${e.product?.package_name || ''}"`,
      e.total_amount || 0
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `events_${format(currentDate, 'yyyy_MM')}.csv`;
    link.click();
  };

  return (
    <>
      <Helmet>
        <title>Calendar Events - Thenarsis</title>
      </Helmet>

      <div className="min-h-screen bg-muted/30 py-8 print:bg-white print:py-0">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
            <div>
              <div className="flex items-center text-sm text-muted-foreground mb-2">
                <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
                <span className="mx-2">/</span>
                <Link to="/owner-dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
                <span className="mx-2">/</span>
                <span className="text-foreground font-medium">Calendar Events</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">Calendar Events</h1>
              <p className="text-muted-foreground mt-1">View all event orders in calendar format</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleExportCSV}>
                <FileText className="w-4 h-4 mr-2" /> Export CSV
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" /> Print
              </Button>
            </div>
          </div>

          <div className="print:hidden">
            <CalendarSummaryCards stats={stats} />
            <CalendarFilterBar filters={filters} setFilters={setFilters} packages={packages} />
            <CalendarControls 
              currentDate={currentDate} 
              setCurrentDate={setCurrentDate} 
              timezone={timezone} 
              setTimezone={setTimezone} 
            />
          </div>

          {/* Calendar Area */}
          {loading ? (
            <div className="bg-card border rounded-xl p-6 shadow-sm h-[800px] flex flex-col">
              <div className="grid grid-cols-7 gap-4 mb-4">
                {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
              <div className="flex-1 grid grid-cols-7 grid-rows-5 gap-4">
                {Array.from({ length: 35 }).map((_, i) => <Skeleton key={i} className="h-full w-full rounded-lg" />)}
              </div>
            </div>
          ) : filteredEvents.length === 0 && Object.keys(filters).every(k => filters[k] === 'All' || filters[k] === '') ? (
            <div className="bg-card border rounded-xl p-16 shadow-sm flex flex-col items-center justify-center text-center h-[600px]">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                <CalendarIcon className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">No events scheduled</h3>
              <p className="text-muted-foreground max-w-md">
                There are no events scheduled for {format(currentDate, 'MMMM yyyy')}. 
                Try navigating to a different month or creating a new order.
              </p>
              <Button className="mt-6" onClick={() => document.querySelector('a[href="/orders"]').click()}>
                Manage Orders
              </Button>
            </div>
          ) : (
            <CalendarGrid 
              currentDate={currentDate} 
              eventsByDate={eventsByDate} 
              onEventClick={handleEventClick}
              timezone={timezone}
            />
          )}

        </div>
      </div>

      <CalendarEventModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        event={selectedEvent} 
        onDelete={handleDeleteOrder}
      />
    </>
  );
};

export default OwnerCalendarEventsPage;