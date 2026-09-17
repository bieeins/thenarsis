import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Camera, ArrowRight, CheckCircle2, CalendarDays, AlertCircle, RefreshCcw, Activity, Calendar as CalendarIcon, Banknote } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useCrewEvents } from '@/hooks/useCrewEvents.js';
import AssignedEventsModal from '@/components/AssignedEventsModal.jsx';
import ErrorBoundary from '@/components/ErrorBoundary.jsx';
import { formatRupiah } from '@/lib/currency.js';

import '@/lib/debugUtils.js';

const CrewDashboardContent = () => {
  const { currentUser } = useAuth();
  const { events, loading: eventsLoading, error: eventsError, refetch } = useCrewEvents();
  const [isAssignedEventsModalOpen, setIsAssignedEventsModalOpen] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  const stats = useMemo(() => {
    if (!Array.isArray(events)) {
      return { totalAssigned: 0, confirmed: 0, completed: 0, pending: 0 };
    }
    
    return {
      totalAssigned: events.length,
      confirmed: events.filter(e => e && e.attendance_status === 'confirmed').length,
      completed: events.filter(e => e && e.attendance_status === 'completed').length,
      totalFee: events.reduce((sum, e) => sum + (e && e.attendance_amount ? Number(e.attendance_amount) : 0), 0)
    };
  }, [events]);

  const handleTotalAssignedClick = () => {
    if (!eventsError) {
      setIsAssignedEventsModalOpen(true);
    }
  };

  return (
    <>
      <Helmet>
        <title>Crew Dashboard - Thenarsis</title>
      </Helmet>

      <div className="min-h-screen bg-muted/30 py-8 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-balance">
                Welcome, {currentUser?.name?.split(' ')[0] || 'Crew Member'}!
              </h1>
              <p className="text-muted-foreground mt-1 text-balance text-lg">Here's your schedule and attendance overview.</p>
            </div>
            <div className="flex gap-3">
              <Button asChild variant="outline" className="shadow-sm">
                <Link to="/crew-calendar">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Calendar
                </Link>
              </Button>
              <Button asChild className="bg-[hsl(var(--accent-yellow))] hover:bg-[hsl(var(--accent-yellow-hover))] text-black font-semibold shadow-md transition-colors">
                <Link to="/crew/my-events">
                  <CalendarDays className="w-4 h-4 mr-2" />
                  My Events
                </Link>
              </Button>
            </div>
          </div>

          {eventsError && (
            <div className="mb-8 bg-destructive/10 border border-destructive/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-destructive/20 rounded-full text-destructive shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-destructive">Failed to load dashboard data</h3>
                  <p className="text-sm text-destructive/80">{eventsError}</p>
                </div>
              </div>
              <Button onClick={() => refetch()} variant="outline" className="shrink-0 border-destructive/30 text-destructive hover:bg-destructive/20">
                <RefreshCcw className="w-4 h-4 mr-2" /> Retry
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Link to="/crew-calendar" className="block group">
              <div className="bg-card border border-border/60 rounded-2xl p-6 md:p-8 flex flex-col items-start justify-between h-full shadow-sm hover:shadow-md transition-all group-hover:-translate-y-1">
                <div className="bg-primary/10 text-primary p-4 rounded-xl mb-4 group-hover:scale-105 transition-transform">
                  <CalendarIcon className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-2">Crew Calendar</h2>
                  <p className="text-muted-foreground text-sm text-balance mb-4">View your schedule in a monthly grid, check upcoming assignments, and plan your availability.</p>
                  <span className="text-primary font-medium text-sm flex items-center">
                    View Calendar <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            </Link>

            <Link to="/crew/my-events" className="block group">
              <div className="bg-slate-950 rounded-2xl p-6 md:p-8 flex flex-col items-start justify-between h-full shadow-xl relative overflow-hidden transition-transform group-hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--accent-yellow))]/10 to-transparent pointer-events-none" />
                <div className="relative z-10 bg-[hsl(var(--accent-yellow))] text-black p-4 rounded-xl mb-4 shadow-lg group-hover:scale-105 transition-transform">
                  <CalendarDays className="w-8 h-8" />
                </div>
                <div className="relative z-10">
                  <h2 className="text-xl font-bold text-white mb-2">My Events Hub</h2>
                  <p className="text-zinc-400 text-sm text-balance mb-4">Access the full list of your assigned events, track your attendance, and manage your field schedule.</p>
                  <span className="text-[hsl(var(--accent-yellow))] font-medium text-sm flex items-center">
                    Open Hub <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card
              className={`border border-border/60 shadow-sm transition-all duration-300 group relative overflow-hidden bg-card ${!eventsError ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02]' : 'opacity-75'}`}
              onClick={handleTotalAssignedClick}
            >
              {!eventsError && <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--accent-yellow))]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />}
              <CardContent className="p-6 flex items-center gap-5 relative z-10">
                <div className="p-4 bg-[hsl(var(--accent-yellow))]/10 text-[hsl(var(--accent-yellow-active))] rounded-2xl shrink-0 group-hover:bg-[hsl(var(--accent-yellow))] group-hover:text-black transition-colors">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Total Assigned</p>
                  {eventsLoading ? (
                    <Skeleton className="h-9 w-16 mt-1" />
                  ) : eventsError ? (
                    <p className="text-xl font-bold text-muted-foreground mt-1">--</p>
                  ) : (
                    <p className="text-3xl font-extrabold font-numeric mt-0.5 break-words">{stats.totalAssigned}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/60 shadow-sm">
              <CardContent className="p-6 flex items-center gap-5">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-2xl shrink-0 border border-emerald-100 dark:border-emerald-900/50">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Confirmed</p>
                  {eventsLoading ? (
                    <Skeleton className="h-9 w-16 mt-1" />
                  ) : eventsError ? (
                    <p className="text-xl font-bold text-muted-foreground mt-1">--</p>
                  ) : (
                    <p className="text-3xl font-extrabold font-numeric text-emerald-700 dark:text-emerald-500 mt-0.5 break-words">{stats.confirmed}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/60 shadow-sm">
              <CardContent className="p-6 flex items-center gap-5">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-2xl shrink-0 border border-blue-100 dark:border-blue-900/50">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  {eventsLoading ? (
                    <Skeleton className="h-9 w-16 mt-1" />
                  ) : eventsError ? (
                    <p className="text-xl font-bold text-muted-foreground mt-1">--</p>
                  ) : (
                    <p className="text-3xl font-extrabold font-numeric text-blue-700 dark:text-blue-500 mt-0.5 break-words">{stats.completed}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/60 shadow-sm">
              <CardContent className="p-6 flex items-center gap-5">
                <div className="p-4 bg-teal-50 dark:bg-teal-950/40 text-teal-600 rounded-2xl shrink-0 border border-teal-100 dark:border-teal-900/50">
                  <Banknote className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Fee</p>
                  {eventsLoading ? (
                    <Skeleton className="h-9 w-24 mt-1" />
                  ) : eventsError ? (
                    <p className="text-xl font-bold text-muted-foreground mt-1">--</p>
                  ) : (
                    <p className="text-2xl font-extrabold font-numeric text-teal-700 dark:text-teal-500 mt-0.5 break-words">{formatRupiah(stats.totalFee)}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="fixed bottom-4 right-4 z-50">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="bg-black text-green-400 border-green-500 hover:bg-zinc-900 hover:text-green-300 opacity-50 hover:opacity-100 transition-opacity font-mono text-xs"
          >
            <Activity className="w-3 h-3 mr-2" />
            DEBUG
          </Button>
        </div>

        {showDebugPanel && (
          <div className="fixed bottom-16 right-4 w-96 max-h-[80vh] overflow-y-auto bg-black border border-green-500 rounded-lg p-4 z-50 shadow-2xl">
            <h3 className="text-green-400 font-mono text-sm font-bold border-b border-green-500/50 pb-2 mb-3">🛠️ DIAGNOSTICS</h3>
            <div className="space-y-2 text-xs font-mono text-green-300 break-words">
              <p><strong className="text-green-500">USER ID:</strong> {currentUser?.id}</p>
              <p><strong className="text-green-500">ROLE:</strong> {currentUser?.role}</p>
              <p><strong className="text-green-500">EVENTS FOUND:</strong> {Array.isArray(events) ? events.length : 0}</p>
              <p><strong className="text-green-500">LOADING STATE:</strong> {eventsLoading ? 'TRUE' : 'FALSE'}</p>
            </div>
          </div>
        )}

      </div>

      <AssignedEventsModal 
        isOpen={isAssignedEventsModalOpen} 
        onOpenChange={setIsAssignedEventsModalOpen} 
        events={events}
        loading={eventsLoading}
        error={eventsError}
        onRetry={refetch}
      />
    </>
  );
};

const CrewDashboard = () => (
  <ErrorBoundary>
    <CrewDashboardContent />
  </ErrorBoundary>
);

export default CrewDashboard;