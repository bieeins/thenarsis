import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Calendar, CheckCircle2, XCircle, HelpCircle, Percent } from 'lucide-react';
import { useCrewEvents } from '@/hooks/useCrewEvents.js';
import CrewEventDataTable from '@/components/CrewEventDataTable.jsx';

const CrewEventsDirectory = () => {
  const { events, loading, error, loadData, toggleAttendance } = useCrewEvents();

  // Compute stats safely from events
  const stats = useMemo(() => {
    const safeEvents = events || [];
    const total = safeEvents.length;
    const hadir = safeEvents.filter(e => e?.attendance_status === 'hadir').length;
    const tidakHadir = safeEvents.filter(e => e?.attendance_status === 'tidak_hadir').length;
    const belumJawab = safeEvents.filter(e => !e?.attendance_status || e?.attendance_status === 'belum_jawab').length;
    const percentage = total > 0 ? Math.round((hadir / total) * 100) : 0;
    
    return { total, hadir, tidakHadir, belumJawab, percentage };
  }, [events]);

  return (
    <>
      <Helmet>
        <title>Events Directory - Thenarsis</title>
      </Helmet>

      <div className="min-h-screen bg-muted/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumbs */}
          <div className="flex items-center text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/crew-dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground font-medium">My Events Directory</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-balance">My Events Directory</h1>
            <p className="text-muted-foreground mt-2 text-lg max-w-2xl">
              View all your assigned events, track your attendance statistics, and manage your schedule.
            </p>
          </div>

          {/* Summary Stats Cards - Displaying safely even if there's an error */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <Card className="bg-slate-950 text-white border-transparent shadow-lg hover:-translate-y-1 transition-transform duration-300">
              <CardContent className="p-5 flex flex-col items-start">
                <div className="p-2.5 bg-white/10 rounded-xl mb-4">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-medium text-white/70">Total Events</p>
                <p className="text-3xl font-bold mt-1 font-numeric">
                  {loading ? '-' : stats.total}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-emerald-50 text-emerald-900 border-emerald-200 shadow-sm hover:-translate-y-1 transition-transform duration-300">
              <CardContent className="p-5 flex flex-col items-start">
                <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl mb-4">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-emerald-700/80">Hadir</p>
                <p className="text-3xl font-bold mt-1 font-numeric text-emerald-700">
                  {loading ? '-' : stats.hadir}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-red-50 text-red-900 border-red-200 shadow-sm hover:-translate-y-1 transition-transform duration-300">
              <CardContent className="p-5 flex flex-col items-start">
                <div className="p-2.5 bg-red-100 text-red-600 rounded-xl mb-4">
                  <XCircle className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-red-700/80">Tidak Hadir</p>
                <p className="text-3xl font-bold mt-1 font-numeric text-red-700">
                  {loading ? '-' : stats.tidakHadir}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-50 text-slate-800 border-slate-200 shadow-sm hover:-translate-y-1 transition-transform duration-300">
              <CardContent className="p-5 flex flex-col items-start">
                <div className="p-2.5 bg-slate-200 text-slate-600 rounded-xl mb-4">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-slate-600">Belum Jawab</p>
                <p className="text-3xl font-bold mt-1 font-numeric text-slate-700">
                  {loading ? '-' : stats.belumJawab}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 text-blue-900 border-blue-200 shadow-sm hover:-translate-y-1 transition-transform duration-300">
              <CardContent className="p-5 flex flex-col items-start">
                <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl mb-4">
                  <Percent className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-blue-700/80">Attendance Rate</p>
                <p className="text-3xl font-bold mt-1 font-numeric text-blue-700">
                  {loading ? '-' : `${stats.percentage}%`}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <CrewEventDataTable 
              events={events} 
              loading={loading} 
              error={error} 
              onToggleAttendance={toggleAttendance}
              onRetry={loadData}
            />
          </div>

        </div>
      </div>
    </>
  );
};

export default CrewEventsDirectory;