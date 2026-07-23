import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { List, Search, Filter, Link as LinkIcon, Image as ImageIcon, ExternalLink, Copy, CheckCircle2, AlertCircle, Activity, Users } from 'lucide-react';
import { useDesignWorkSubscription } from '@/hooks/useDesignWorkSubscription.js';
import { validateAndFormatDesignLink } from '@/lib/validateAndFormatDesignLink.js';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.jsx';

const DesignWorkListPage = () => {
  const navigate = useNavigate();
  const { designWorks, loading, error } = useDesignWorkSubscription();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getStatusBadge = (status) => {
    const s = status || 'pending';
    switch(s.toLowerCase()) {
      case 'pending': return <Badge className="bg-amber-100 text-amber-800 border-transparent">Pending</Badge>;
      case 'in_progress': return <Badge className="bg-blue-100 text-blue-800 border-transparent">In Progress</Badge>;
      case 'revision': return <Badge className="bg-purple-100 text-purple-800 border-transparent">Revision</Badge>;
      case 'completed': return <Badge className="bg-emerald-100 text-emerald-800 border-transparent">Completed</Badge>;
      default: return <Badge variant="outline">{s}</Badge>;
    }
  };

  const handleCopyLink = (url) => {
    if (url) {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    }
  };

  const handleTestLink = (rawUrl) => {
    const result = validateAndFormatDesignLink(rawUrl);
    if (result.status === 'valid') {
      toast.success('Valid URL format detected');
    } else if (result.status === 'invalid') {
      toast.error(`Invalid URL: ${result.error}`);
    } else {
      toast.error('No link provided to test');
    }
  };

  const filteredData = useMemo(() => {
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
      return dateB - dateA;
    });

    return result;
  }, [designWorks, search, statusFilter]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  return (
    <>
      <Helmet>
        <title>Design Work Directory - Thenarsis</title>
      </Helmet>

      <div className="min-h-screen bg-muted/30 py-8">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <List className="w-8 h-8 text-primary" />
              Design Work Directory
            </h1>
            <p className="text-muted-foreground mt-2">Comprehensive list view of all design projects, crew assignments, and assets.</p>
          </div>

          <div className="bg-card rounded-2xl p-5 border shadow-sm mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search event, designer, or crew..." 
                className="pl-9 bg-background"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Statuses" />
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
          </div>

          <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[180px]">Designer</TableHead>
                    <TableHead className="w-[200px]">Assigned Crew</TableHead>
                    <TableHead>Event Details</TableHead>
                    <TableHead className="w-[120px]">Date</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="w-[400px]">Design Link</TableHead>
                    <TableHead className="text-right w-[100px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-24 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-16 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        No design projects found matching your criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((work) => {
                      const order = work.expand?.order_id || {};
                      const designer = work.expand?.designer_id || {};
                      const linkInfo = validateAndFormatDesignLink(work.design_file_link);
                      const eventDate = order.event_date ? parseISO(order.event_date) : null;
                      const crewList = work.assigned_crews || [];

                      return (
                        <TableRow key={work.id} className="hover:bg-muted/20">
                          <TableCell className="font-medium">
                            {designer.name || <span className="text-muted-foreground italic text-sm">Unassigned</span>}
                          </TableCell>
                          <TableCell>
                            {crewList.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {crewList.map((crew, idx) => (
                                  <div key={idx} className="flex items-center gap-1.5 text-sm font-medium">
                                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span>{crew.name}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic text-sm">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <p className="font-semibold text-foreground line-clamp-1">{order.event_name || 'Unnamed Event'}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{order.customer_name}</p>
                          </TableCell>
                          <TableCell>
                            {eventDate ? format(eventDate, 'MMM dd, yyyy') : '-'}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(work.status)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-2">
                              {linkInfo.status === 'valid' ? (
                                <div className="flex items-center gap-3 bg-muted/50 p-2 rounded-lg border">
                                  {linkInfo.isImage ? (
                                    <div className="w-12 h-12 rounded border shrink-0 bg-background overflow-hidden flex items-center justify-center">
                                      <img src={linkInfo.url} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                  ) : (
                                    <div className="w-10 h-10 rounded border shrink-0 bg-background flex items-center justify-center">
                                      <LinkIcon className="w-5 h-5 text-primary" />
                                    </div>
                                  )}
                                  <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                                    <a 
                                      href={linkInfo.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-xs text-primary hover:underline truncate block"
                                      title={linkInfo.url}
                                    >
                                      {linkInfo.url}
                                    </a>
                                    <div className="flex gap-1">
                                      <Button size="sm" variant="secondary" className="h-6 text-[10px] px-2" onClick={() => handleCopyLink(linkInfo.url)}>
                                        <Copy className="w-3 h-3 mr-1" /> Copy
                                      </Button>
                                      <Button size="sm" variant="secondary" className="h-6 text-[10px] px-2" onClick={() => handleTestLink(work.design_file_link)}>
                                        <Activity className="w-3 h-3 mr-1" /> Test
                                      </Button>
                                      <Button size="sm" variant="outline" asChild className="h-6 text-[10px] px-2">
                                        <a href={linkInfo.url} target="_blank" rel="noopener noreferrer">
                                          Open <ExternalLink className="w-3 h-3 ml-1" />
                                        </a>
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-dashed">
                                  <div className="flex items-center gap-2">
                                    <AlertCircle className={`w-4 h-4 ${linkInfo.status === 'invalid' ? 'text-destructive/80' : 'opacity-50'}`} />
                                    <span className={`text-sm ${linkInfo.status === 'invalid' ? 'text-destructive font-medium' : 'italic'}`}>
                                      {linkInfo.status === 'invalid' ? 'Invalid Link Format' : 'No link provided'}
                                    </span>
                                  </div>
                                  {work.design_file_link && (
                                    <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 shrink-0" onClick={() => handleTestLink(work.design_file_link)}>
                                      Test Link
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost" onClick={() => navigate(`/reviewer/design-work/${work.id}`)}>
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1 px-2 text-sm font-medium">
                    {currentPage} / {totalPages}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
};

export default DesignWorkListPage;