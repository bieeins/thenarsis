import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { isBefore, startOfDay } from 'date-fns';
import { ChevronRight, Home, Search, FilterX, CalendarDays, AlertCircle, RefreshCcw, CalendarX } from 'lucide-react';
import { useCrewEvents } from '@/hooks/useCrewEvents.js';
import CrewEventHubCard from '@/components/CrewEventHubCard.jsx';
import ErrorBoundary from '@/components/ErrorBoundary.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';

const CrewMyEventHubPageContent = () => {
  const { events, loading, error, loadData } = useCrewEvents();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [packageFilter, setPackageFilter] = useState('All');
  const [sortBy, setSortBy] = useState('date_asc');

  // Extract unique packages for filter dropdown
  const packageOptions = useMemo(() => {
    if (!events) return [];
    const pkgs = new Set(events.map(e => e?.package_name).filter(Boolean));
    return Array.from(pkgs).sort();
  }, [events]);

  const filteredAndSortedEvents = useMemo(() => {
    let result = Array.isArray(events) ? [...events] : [];

    // Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e => {
        if (!e) return false;
        return (e.event_name?.toLowerCase().includes(q)) || 
               (e.customer_name?.toLowerCase().includes(q)) || 
               (e.event_location?.toLowerCase().includes(q));
      });
    }

    // Status Filter
    if (statusFilter !== 'All') {
      result = result.filter(e => e?.status?.toLowerCase() === statusFilter.toLowerCase());
    }

    // Date Filter (Upcoming / Past)
    if (dateFilter !== 'All') {
      const today = startOfDay(new Date());
      result = result.filter(e => {
        if (!e?.event_date) return false;
        const eDate = new Date(e.event_date);
        if (dateFilter === 'upcoming') return !isBefore(eDate, today);
        if (dateFilter === 'past') return isBefore(eDate, today);
        return true;
      });
    }

    // Package Filter
    if (packageFilter !== 'All') {
      result = result.filter(e => e?.package_name === packageFilter);
    }

    // Sorting
    result.sort((a, b) => {
      if (!a || !b) return 0;
      
      if (sortBy === 'date_asc' || sortBy === 'date_desc') {
        const dateA = new Date(a.event_date || 0).getTime();
        const dateB = new Date(b.event_date || 0).getTime();
        return sortBy === 'date_asc' ? dateA - dateB : dateB - dateA;
      }
      
      if (sortBy === 'customer_asc') {
        return (a.customer_name || '').localeCompare(b.customer_name || '');
      }
      
      if (sortBy === 'customer_desc') {
        return (b.customer_name || '').localeCompare(a.customer_name || '');
      }
      
      if (sortBy === 'status') {
        return (a.status || '').localeCompare(b.status || '');
      }

      return 0;
    });

    return result;
  }, [events, searchQuery, statusFilter, dateFilter, packageFilter, sortBy]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setDateFilter('All');
    setPackageFilter('All');
    setSortBy('date_asc');
  };

  const activeFiltersCount = [
    searchQuery.trim() !== '',
    statusFilter !== 'All',
    dateFilter !== 'All',
    packageFilter !== 'All',
    sortBy !== 'date_asc'
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
          <Link to="/crew-dashboard" className="hover:text-primary flex items-center gap-1 transition-colors">
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">My Event Hub</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">My Event Hub</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            All events assigned to you. Manage your schedule, view details, and confirm attendance.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="bg-card border rounded-2xl p-5 shadow-sm mb-8">
          <div className="flex flex-col xl:flex-row gap-4">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search events, customers, locations..." 
                className="pl-9 h-11 border-border/60 focus-visible:ring-[hsl(var(--accent-yellow))]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 xl:w-auto shrink-0">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 border-border/60">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="h-11 border-border/60">
                  <SelectValue placeholder="Timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Dates</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                </SelectContent>
              </Select>

              <Select value={packageFilter} onValueChange={setPackageFilter}>
                <SelectTrigger className="h-11 border-border/60">
                  <SelectValue placeholder="Package" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Packages</SelectItem>
                  {packageOptions.map(pkg => (
                    <SelectItem key={pkg} value={pkg}>{pkg}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-11 border-border/60">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_asc">Date (Old-New)</SelectItem>
                  <SelectItem value="date_desc">Date (New-Old)</SelectItem>
                  <SelectItem value="customer_asc">Customer (A-Z)</SelectItem>
                  <SelectItem value="customer_desc">Customer (Z-A)</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {activeFiltersCount > 0 && (
              <Button 
                variant="outline" 
                className="h-11 px-4 xl:w-auto text-muted-foreground shrink-0"
                onClick={handleClearFilters}
              >
                <FilterX className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Clear</span>
              </Button>
            )}
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="border rounded-2xl p-6 h-[260px] flex flex-col bg-card shadow-sm border-l-4 border-l-muted">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <div className="space-y-3 mb-6">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-auto">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border shadow-sm">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Error Loading Events</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">{error}</p>
            <Button onClick={loadData} className="bg-[hsl(var(--accent-yellow))] hover:bg-[hsl(var(--accent-yellow-hover))] text-black">
              <RefreshCcw className="w-4 h-4 mr-2" /> Retry
            </Button>
          </div>
        ) : (!events || events.length === 0) ? (
          <div className="text-center py-24 bg-card rounded-2xl border border-dashed border-border shadow-sm flex flex-col items-center">
            <div className="w-20 h-20 bg-amber-50 dark:bg-amber-950/30 rounded-full flex items-center justify-center mb-6">
              <CalendarDays className="w-10 h-10 text-[hsl(var(--accent-yellow))]" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">No events assigned yet</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              You haven't been assigned to any fieldwork. Once an owner assigns you to an event, it will appear here.
            </p>
          </div>
        ) : filteredAndSortedEvents.length === 0 ? (
          <div className="text-center py-24 bg-card rounded-2xl border border-dashed border-border shadow-sm flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-6">
              <CalendarX className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">No results found</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              We couldn't find any events matching your current filters.
            </p>
            <Button variant="outline" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedEvents.map(event => (
              <CrewEventHubCard key={event.crew_assignment_id} event={event} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

const CrewMyEventHubPage = () => {
  return (
    <>
      <Helmet>
        <title>My Event Hub - Thenarsis Crew</title>
      </Helmet>
      <ErrorBoundary>
        <CrewMyEventHubPageContent />
      </ErrorBoundary>
    </>
  );
};

export default CrewMyEventHubPage;