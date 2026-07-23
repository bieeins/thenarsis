import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { useDesignWorkSubscription } from '@/hooks/useDesignWorkSubscription.js';
import { validateAndFormatDesignLink } from '@/lib/validateAndFormatDesignLink.js';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { toast } from 'sonner';
import { 
  Eye, Calendar, User, Search, Filter, AlertCircle, Link as LinkIcon, Image as ImageIcon, ExternalLink, Copy, CheckCircle2, Users
} from 'lucide-react';

const DesignReviewerDashboard = () => {
  const navigate = useNavigate();
  const { designWorks, loading, error } = useDesignWorkSubscription();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');

  const getStatusBadge = (status) => {
    const s = status || 'pending';
    switch(s.toLowerCase()) {
      case 'pending': return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">Pending</Badge>;
      case 'in_progress': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">In Progress</Badge>;
      case 'revision': return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200">Revision</Badge>;
      case 'completed': return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200">Completed</Badge>;
      default: return <Badge variant="outline">{s}</Badge>;
    }
  };

  const handleCopyLink = (url) => {
    if (url) {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    }
  };

  const filteredAndSortedWorks = useMemo(() => {
    let result = [...designWorks];

    if (statusFilter !== 'all') {
      result = result.filter(w => w.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(w => {
        const eventName = (w.expand?.order_id?.event_name || '').toLowerCase();
        const designerName = (w.expand?.designer_id?.name || '').toLowerCase();
        const crewNames = (w.assigned_crews || []).map(c => c.name.toLowerCase()).join(' ');
        return eventName.includes(q) || designerName.includes(q) || crewNames.includes(q);
      });
    }

    result.sort((a, b) => {
      const dateA = a.expand?.order_id?.event_date ? new Date(a.expand.order_id.event_date).getTime() : 0;
      const dateB = b.expand?.order_id?.event_date ? new Date(b.expand.order_id.event_date).getTime() : 0;
      const nameA = a.expand?.designer_id?.name || '';
      const nameB = b.expand?.designer_id?.name || '';

      switch (sortBy) {
        case 'date_asc': return dateA - dateB;
        case 'date_desc': return dateB - dateA;
        case 'designer_asc': return nameA.localeCompare(nameB);
        case 'designer_desc': return nameB.localeCompare(nameA);
        case 'status_asc': return (a.status || '').localeCompare(b.status || '');
        default: return dateB - dateA;
      }
    });

    return result;
  }, [designWorks, search, statusFilter, sortBy]);

  const stats = useMemo(() => {
    return {
      total: designWorks.length,
      pending: designWorks.filter(w => w.status === 'pending').length,
      inProgress: designWorks.filter(w => w.status === 'in_progress').length,
      needsReview: designWorks.filter(w => w.status === 'completed' || w.status === 'revision').length,
    };
  }, [designWorks]);

  return (
    <>
      <Helmet>
        <title>Reviewer Dashboard - Thenarsis</title>
      </Helmet>

      <div className="min-h-screen bg-muted/30 py-8">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <Eye className="w-8 h-8 text-primary" />
              Design Review Dashboard
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">Monitor, review, and evaluate design progress and crew assignments.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-card p-6 rounded-2xl border shadow-sm">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Projects</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-card p-6 rounded-2xl border shadow-sm border-blue-200">
              <p className="text-sm font-medium text-blue-600 uppercase tracking-wider mb-1">In Progress</p>
              <p className="text-3xl font-bold text-blue-700">{stats.inProgress}</p>
            </div>
            <div className="bg-card p-6 rounded-2xl border shadow-sm border-purple-200">
              <p className="text-sm font-medium text-purple-600 uppercase tracking-wider mb-1">Needs Review</p>
              <p className="text-3xl font-bold text-purple-700">{stats.needsReview}</p>
            </div>
            <div className="bg-card p-6 rounded-2xl border shadow-sm border-amber-200">
              <p className="text-sm font-medium text-amber-600 uppercase tracking-wider mb-1">Pending Start</p>
              <p className="text-3xl font-bold text-amber-700">{stats.pending}</p>
            </div>
          </div>

          <div className="bg-card rounded-2xl p-4 border shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search event, designer, or crew..." 
                className="pl-9 bg-background"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="revision">Revision</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_desc">Event Date (Newest)</SelectItem>
                  <SelectItem value="date_asc">Event Date (Oldest)</SelectItem>
                  <SelectItem value="designer_asc">Designer (A-Z)</SelectItem>
                  <SelectItem value="status_asc">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="bg-card p-6 rounded-2xl border h-72 flex flex-col gap-4">
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-24 w-full mt-auto" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-8 bg-destructive/10 border border-destructive/20 rounded-2xl flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-10 h-10 text-destructive mb-3" />
              <p className="text-destructive font-medium">{error}</p>
            </div>
          ) : filteredAndSortedWorks.length === 0 ? (
            <div className="p-16 bg-card border rounded-2xl text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-1">No design work found</h3>
              <p className="text-muted-foreground">Adjust your search or filter criteria to see results.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAndSortedWorks.map(work => {
                const order = work.expand?.order_id || {};
                const designer = work.expand?.designer_id || {};
                const crewList = work.assigned_crews || [];
                const linkInfo = validateAndFormatDesignLink(work.design_file_link);
                const eventDate = order.event_date ? parseISO(order.event_date) : null;

                return (
                  <div key={work.id} className="bg-card border rounded-2xl p-5 flex flex-col h-full hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <h3 className="font-bold text-lg leading-tight line-clamp-2" title={order.event_name}>
                        {order.event_name || 'Unnamed Event'}
                      </h3>
                      <div className="shrink-0">{getStatusBadge(work.status)}</div>
                    </div>

                    <div className="space-y-2.5 mb-5 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 shrink-0" />
                        <span className="truncate">{eventDate ? format(eventDate, 'MMM dd, yyyy') : 'No Date'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 shrink-0 text-primary" />
                        <span className="truncate">Designer: <span className="font-medium text-foreground">{designer.name || 'Unassigned'}</span></span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Users className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs uppercase tracking-wider opacity-70 mb-0.5">Assigned Crew</span>
                          {crewList.length > 0 ? (
                            <span className="truncate font-medium text-foreground">{crewList.map(c => c.name).join(', ')}</span>
                          ) : (
                            <span className="italic text-xs opacity-70">Unassigned</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t space-y-3">
                      {linkInfo.status === 'valid' ? (
                        <div className="bg-muted p-3 rounded-xl border flex flex-col gap-3">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px] px-1.5 py-0 h-5"><CheckCircle2 className="w-3 h-3 mr-1"/> Valid</Badge>
                          </div>
                          {linkInfo.isImage && (
                            <div className="w-full h-24 rounded-lg bg-background border overflow-hidden flex items-center justify-center">
                              <img src={linkInfo.url} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex items-center justify-between gap-2">
                            <a 
                              href={linkInfo.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-primary hover:underline truncate flex-1 block"
                            >
                              {linkInfo.url}
                            </a>
                            <div className="flex gap-1 shrink-0">
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleCopyLink(linkInfo.url)} title="Copy Link">
                                <Copy className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="icon" variant="secondary" asChild className="h-7 w-7" title="Open Link">
                                <a href={linkInfo.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-muted/50 p-4 rounded-xl border border-dashed flex flex-col items-center justify-center text-center gap-2">
                          {linkInfo.status === 'invalid' ? (
                            <>
                              <AlertCircle className="w-5 h-5 text-destructive/70" />
                              <span className="text-xs text-destructive">Invalid link format</span>
                            </>
                          ) : (
                            <>
                              <LinkIcon className="w-5 h-5 text-muted-foreground/50" />
                              <span className="text-xs text-muted-foreground">No link provided yet</span>
                            </>
                          )}
                        </div>
                      )}
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => navigate(`/reviewer/design-work/${work.id}`)}
                      >
                        Review Details
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DesignReviewerDashboard;