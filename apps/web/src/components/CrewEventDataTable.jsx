import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, startOfYear, subDays, isAfter } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Checkbox } from '@/components/ui/checkbox.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.jsx';
import { useIsMobile } from '@/hooks/use-mobile.jsx';
import DownloadFilesModal from '@/components/DownloadFilesModal.jsx';
import { formatRupiah } from '@/lib/currency.js';
import { 
  ChevronUp, ChevronDown, Calendar, Search, FilterX, AlertCircle, 
  RefreshCcw, Loader2, ArrowLeft, ArrowRight, MapPin, Banknote, 
  Package, User, Eye, Download, CalendarX2
} from 'lucide-react';

const CrewEventDataTable = ({ events = [], loading, error, onToggleAttendance, onRetry }) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Internal State for Filtering, Sorting, Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [datePreset, setDatePreset] = useState('All');
  
  const [sortConfig, setSortConfig] = useState({ key: 'eventDate', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [updatingId, setUpdatingId] = useState(null);
  
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // Extract unique locations for the filter dropdown safely
  const uniqueLocations = useMemo(() => {
    const locs = (events || []).map(e => e?.event_location).filter(Boolean);
    return [...new Set(locs)].sort();
  }, [events]);

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setLocationFilter('All');
    setDatePreset('All');
    setPage(1);
  };

  const activeFilterCount = [
    search.trim() !== '',
    statusFilter !== 'All',
    locationFilter !== 'All',
    datePreset !== 'All'
  ].filter(Boolean).length;

  const isDateInRange = (dateString, preset) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();

    if (preset === 'This Month') return isAfter(date, startOfMonth(now));
    if (preset === 'This Year') return isAfter(date, startOfYear(now));
    if (preset === 'Last 30 Days') return isAfter(date, subDays(now, 30));
    return true;
  };

  const filteredAndSortedEvents = useMemo(() => {
    // Filter out any null/undefined events first
    let result = (events || []).filter(Boolean);

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(e => 
        (e?.event_name || '').toLowerCase().includes(q) || 
        (e?.customer_name || '').toLowerCase().includes(q) ||
        (e?.assigned_by_name || '').toLowerCase().includes(q)
      );
    }

    // Filters
    if (statusFilter !== 'All') {
      result = result.filter(e => (e?.status || 'Unknown') === statusFilter);
    }
    if (locationFilter !== 'All') {
      result = result.filter(e => (e?.event_location || 'Unknown') === locationFilter);
    }
    if (datePreset !== 'All') {
      result = result.filter(e => isDateInRange(e?.event_date, datePreset));
    }

    // Sort
    result.sort((a, b) => {
      let valA, valB;
      switch (sortConfig.key) {
        case 'eventName': valA = (a?.event_name || '').toLowerCase(); valB = (b?.event_name || '').toLowerCase(); break;
        case 'customer': valA = (a?.customer_name || '').toLowerCase(); valB = (b?.customer_name || '').toLowerCase(); break;
        case 'eventDate': valA = a?.event_date || ''; valB = b?.event_date || ''; break;
        case 'location': valA = (a?.event_location || '').toLowerCase(); valB = (b?.event_location || '').toLowerCase(); break;
        case 'amount': valA = a?.attendance_amount ?? a?.total_amount ?? 0; valB = b?.attendance_amount ?? b?.total_amount ?? 0; break;
        case 'status': valA = (a?.status || '').toLowerCase(); valB = (b?.status || '').toLowerCase(); break;
        case 'assignedBy': valA = (a?.assigned_by_name || '').toLowerCase(); valB = (b?.assigned_by_name || '').toLowerCase(); break;
        default: valA = a?.event_date || ''; valB = b?.event_date || ''; break;
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [events, search, statusFilter, locationFilter, datePreset, sortConfig]);

  const totalRecords = filteredAndSortedEvents.length;
  const totalPages = Math.ceil(totalRecords / pageSize);
  if (page > totalPages && totalPages > 0) setPage(totalPages);

  const currentEvents = filteredAndSortedEvents.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const renderSortIcon = (key) => {
    const isActive = sortConfig.key === key;
    return (
      <span className={`inline-flex ml-1 ${isActive ? 'text-primary' : 'text-muted-foreground/30'}`}>
        {isActive && sortConfig.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const s = status || 'Unknown';
    switch(s.toLowerCase()) {
      case 'pending': 
        return <Badge className="bg-[#FBBF24]/15 text-[#B45309] dark:text-[#FBBF24] hover:bg-[#FBBF24]/25 border-transparent shadow-none font-semibold">{s}</Badge>;
      case 'in progress': 
        return <Badge className="bg-[#3B82F6]/15 text-[#1D4ED8] dark:text-[#3B82F6] hover:bg-[#3B82F6]/25 border-transparent shadow-none font-semibold">{s}</Badge>;
      case 'completed': 
        return <Badge className="bg-[#10B981]/15 text-[#047857] dark:text-[#10B981] hover:bg-[#10B981]/25 border-transparent shadow-none font-semibold">{s}</Badge>;
      case 'cancelled': 
        return <Badge className="bg-[#EF4444]/15 text-[#B91C1C] dark:text-[#EF4444] hover:bg-[#EF4444]/25 border-transparent shadow-none font-semibold">{s}</Badge>;
      default: 
        return <Badge className="bg-[#6B7280]/15 text-[#374151] dark:text-[#9CA3AF] hover:bg-[#6B7280]/25 border-transparent shadow-none font-semibold">{s}</Badge>;
    }
  };

  const handleAttendanceClick = async (event, checked) => {
    if (!event) return;
    if (['Completed', 'Cancelled'].includes(event.status)) {
      toast.error(`Cannot modify attendance for a ${event.status?.toLowerCase() || 'unknown'} event.`);
      return;
    }
    setUpdatingId(event.assignment_id);
    try {
      await onToggleAttendance(event.assignment_id, event.attendance_status);
    } finally {
      setUpdatingId(null);
    }
  };

  const openDownloadModal = (orderId) => {
    if (!orderId) {
      toast.error('Order ID is missing.');
      return;
    }
    setSelectedOrderId(orderId);
    setDownloadModalOpen(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy');
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount) => amount ? formatRupiah(amount) : formatRupiah(0);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-14 w-full rounded-xl" />
        <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  // Handle empty state gracefully instead of showing red error boxes to users
  if (!events || events.length === 0) {
    return (
      <div className="bg-card border border-dashed border-border rounded-2xl p-16 shadow-sm flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
          <CalendarX2 className="w-10 h-10 text-muted-foreground/50" />
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-2">No events assigned yet</h3>
        <p className="text-muted-foreground max-w-md mb-6">You currently have no valid assigned events. Wait for the owner to assign you to events.</p>
        <Button onClick={onRetry} variant="outline" className="text-muted-foreground hover:text-foreground">
          <RefreshCcw className="w-4 h-4 mr-2" /> Refresh Data
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* FILTER BAR */}
      <div className="bg-card border rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search event, customer, or assigner..." 
              className="pl-9 h-11"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex flex-wrap sm:flex-nowrap gap-3 lg:w-auto">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[150px] h-11">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Confirmed">Confirmed</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={locationFilter} onValueChange={(v) => { setLocationFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[160px] h-11">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Locations</SelectItem>
                {uniqueLocations.map(loc => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={datePreset} onValueChange={(v) => { setDatePreset(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[150px] h-11">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Dates</SelectItem>
                <SelectItem value="This Month">This Month</SelectItem>
                <SelectItem value="This Year">This Year</SelectItem>
                <SelectItem value="Last 30 Days">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              className="h-11 px-4 w-full sm:w-auto text-muted-foreground"
              onClick={handleClearFilters}
              disabled={activeFilterCount === 0}
            >
              <FilterX className="w-4 h-4 mr-2" />
              Clear {activeFilterCount > 0 && `(${activeFilterCount})`}
            </Button>
          </div>
        </div>
      </div>

      {/* TABLE / CARDS AREA */}
      {filteredAndSortedEvents.length === 0 ? (
        <div className="bg-card border rounded-2xl p-16 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-1">No matching events found</h3>
          <p className="text-muted-foreground">Adjust your filters to see more results.</p>
        </div>
      ) : isMobile ? (
        <div className="grid grid-cols-1 gap-4">
          {currentEvents.map((event) => {
            if (!event) return null;
            const isCompleted = ['Completed', 'Cancelled'].includes(event.status);
            const isChecked = event.attendance_status === 'hadir';
            
            return (
              <div key={event.assignment_id} className="bg-card border rounded-2xl p-5 shadow-sm relative overflow-hidden transition-colors hover:border-primary/40">
                <div className="absolute top-5 right-5 z-10 flex flex-col items-end gap-1">
                  {updatingId === event.assignment_id ? (
                     <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  ) : (
                    <Checkbox 
                      checked={isChecked}
                      onCheckedChange={(checked) => handleAttendanceClick(event, checked)}
                      disabled={isCompleted || updatingId === event.assignment_id}
                      className="w-6 h-6 border-2 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                    />
                  )}
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase mt-1">
                    {isChecked ? 'Attending' : 'Not Attending'}
                  </span>
                </div>

                <div className="pr-14 mb-4">
                  <h4 className="font-bold text-lg leading-tight mb-1">{event.event_name || 'N/A'}</h4>
                  {getStatusBadge(event.status)}
                </div>

                <div className="space-y-2.5 text-sm text-muted-foreground mb-5">
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-foreground/40" />
                    <span className="font-medium text-foreground">{event.customer_name || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-foreground/40" />
                    <span>{formatDate(event.event_date)}</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-foreground/40 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{event.event_location || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Banknote className="w-4 h-4 text-primary/60 shrink-0" />
                    <span className="font-numeric font-medium text-foreground">
                      {formatCurrency(event.attendance_amount ?? event.total_amount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Package className="w-4 h-4 text-foreground/40 shrink-0" />
                    <span>{event.package_name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2.5 pt-2 border-t mt-2">
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={event.assigned_by_avatar} />
                      <AvatarFallback className="text-[10px]">{event.assigned_by_name?.substring(0, 2).toUpperCase() || 'NA'}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs">Assigned by <span className="font-medium text-foreground">{event.assigned_by_name || 'System'}</span></span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-t pt-4">
                  <Button 
                    variant="outline" 
                    className="w-full justify-center bg-card hover:bg-muted"
                    onClick={() => navigate(`/crew/events/${event.assignment_id}`)}
                  >
                    <Eye className="w-4 h-4 mr-2" /> View Details
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="w-full justify-center"
                    onClick={() => openDownloadModal(event.order_id)}
                    disabled={!event.order_id}
                  >
                    <Download className="w-4 h-4 mr-2" /> Download Files
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-4 w-[60px] text-center">
                    <span className="sr-only">Attendance</span>
                    Att.
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-muted/80 transition-colors group" onClick={() => handleSort('eventName')}>
                    <div className="flex items-center font-semibold text-foreground/80">
                      Event Name {renderSortIcon('eventName')}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-muted/80 transition-colors group" onClick={() => handleSort('customer')}>
                    <div className="flex items-center font-semibold text-foreground/80">
                      Customer {renderSortIcon('customer')}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-muted/80 transition-colors group" onClick={() => handleSort('eventDate')}>
                    <div className="flex items-center font-semibold text-foreground/80">
                      Event Date {renderSortIcon('eventDate')}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-muted/80 transition-colors group" onClick={() => handleSort('location')}>
                    <div className="flex items-center font-semibold text-foreground/80">
                      Location {renderSortIcon('location')}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-muted/80 transition-colors group" onClick={() => handleSort('assignedBy')}>
                    <div className="flex items-center font-semibold text-foreground/80">
                      Assigned By {renderSortIcon('assignedBy')}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-muted/80 transition-colors group text-right" onClick={() => handleSort('amount')}>
                    <div className="flex items-center justify-end font-semibold text-foreground/80">
                      Amount {renderSortIcon('amount')}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-muted/80 transition-colors group" onClick={() => handleSort('status')}>
                    <div className="flex items-center font-semibold text-foreground/80">
                      Status {renderSortIcon('status')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right font-semibold text-foreground/80">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {currentEvents.map((event) => {
                  if (!event) return null;
                  const isCompleted = ['Completed', 'Cancelled'].includes(event.status);
                  const isChecked = event.attendance_status === 'hadir';
                  const isHighlight = sortConfig.key;

                  return (
                    <tr key={event.assignment_id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4 text-center align-middle">
                        {updatingId === event.assignment_id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mx-auto" />
                        ) : (
                          <Checkbox 
                            checked={isChecked}
                            onCheckedChange={(checked) => handleAttendanceClick(event, checked)}
                            disabled={isCompleted || updatingId === event.assignment_id}
                            className="w-5 h-5 border-2 mx-auto block data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                            title="Toggle Attendance"
                          />
                        )}
                      </td>
                      <td className={`px-6 py-4 ${isHighlight === 'eventName' ? 'bg-muted/10' : ''}`}>
                        <button 
                          onClick={() => navigate(`/crew/events/${event.assignment_id}`)}
                          className="font-bold text-foreground hover:text-primary transition-colors text-left"
                        >
                          {event.event_name || 'N/A'}
                        </button>
                      </td>
                      <td className={`px-6 py-4 font-medium ${isHighlight === 'customer' ? 'bg-muted/10' : ''}`}>
                        {event.customer_name || 'Unknown'}
                      </td>
                      <td className={`px-6 py-4 text-muted-foreground whitespace-nowrap ${isHighlight === 'eventDate' ? 'bg-muted/10' : ''}`}>
                        {formatDate(event.event_date)}
                      </td>
                      <td className={`px-6 py-4 text-muted-foreground truncate max-w-[150px] ${isHighlight === 'location' ? 'bg-muted/10' : ''}`} title={event.event_location || '-'}>
                        {event.event_location || 'N/A'}
                      </td>
                      <td className={`px-6 py-4 ${isHighlight === 'assignedBy' ? 'bg-muted/10' : ''}`}>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={event.assigned_by_avatar} />
                            <AvatarFallback className="text-[10px]">{event.assigned_by_name?.substring(0, 2).toUpperCase() || 'NA'}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-foreground">{event.assigned_by_name || 'System'}</span>
                        </div>
                      </td>
                      <td className={`px-6 py-4 text-right font-numeric text-muted-foreground whitespace-nowrap ${isHighlight === 'amount' ? 'bg-muted/10' : ''}`}>
                        {formatCurrency(event.attendance_amount ?? event.total_amount)}
                      </td>
                      <td className={`px-6 py-4 ${isHighlight === 'status' ? 'bg-muted/10' : ''}`}>
                        {getStatusBadge(event.status)}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          onClick={() => navigate(`/crew/events/${event.assignment_id}`)}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 disabled:opacity-30"
                          onClick={() => openDownloadModal(event.order_id)}
                          disabled={!event.order_id}
                          title="Download Files"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PAGINATION */}
      {totalRecords > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-card border rounded-2xl shadow-sm">
          <div className="flex items-center gap-4 text-sm text-muted-foreground w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                <SelectTrigger className="h-9 w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span className="hidden sm:inline">
              Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalRecords)} of {totalRecords} records
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <span className="sm:hidden text-sm text-muted-foreground font-medium">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <Button 
                variant="outline" 
                size="sm"
                className="h-9" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ArrowLeft className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Previous</span>
              </Button>
              <div className="hidden sm:flex items-center justify-center px-4 py-2 rounded-md bg-muted/50 text-sm font-medium">
                {page} / {totalPages}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="h-9" 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <span className="hidden sm:inline">Next</span>
                <ArrowRight className="w-4 h-4 sm:ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DOWNLOAD MODAL */}
      <DownloadFilesModal 
        isOpen={downloadModalOpen} 
        onClose={() => setDownloadModalOpen(false)} 
        orderId={selectedOrderId} 
      />
    </div>
  );
};

export default CrewEventDataTable;