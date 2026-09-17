import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, Clock, CheckCircle2, ArrowRight, FileEdit, Banknote } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { designWorkService } from '@/services/designWorkService.js';
import { toast } from 'sonner';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { formatRupiah } from '@/lib/currency.js';

const DesignerDashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    inRevision: 0,
    completed: 0,
    totalFee: 0
  });
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    }
  }, [currentUser]);

  const loadDashboardData = async () => {
    try {
      // Load design work for current designer
      const records = await designWorkService.listAll({
        designerId: currentUser.id,
        sort: 'created_at',
        order: 'desc',
      });

      // Compute stats using new database values
      const total = records.length;
      const inProgress = records.filter(r => r.status === 'in_progress').length;
      const inRevision = records.filter(r => r.status === 'revision').length;
      const completed = records.filter(r => r.status === 'completed').length;
      const totalFee = records.reduce((sum, r) => sum + (r.design_fee ? Number(r.design_fee) : 0), 0);

      setStats({ total, inProgress, inRevision, completed, totalFee });

      // Upcoming projects in next 7 days based on event_date
      const today = new Date();
      const nextWeek = addDays(today, 7);
      
      const upcomingWork = records.filter(r => {
        if (!r.order?.event_date) return false;
        const eventDate = new Date(r.order.event_date);
        return isAfter(eventDate, today) && isBefore(eventDate, nextWeek) && r.status !== 'completed';
      }).sort((a, b) => new Date(a.order.event_date) - new Date(b.order.event_date));

      setUpcoming(upcomingWork.slice(0, 5));

    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Designer Dashboard - Thenarsis</title>
      </Helmet>

      <div className="min-h-screen bg-muted/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-balance">Welcome, {currentUser?.name?.split(' ')[0]}!</h1>
              <p className="text-muted-foreground mt-1 text-balance">Here's your creative workspace overview.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" asChild className="bg-card">
                <Link to="/designer/my-projects">View My Projects</Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-4 bg-primary/20 text-primary rounded-2xl shrink-0">
                  <Palette className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                  <p className="text-2xl font-bold font-numeric break-words">{stats.total}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-4 bg-blue-100 text-blue-700 rounded-2xl shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold font-numeric break-words">{stats.inProgress}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-4 bg-orange-100 text-orange-700 rounded-2xl shrink-0">
                  <FileEdit className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">In Revision</p>
                  <p className="text-2xl font-bold font-numeric break-words">{stats.inRevision}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-4 bg-green-100 text-green-700 rounded-2xl shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold font-numeric break-words">{stats.completed}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-4 bg-teal-100 text-teal-700 rounded-2xl shrink-0">
                  <Banknote className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Fee</p>
                  <p className="text-xl font-bold font-numeric break-words">{formatRupiah(stats.totalFee)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
              <div>
                <CardTitle>Upcoming Deadlines (Next 7 Days)</CardTitle>
                <CardDescription>Projects tied to events happening soon</CardDescription>
              </div>
              <Link to="/designer/my-projects">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 transition-colors">
                  View All <ArrowRight className="ml-1 w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-6">
              {upcoming.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed border-border">
                  <Palette className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No upcoming project deadlines in the next 7 days.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcoming.map((work) => (
                    <Link to={`/designer/project/${work.id}`} key={work.id} className="block group">
                      <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card group-hover:border-primary/50 group-hover:shadow-sm transition-all duration-200">
                        <div className="flex flex-col gap-1.5">
                          <span className="font-semibold text-foreground">{work.order?.event_name}</span>
                          <span className="text-sm text-muted-foreground">
                            {work.order?.customer_name} • {format(new Date(work.order?.event_date), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                            work.status === 'pending' ? 'bg-muted text-muted-foreground' :
                            work.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            work.status === 'revision' ? 'bg-orange-100 text-orange-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {work.status.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                            Open Project <ArrowRight className="w-3 h-3 ml-1" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default DesignerDashboard;