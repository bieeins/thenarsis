import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, ArrowUpDown, Loader2, Palette, Users, Download, Filter, X } from 'lucide-react';
import { designIncomeService } from '@/services/designIncomeService.js';
import { crewAssignmentService } from '@/services/crewAssignmentService.js';
import { orderService } from '@/services/orderService.js';
import { invoiceService } from '@/services/invoiceService.js';
import { format, subDays, startOfMonth, startOfYear, isAfter, isBefore } from 'date-fns';
import { toast } from 'sonner';
import DesignFeeDetailModal from './DesignFeeDetailModal.jsx';
import CrewAttendanceDetailModal from './CrewAttendanceDetailModal.jsx';
import { exportDesignFeesToCSV, exportCrewAttendanceToCSV, exportCombinedReportToCSV } from '@/lib/exportUtils.js';

const FeesAndCompensationWidget = () => {
  const [designFees, setDesignFees] = useState([]);
  const [crewAssignments, setCrewAssignments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [activeTab, setActiveTab] = useState('design-fees');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [datePreset, setDatePreset] = useState('All');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [selectedFee, setSelectedFee] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [feesRes, crewRes, ordersRes, invoicesRes] = await Promise.all([
        designIncomeService.listAll({ sort: 'created_at', order: 'desc' }),
        crewAssignmentService.listAll({ sort: 'created_at', order: 'desc' }),
        orderService.listAll(),
        invoiceService.listAll(),
      ]);

      // Map invoice totals to orders for gross revenue calculation
      const ordersWithTotals = ordersRes.map(order => {
        const invoice = invoicesRes.find(inv => inv.order_id === order.id);
        return { ...order, totalAmount: invoice ? invoice.total_amount : 0 };
      });
      const orderMap = new Map(ordersWithTotals.map((o) => [o.id, o]));

      // design_income rows aren't expanded with their order server-side —
      // attach it client-side using the orders we already fetched.
      const feesWithOrder = feesRes.map((fee) => ({
        ...fee,
        order: orderMap.get(fee.order_id) || null,
      }));

      setDesignFees(feesWithOrder);
      setCrewAssignments(crewRes);
      setOrders(ordersWithTotals);
    } catch (error) {
      console.error('Failed to fetch data', error);
      toast.error('Failed to load compensation data');
    } finally {
      setLoading(false);
    }
  };

  // --- Filtering Logic ---
  const isDateInRange = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();

    if (datePreset === 'This Month') return isAfter(date, startOfMonth(now));
    if (datePreset === 'This Year') return isAfter(date, startOfYear(now));
    if (datePreset === 'Last 30 Days') return isAfter(date, subDays(now, 30));
    if (datePreset === 'Last 90 Days') return isAfter(date, subDays(now, 90));
    if (datePreset === 'Custom') {
      if (customStartDate && isBefore(date, new Date(customStartDate))) return false;
      if (customEndDate && isAfter(date, new Date(customEndDate))) return false;
      return true;
    }
    return true;
  };

  const filteredDesignFees = useMemo(() => {
    return designFees.filter(fee => {
      if (statusFilter !== 'All' && fee.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!fee.designer_name?.toLowerCase().includes(q) && !fee.order?.event_name?.toLowerCase().includes(q)) return false;
      }
      if (!isDateInRange(fee.created_at)) return false;
      return true;
    });
  }, [designFees, statusFilter, searchQuery, datePreset, customStartDate, customEndDate]);

  const filteredCrewAssignments = useMemo(() => {
    return crewAssignments.filter(crew => {
      const status = crew.attendance_status || 'belum_jawab';
      if (statusFilter !== 'All' && status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!crew.crew?.name?.toLowerCase().includes(q) && !crew.order?.event_name?.toLowerCase().includes(q)) return false;
      }
      if (!isDateInRange(crew.created_at)) return false;
      return true;
    });
  }, [crewAssignments, statusFilter, searchQuery, datePreset, customStartDate, customEndDate]);

  // --- Stats Calculations ---
  const revenueImpact = useMemo(() => {
    const gross = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const fees = designFees.reduce((sum, f) => sum + (f.fee_amount || 0), 0);
    const crew = crewAssignments.reduce((sum, c) => sum + (c.attendance_amount || 0), 0);
    return { gross, fees, crew, net: gross - fees - crew };
  }, [orders, designFees, crewAssignments]);

  const feeStats = useMemo(() => {
    let total = 0, month = 0, submitted = 0, approved = 0, paid = 0;
    const now = new Date();
    filteredDesignFees.forEach(f => {
      const amt = f.fee_amount || 0;
      total += amt;
      if (isAfter(new Date(f.created_at), startOfMonth(now))) month += amt;
      if (f.status === 'pending') submitted++;
      else if (f.status === 'approved') approved++;
      else if (f.status === 'paid') paid++;
    });
    return { total, month, avg: filteredDesignFees.length ? total / filteredDesignFees.length : 0, submitted, approved, paid };
  }, [filteredDesignFees]);

  const crewStats = useMemo(() => {
    let totalAmt = 0, monthAmt = 0, yearAmt = 0, hadir = 0, tidakHadir = 0, belumJawab = 0;
    const now = new Date();
    filteredCrewAssignments.forEach(c => {
      const amt = c.attendance_amount || 0;
      totalAmt += amt;
      if (isAfter(new Date(c.created_at), startOfMonth(now))) monthAmt += amt;
      if (isAfter(new Date(c.created_at), startOfYear(now))) yearAmt += amt;
      
      const status = c.attendance_status || 'belum_jawab';
      if (status === 'hadir') hadir++;
      else if (status === 'tidak_hadir') tidakHadir++;
      else belumJawab++;
    });
    const total = filteredCrewAssignments.length;
    return { total, totalAmt, monthAmt, yearAmt, hadir, tidakHadir, belumJawab, hadirPct: total ? Math.round((hadir/total)*100) : 0 };
  }, [filteredCrewAssignments]);

  // --- Handlers ---
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setDatePreset('All');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const handleExport = async (type) => {
    setExporting(true);
    try {
      if (type === 'design') {
        exportDesignFeesToCSV(filteredDesignFees);
      } else if (type === 'crew') {
        exportCrewAttendanceToCSV(filteredCrewAssignments);
      } else {
        exportCombinedReportToCSV(filteredDesignFees, filteredCrewAssignments, orders);
      }
      toast.success('Export completed successfully');
    } catch (error) {
      console.error('Export failed', error);
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const getFeeBadge = (status) => {
    switch (status) {
      case 'paid': return <span className="badge-fee-paid">Paid</span>;
      case 'approved': return <span className="badge-fee-approved">Approved</span>;
      default: return <span className="badge-fee-submitted">Submitted</span>;
    }
  };

  const getAttendanceBadge = (status) => {
    switch (status) {
      case 'hadir': return <span className="badge-attendance-hadir">Hadir</span>;
      case 'tidak_hadir': return <span className="badge-attendance-tidak-hadir">Tidak Hadir</span>;
      default: return <span className="badge-attendance-belum-jawab">Belum Jawab</span>;
    }
  };

  if (loading) {
    return (
      <Card className="shadow-md border-0 min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 overflow-hidden">
      <CardHeader className="pb-4 border-b bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-xl">Fees & Compensation</CardTitle>
          <CardDescription>Manage designer fees and crew attendance compensation</CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={exporting}>
              {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Export CSV
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExport('design')}>Design Fees Only</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('crew')}>Crew Attendance Only</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('combined')}>Combined Report</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="p-0">
        {/* REVENUE IMPACT SECTION */}
        <div className="bg-muted/20 p-6 border-b">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Revenue Impact (All Time)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card p-4 rounded-xl border shadow-sm">
              <p className="text-xs font-medium text-muted-foreground mb-1">Gross Revenue</p>
              <p className="text-xl font-bold font-numeric text-foreground">Rp {revenueImpact.gross.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-red-50/50 dark:bg-red-950/20 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
              <p className="text-xs font-medium text-red-800 dark:text-red-400 mb-1">Total Design Fees</p>
              <p className="text-xl font-bold font-numeric text-red-700 dark:text-red-500">- Rp {revenueImpact.fees.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-red-50/50 dark:bg-red-950/20 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
              <p className="text-xs font-medium text-red-800 dark:text-red-400 mb-1">Total Crew Amounts</p>
              <p className="text-xl font-bold font-numeric text-red-700 dark:text-red-500">- Rp {revenueImpact.crew.toLocaleString('id-ID')}</p>
            </div>
            <div className={`${revenueImpact.net >= 0 ? 'bg-green-50/50 dark:bg-green-950/20 border-green-100 dark:border-green-900/30' : 'bg-red-50/50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30'} p-4 rounded-xl border shadow-sm`}>
              <p className={`text-xs font-medium mb-1 ${revenueImpact.net >= 0 ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'}`}>Net Revenue</p>
              <p className={`text-xl font-bold font-numeric ${revenueImpact.net >= 0 ? 'text-green-700 dark:text-green-500' : 'text-red-700 dark:text-red-500'}`}>
                Rp {revenueImpact.net.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setStatusFilter('All'); }} className="w-full">
          <div className="px-6 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="design-fees" className="flex items-center gap-2">
                <Palette className="w-4 h-4" /> Design Fees
              </TabsTrigger>
              <TabsTrigger value="crew-attendance" className="flex items-center gap-2">
                <Users className="w-4 h-4" /> Crew Attendance
              </TabsTrigger>
            </TabsList>
            <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)} className="text-muted-foreground">
              <Filter className="w-4 h-4 mr-2" /> Filters {searchQuery || statusFilter !== 'All' || datePreset !== 'All' ? '(Active)' : ''}
            </Button>
          </div>

          {/* FILTERS SECTION */}
          {showFilters && (
            <div className="mx-6 mt-4 p-4 bg-muted/30 rounded-xl border space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Filter Records</h4>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 text-xs">
                  <X className="w-3 h-3 mr-1" /> Clear All
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Search Name/Event</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 h-9 text-sm" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Status</SelectItem>
                      {activeTab === 'design-fees' ? (
                        <>
                          <SelectItem value="pending">Submitted</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="hadir">Hadir</SelectItem>
                          <SelectItem value="tidak_hadir">Tidak Hadir</SelectItem>
                          <SelectItem value="belum_jawab">Belum Jawab</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Date Period</label>
                  <Select value={datePreset} onValueChange={setDatePreset}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="All Time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Time</SelectItem>
                      <SelectItem value="This Month">This Month</SelectItem>
                      <SelectItem value="This Year">This Year</SelectItem>
                      <SelectItem value="Last 30 Days">Last 30 Days</SelectItem>
                      <SelectItem value="Last 90 Days">Last 90 Days</SelectItem>
                      <SelectItem value="Custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {datePreset === 'Custom' && (
                  <div className="space-y-1.5 flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-muted-foreground">Start</label>
                      <Input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="h-9 text-sm" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-medium text-muted-foreground">End</label>
                      <Input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="h-9 text-sm" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DESIGN FEES TAB */}
          <TabsContent value="design-fees" className="m-0">
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card p-4 rounded-xl border shadow-sm">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Filtered Total</p>
                  <p className="text-lg font-bold font-numeric">Rp {feeStats.total.toLocaleString('id-ID')}</p>
                </div>
                <div className="bg-card p-4 rounded-xl border shadow-sm">
                  <p className="text-xs font-medium text-muted-foreground mb-1">This Month</p>
                  <p className="text-lg font-bold font-numeric">Rp {feeStats.month.toLocaleString('id-ID')}</p>
                </div>
                <div className="bg-card p-4 rounded-xl border shadow-sm">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Avg Fee</p>
                  <p className="text-lg font-bold font-numeric">Rp {Math.round(feeStats.avg).toLocaleString('id-ID')}</p>
                </div>
                <div className="bg-card p-4 rounded-xl border shadow-sm flex flex-col justify-center">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Submitted:</span>
                    <span className="font-medium">{feeStats.submitted}</span>
                  </div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Approved:</span>
                    <span className="font-medium text-blue-600">{feeStats.approved}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Paid:</span>
                    <span className="font-medium text-green-600">{feeStats.paid}</span>
                  </div>
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                      <tr>
                        <th className="px-4 py-3">Designer</th>
                        <th className="px-4 py-3">Event</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3">Submitted</th>
                        <th className="px-4 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDesignFees.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-4 py-8 text-center text-muted-foreground">No design fees found matching filters.</td>
                        </tr>
                      ) : (
                        filteredDesignFees.map((fee) => (
                          <tr key={fee.id} onClick={() => setSelectedFee(fee)} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors">
                            <td className="px-4 py-3 font-medium">{fee.designer_name}</td>
                            <td className="px-4 py-3 text-muted-foreground truncate max-w-[200px]">{fee.order?.event_name || 'N/A'}</td>
                            <td className="px-4 py-3 text-right font-numeric font-medium">Rp {fee.fee_amount?.toLocaleString('id-ID')}</td>
                            <td className="px-4 py-3 text-muted-foreground">{format(new Date(fee.created_at), 'MMM dd, yyyy')}</td>
                            <td className="px-4 py-3 text-center">{getFeeBadge(fee.status)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* CREW ATTENDANCE TAB */}
          <TabsContent value="crew-attendance" className="m-0">
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card p-4 rounded-xl border shadow-sm">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Filtered Amounts</p>
                  <p className="text-lg font-bold font-numeric">Rp {crewStats.totalAmt.toLocaleString('id-ID')}</p>
                </div>
                <div className="bg-green-50/50 dark:bg-green-950/20 p-4 rounded-xl border border-green-100 dark:border-green-900/30">
                  <p className="text-xs font-medium text-green-800 dark:text-green-400 mb-1">Hadir</p>
                  <div className="flex items-end gap-2">
                    <p className="text-xl font-bold font-numeric text-green-700 dark:text-green-500">{crewStats.hadir}</p>
                    <p className="text-sm text-green-600 dark:text-green-400 mb-0.5 font-medium">{crewStats.hadirPct}%</p>
                  </div>
                </div>
                <div className="bg-red-50/50 dark:bg-red-950/20 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                  <p className="text-xs font-medium text-red-800 dark:text-red-400 mb-1">Tidak Hadir</p>
                  <p className="text-xl font-bold font-numeric text-red-700 dark:text-red-500">{crewStats.tidakHadir}</p>
                </div>
                <div className="bg-gray-50/50 dark:bg-gray-900/30 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Belum Jawab</p>
                  <p className="text-xl font-bold font-numeric text-gray-700 dark:text-gray-300">{crewStats.belumJawab}</p>
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                      <tr>
                        <th className="px-4 py-3">Crew</th>
                        <th className="px-4 py-3">Event</th>
                        <th className="px-4 py-3">Event Date</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCrewAssignments.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-4 py-8 text-center text-muted-foreground">No crew assignments found matching filters.</td>
                        </tr>
                      ) : (
                        filteredCrewAssignments.map((assignment) => (
                          <tr key={assignment.id} onClick={() => setSelectedAssignment(assignment)} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors">
                            <td className="px-4 py-3 font-medium">{assignment.crew?.name || 'Unknown'}</td>
                            <td className="px-4 py-3 text-muted-foreground truncate max-w-[150px]">{assignment.order?.event_name || 'N/A'}</td>
                            <td className="px-4 py-3 text-muted-foreground">{assignment.order?.event_date ? format(new Date(assignment.order?.event_date), 'MMM dd, yyyy') : '-'}</td>
                            <td className="px-4 py-3 text-center">{getAttendanceBadge(assignment.attendance_status || 'belum_jawab')}</td>
                            <td className="px-4 py-3 text-right font-numeric font-medium">
                              {assignment.attendance_amount ? `Rp ${assignment.attendance_amount.toLocaleString('id-ID')}` : '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <DesignFeeDetailModal 
        isOpen={!!selectedFee} 
        onClose={() => setSelectedFee(null)} 
        feeRecord={selectedFee}
        onSave={(updated) => {
          setDesignFees(prev => prev.map(f => f.id === updated.id ? { ...f, ...updated } : f));
        }}
      />

      <CrewAttendanceDetailModal 
        isOpen={!!selectedAssignment} 
        onClose={() => setSelectedAssignment(null)} 
        assignmentRecord={selectedAssignment}
        onSave={(updated) => {
          setCrewAssignments(prev => prev.map(a => a.id === updated.id ? { ...a, ...updated } : a));
        }}
      />
    </Card>
  );
};

export default FeesAndCompensationWidget;