import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
import { Plus, Eye, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { orderService } from '@/services/orderService.js';
import { invoiceService } from '@/services/invoiceService.js';
import { paymentService } from '@/services/paymentService.js';
import { crewAssignmentService } from '@/services/crewAssignmentService.js';
import { format } from 'date-fns';
import OrderForm from '@/components/OrderForm';
import AssignDesignerModal from '@/components/AssignDesignerModal';
import AssignCrewModal from '@/components/AssignCrewModal';

const OrderManagementPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

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
      const [records, invoices, payments, crewAssignments] = await Promise.all([
        orderService.listAll({ sort: 'created_at', order: 'desc' }),
        invoiceService.listAll(),
        paymentService.listAll(),
        crewAssignmentService.listAll(),
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

      const crewByOrder = new Map();
      crewAssignments.forEach((ca) => {
        if (!crewByOrder.has(ca.order_id)) crewByOrder.set(ca.order_id, []);
        if (ca.crew?.name) crewByOrder.get(ca.order_id).push(ca.crew.name);
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

  const openDesignerModal = (orderId) => {
    setDesignerModalState({ open: true, orderId });
  };

  const openCrewModal = (orderId) => {
    setCrewModalState({ open: true, orderId });
  };

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
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Order
              </Button>
            </div>
          </div>

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
                  <Button onClick={() => setFormOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Order
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50 whitespace-nowrap">
                      <TableRow>
                        <TableHead className="pl-6">Customer</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Designer</TableHead>
                        <TableHead>Crew</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-right pr-6">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
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
                              <div className="badge-assigned">
                                {order.assigned_designer.name}
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
                              order.crew.length > 2 ? (
                                <div className="flex flex-wrap gap-1 items-center max-w-[150px]">
                                  <span className="tag-crew">{order.crew[0]}</span>
                                  <span className="tag-crew">{order.crew[1]}</span>
                                  <div className="badge-assigned px-1.5 py-0.5 text-[10px]">
                                    +{order.crew.length - 2} crew
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-wrap gap-1 max-w-[150px]">
                                  {order.crew.map((c, i) => (
                                    <span className="tag-crew" key={i}>{c}</span>
                                  ))}
                                </div>
                              )
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
                            IDR {order.totalAmount.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-green-600 font-medium whitespace-nowrap">
                            IDR {order.paymentsReceived.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right pr-6 whitespace-nowrap">
                            <Link to={`/order/${order.id}`}>
                              <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary">
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </Button>
                            </Link>
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
        onOpenChange={setFormOpen}
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