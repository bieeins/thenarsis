import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Eye, Pencil, Trash2, RefreshCw, ChevronUp, ChevronDown, FilterX } from 'lucide-react';
import { toast } from 'sonner';
import { orderService } from '@/services/orderService.js';
import { invoiceService } from '@/services/invoiceService.js';
import { paymentService } from '@/services/paymentService.js';
import { crewAssignmentService } from '@/services/crewAssignmentService.js';
import { designWorkService } from '@/services/designWorkService.js';
import { format } from 'date-fns';
import OrderForm from '@/components/OrderForm';
import AssignDesignerModal from '@/components/AssignDesignerModal';
import AssignCrewModal from '@/components/AssignCrewModal';
import { formatRupiah } from '@/lib/currency.js';

const OrderManagementPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  // Date filter (by event date) + column sorting
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Modals state
  const [designerModalState, setDesignerModalState] = useState({ open: false, orderId: null });
  const [crewModalState, setCrewModalState] = useState({ open: false, orderId: null });

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    setError(false);
    try {
      const [records, invoices, payments, crewAssignments, designWorks] = await Promise.all([
        orderService.listAll({ sort: 'created_at', order: 'desc' }),
        invoiceService.listAll(),
        paymentService.listAll(),
        crewAssignmentService.listAll(),
        designWorkService.listAll(),
      ]);

      const invoicesByOrder = new Map();
      invoices.forEach((inv) => {
        if (!invoicesByOrder.has(inv.order_id)) invoicesByOrder.set(inv.order_id, []);
        invoicesByOrder.get(inv.order_id).push(inv);
      });

      const paymentsByInvoice = new Map();
      payments.forEach((p) => {
        if (!paymentsByInvoice.has(p.invoice_id)) paymentsByInvoice.set(p.invoice_id, []);
        paymentsByInvoice.get(p.invoice_id).push(p);
      });

      // Keep the attendance status alongside each crew member's name, not
      // just the name, so the owner can tell "assigned" apart from "assigned
      // and confirmed" without opening the order.
      const crewByOrder = new Map();
      crewAssignments.forEach((ca) => {
        if (!crewByOrder.has(ca.order_id)) crewByOrder.set(ca.order_id, []);
        if (ca.crew?.name) crewByOrder.get(ca.order_id).push({ name: ca.crew.name, attendanceStatus: ca.attendance_status });
      });

      const designWorkByOrder = new Map();
      designWorks.forEach((dw) => {
        if (!designWorkByOrder.has(dw.order_id)) designWorkByOrder.set(dw.order_id, dw);
      });

      const ordersEnhanced = records.map((order) => {
        const orderInvoices = invoicesByOrder.get(order.id) || [];
        const firstInvoice = orderInvoices[0];
        const invoicePayments = firstInvoice ? paymentsByInvoice.get(firstInvoice.id) || [] : [];
        const totalPayments = invoicePayments.reduce(
          (sum, p) => (p.payment_status === 'Confirmed' ? sum + p.amount : sum),
          0
        );

        return {
          ...order,
          totalAmount: firstInvoice?.total_amount || 0,
          paymentsReceived: totalPayments,
          crew: crewByOrder.get(order.id) || [],
          designWork: designWorkByOrder.get(order.id) || null,
        };
      });

      setOrders(ordersEnhanced);
    } catch (err) {
      toast.error('Failed to load orders');
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Confirmed: 'bg-green-100 text-green-800',
      'In Progress': 'bg-purple-100 text-purple-800',
      Completed: 'bg-blue-100 text-blue-800',
      Cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.Pending;
  };

  // Design work status — a separate lifecycle from the order's own status
  // above, shown next to the designer's name so it's never ambiguous which
  // status a badge refers to.
  const getDesignStatusBadge = (status) => {
    const map = {
      pending: { label: 'Pending', classes: 'bg-muted text-muted-foreground' },
      in_progress: { label: 'In Progress', classes: 'bg-blue-100 text-blue-800' },
      revision: { label: 'Revision', classes: 'bg-orange-100 text-orange-800' },
      completed: { label: 'Completed', classes: 'bg-green-100 text-green-800' },
    };
    const mapped = map[status] || map.pending;
    return (
      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${mapped.classes}`}>
        {mapped.label}
      </span>
    );
  };

  const openDesignerModal = (orderId) => {
    setDesignerModalState({ open: true, orderId });
  };

  const openCrewModal = (orderId) => {
    setCrewModalState({ open: true, orderId });
  };

  const handleCreate = () => {
    setEditingOrder(null);
    setFormOpen(true);
  };

  const handleEdit = (order) => {
    setEditingOrder(order);
    setFormOpen(true);
  };

  const handleFormOpenChange = (open) => {
    setFormOpen(open);
    if (!open) setEditingOrder(null);
  };

  const handleDelete = async (order) => {
    if (!window.confirm(`Delete the order for "${order.customer_name}"? This also removes its invoice, payments, and assignments.`)) return;

    try {
      await orderService.remove(order.id);
      toast.success('Order deleted successfully');
      loadOrders();
    } catch (error) {
      toast.error(error.message || 'Failed to delete order');
    }
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/30" />;
    return sortConfig.direction === 'asc'
      ? <ChevronUp className="w-3.5 h-3.5 text-primary" />
      : <ChevronDown className="w-3.5 h-3.5 text-primary" />;
  };

  const clearDateFilter = () => {
    setDateFrom('');
    setDateTo('');
  };

  const visibleOrders = useMemo(() => {
    let result = [...orders];

    // Compare using the same local-timezone date the "Date" column displays
    // (via date-fns `format`), not a raw UTC slice — the API returns
    // event_date as a UTC timestamp, which can land on the previous day
    // when sliced directly.
    const localDateKey = (value) => {
      if (!value) return null;
      try {
        return format(new Date(value), 'yyyy-MM-dd');
      } catch {
        return null;
      }
    };

    if (dateFrom) {
      result = result.filter((o) => {
        const key = localDateKey(o.event_date);
        return key && key >= dateFrom;
      });
    }
    if (dateTo) {
      result = result.filter((o) => {
        const key = localDateKey(o.event_date);
        return key && key <= dateTo;
      });
    }

    if (sortConfig.key) {
      const { key, direction } = sortConfig;
      result.sort((a, b) => {
        let valA;
        let valB;
        switch (key) {
          case 'customer_name': valA = (a.customer_name || '').toLowerCase(); valB = (b.customer_name || '').toLowerCase(); break;
          case 'event_date': valA = a.event_date || ''; valB = b.event_date || ''; break;
          case 'status': valA = (a.status || '').toLowerCase(); valB = (b.status || '').toLowerCase(); break;
          case 'totalAmount': valA = a.totalAmount || 0; valB = b.totalAmount || 0; break;
          case 'paymentsReceived': valA = a.paymentsReceived || 0; valB = b.paymentsReceived || 0; break;
          default: valA = ''; valB = ''; break;
        }
        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [orders, dateFrom, dateTo, sortConfig]);

  return (
    <>
      <Helmet>
        <title>Order Management - Thenarsis</title>
        <meta name="description" content="Manage all your event orders and bookings" />
      </Helmet>

      <div className="min-h-screen bg-secondary/5 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
              <p className="text-muted-foreground mt-1">Track and manage all event bookings</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={loadOrders} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Create Order
              </Button>
            </div>
          </div>

          <Card className="shadow-sm border-0 mb-6">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <Label htmlFor="dateFrom" className="text-xs text-muted-foreground">Event Date From</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-9 w-[170px]"
                  />
                </div>
                <div>
                  <Label htmlFor="dateTo" className="text-xs text-muted-foreground">Event Date To</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-9 w-[170px]"
                  />
                </div>
                {(dateFrom || dateTo) && (
                  <Button variant="ghost" size="sm" onClick={clearDateFilter} className="text-muted-foreground">
                    <FilterX className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                )}
                <div className="text-xs text-muted-foreground ml-auto">
                  Showing {visibleOrders.length} of {orders.length} orders
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 overflow-hidden">
            <CardHeader className="bg-white border-b border-border">
              <CardTitle>All Orders</CardTitle>
              <CardDescription>View and manage customer orders and assignments</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-16">
                  <p className="text-destructive mb-4">Error loading orders. Please try again.</p>
                  <Button variant="outline" onClick={loadOrders}>Retry</Button>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground mb-4">No orders yet</p>
                  <Button onClick={handleCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Order
                  </Button>
                </div>
              ) : visibleOrders.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground mb-4">No orders match the selected date range</p>
                  <Button variant="outline" onClick={clearDateFilter}>
                    <FilterX className="w-4 h-4 mr-2" />
                    Clear Filter
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50 whitespace-nowrap">
                      <TableRow>
                        <TableHead className="pl-6 cursor-pointer select-none" onClick={() => handleSort('customer_name')}>
                          <span className="inline-flex items-center gap-1">Customer {renderSortIcon('customer_name')}</span>
                        </TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort('event_date')}>
                          <span className="inline-flex items-center gap-1">Date {renderSortIcon('event_date')}</span>
                        </TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort('status')}>
                          <span className="inline-flex items-center gap-1">Order Status {renderSortIcon('status')}</span>
                        </TableHead>
                        <TableHead>Designer</TableHead>
                        <TableHead>Crew</TableHead>
                        <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort('totalAmount')}>
                          <span className="inline-flex items-center gap-1 justify-end">Total {renderSortIcon('totalAmount')}</span>
                        </TableHead>
                        <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort('paymentsReceived')}>
                          <span className="inline-flex items-center gap-1 justify-end">Paid {renderSortIcon('paymentsReceived')}</span>
                        </TableHead>
                        <TableHead className="text-right pr-6">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleOrders.map((order) => (
                        <TableRow key={order.id} className="hover:bg-muted/30">
                          <TableCell className="pl-6 font-medium text-foreground whitespace-nowrap">
                            {order.customer_name}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{order.event_name}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(order.event_date), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(order.status)} whitespace-nowrap`}>
                              {order.status}
                            </Badge>
                          </TableCell>
                          
                          <TableCell>
                            {order.assigned_designer ? (
                              <div className="flex flex-col gap-1 items-start">
                                <div className="badge-assigned">
                                  {order.assigned_designer.name}
                                </div>
                                {order.designWork && getDesignStatusBadge(order.designWork.status)}
                              </div>
                            ) : (
                              <div className="flex flex-col gap-2 items-start">
                                <div className="badge-unassigned">Not Assigned</div>
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openDesignerModal(order.id)}>
                                  Assign Designer
                                </Button>
                              </div>
                            )}
                          </TableCell>

                          <TableCell>
                            {order.crew && order.crew.length > 0 ? (
                              <div className="flex flex-col gap-1 items-start">
                                {order.crew.length > 2 ? (
                                  <div className="flex flex-wrap gap-1 items-center max-w-[150px]">
                                    <span className="tag-crew">{order.crew[0].name}</span>
                                    <span className="tag-crew">{order.crew[1].name}</span>
                                    <div className="badge-assigned px-1.5 py-0.5 text-[10px]">
                                      +{order.crew.length - 2} crew
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap gap-1 max-w-[150px]">
                                    {order.crew.map((c, i) => (
                                      <span className="tag-crew" key={i}>{c.name}</span>
                                    ))}
                                  </div>
                                )}
                                <span className="text-[10px] font-semibold text-muted-foreground">
                                  {order.crew.filter((c) => ['confirmed', 'completed', 'hadir'].includes(c.attendanceStatus)).length}/{order.crew.length} confirmed
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-2 items-start">
                                <div className="badge-unassigned">Not Assigned</div>
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openCrewModal(order.id)}>
                                  Assign Crew
                                </Button>
                              </div>
                            )}
                          </TableCell>

                          <TableCell className="text-right font-medium whitespace-nowrap">
                            {formatRupiah(order.totalAmount)}
                          </TableCell>
                          <TableCell className="text-right text-green-600 font-medium whitespace-nowrap">
                            {formatRupiah(order.paymentsReceived)}
                          </TableCell>
                          <TableCell className="text-right pr-6 whitespace-nowrap">
                            <div className="flex justify-end gap-1">
                              <Link to={`/order/${order.id}`}>
                                <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </Link>
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(order)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(order)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <OrderForm
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        order={editingOrder}
        onSuccess={loadOrders}
      />

      <AssignDesignerModal
        open={designerModalState.open}
        onOpenChange={(val) => setDesignerModalState(prev => ({ ...prev, open: val }))}
        orderId={designerModalState.orderId}
        onSuccess={loadOrders}
      />

      <AssignCrewModal
        open={crewModalState.open}
        onOpenChange={(val) => setCrewModalState(prev => ({ ...prev, open: val }))}
        orderId={crewModalState.orderId}
        onSuccess={loadOrders}
      />
    </>
  );
};

export default OrderManagementPage;