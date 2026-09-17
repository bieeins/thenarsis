import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Users, Wallet, Activity, LayoutDashboard, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import FeesAndCompensationWidget from '@/components/FeesAndCompensationWidget.jsx';
import { orderService } from '@/services/orderService.js';
import { invoiceService } from '@/services/invoiceService.js';
import { paymentService } from '@/services/paymentService.js';
import { expenseService } from '@/services/expenseService.js';
import { userService } from '@/services/userService.js';
import { designIncomeService } from '@/services/designIncomeService.js';
import { crewAssignmentService } from '@/services/crewAssignmentService.js';
import { formatRupiah } from '@/lib/currency.js';

const OwnerDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    grossRevenue: 0,
    totalDesignFees: 0,
    totalCrewAmounts: 0,
    netRevenue: 0,
    teamSize: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--muted-foreground))', 'hsl(var(--border))', 'hsl(var(--accent))'];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [orders, invoices, payments, expenses, users, designFees, crewAssignments] = await Promise.all([
        orderService.listAll({ sort: 'created_at', order: 'desc' }),
        invoiceService.listAll(),
        paymentService.listAll({ status: 'Confirmed' }),
        expenseService.listAll(),
        userService.listAll(),
        designIncomeService.listAll(),
        crewAssignmentService.listAll(),
      ]);

      const grossRevenue = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
      const totalDesignFees = designFees.reduce((sum, fee) => sum + (fee.fee_amount || 0), 0);
      const totalCrewAmounts = crewAssignments.reduce((sum, crew) => sum + (crew.attendance_amount || 0), 0);
      const netRevenue = grossRevenue - totalDesignFees - totalCrewAmounts;

      setStats({
        totalOrders: orders.length,
        grossRevenue,
        totalDesignFees,
        totalCrewAmounts,
        netRevenue,
        teamSize: users.length
      });

      // Prepare recent orders
      const ordersWithPayments = await Promise.all(
        orders.slice(0, 5).map(async (order) => {
          const orderInvoices = invoices.filter(inv => inv.order_id === order.id);
          let totalPaid = 0;
          if (orderInvoices.length > 0) {
            const orderPayments = payments.filter(p => p.invoice_id === orderInvoices[0].id);
            totalPaid = orderPayments.reduce((sum, p) => sum + p.amount, 0);
          }
          return {
            ...order,
            totalAmount: orderInvoices[0]?.total_amount || 0,
            paymentsReceived: totalPaid
          };
        })
      );
      setRecentOrders(ordersWithPayments);

      // Prepare expense chart data
      const expGrouped = expenses.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
      }, {});
      
      const chartData = Object.keys(expGrouped).map(key => ({
        name: key.replace('_', ' '),
        value: expGrouped[key]
      }));
      setExpenseData(chartData);

    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: 'badge-status-waiting',
      Confirmed: 'badge-status-done',
      'In Progress': 'badge-status-proses',
      Completed: 'badge-status-done',
      Cancelled: 'bg-destructive/10 text-destructive'
    };
    return colors[status] || colors.Pending;
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
        <title>Owner Dashboard - Thenarsis</title>
      </Helmet>

      <div className="min-h-screen bg-muted/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Business Overview</h1>
              <p className="text-muted-foreground mt-1">Welcome back. Here's your operational summary.</p>
            </div>
            <Link to="/financial">
              <Button className="font-semibold shadow-sm">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Go to Financial Hub
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className={`shadow-lg border-0 ${stats.netRevenue >= 0 ? 'bg-green-50 dark:bg-green-950/30 text-green-900 dark:text-green-100' : 'bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-100'}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium opacity-80">Net Revenue</CardTitle>
                <Activity className="w-4 h-4 opacity-80" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-numeric">{formatRupiah(stats.netRevenue)}</div>
              </CardContent>
            </Card>

            <Card className="shadow-md border-0">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Gross Revenue</CardTitle>
                <TrendingUp className="w-4 h-4 text-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground font-numeric">{formatRupiah(stats.grossRevenue)}</div>
              </CardContent>
            </Card>

            <Card className="shadow-md border-0">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Compensation</CardTitle>
                <Wallet className="w-4 h-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400 font-numeric">- {formatRupiah(stats.totalDesignFees + stats.totalCrewAmounts)}</div>
              </CardContent>
            </Card>

            <Card className="shadow-md border-0">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Team</CardTitle>
                <Users className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats.teamSize} Members</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Quick Actions / Navigation */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold tracking-tight">Quick Actions</h3>
              <div className="grid gap-4">
                <Link to="/owner/calendar-events" className="block">
                  <div className="p-4 rounded-xl border bg-card hover:border-primary hover:shadow-md transition-all group flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <CalendarDays className="w-5 h-5" />
                      </div>
                      <div className="font-medium text-foreground">Calendar Events</div>
                    </div>
                  </div>
                </Link>
                <Link to="/expenses" className="block">
                  <div className="p-4 rounded-xl border bg-card hover:border-primary hover:shadow-md transition-all group flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div className="font-medium text-foreground">Input Pengeluaran</div>
                    </div>
                  </div>
                </Link>
                <Link to="/payment-tracking" className="block">
                  <div className="p-4 rounded-xl border bg-card hover:border-primary hover:shadow-md transition-all group flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <div className="font-medium text-foreground">Payment Tracking</div>
                    </div>
                  </div>
                </Link>
                <Link to="/team-management" className="block">
                  <div className="p-4 rounded-xl border bg-card hover:border-primary hover:shadow-md transition-all group flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Users className="w-5 h-5" />
                      </div>
                      <div className="font-medium text-foreground">Manage Team</div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Expenses Chart */}
            <Card className="lg:col-span-2 shadow-md border-0">
              <CardHeader>
                <CardTitle>Expenses Breakdown</CardTitle>
                <CardDescription>Operating costs by category</CardDescription>
              </CardHeader>
              <CardContent>
                {expenseData.length === 0 ? (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    No expense data available
                  </div>
                ) : (
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {expenseData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatRupiah(value)} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-8 mb-8">
            <Card className="shadow-md border-0">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Latest confirmed and pending events</CardDescription>
                </div>
                <Link to="/orders">
                  <Button variant="outline" size="sm">View All Orders</Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 rounded-l-lg">Customer</th>
                        <th className="px-4 py-3">Event Date</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3 text-right rounded-r-lg">Paid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order) => (
                        <tr key={order.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-4 font-medium text-foreground">{order.customer_name}</td>
                          <td className="px-4 py-4 text-muted-foreground">{format(new Date(order.event_date), 'MMM dd, yyyy')}</td>
                          <td className="px-4 py-4">
                            <span className={`${getStatusColor(order.status)} inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold`}>{order.status}</span>
                          </td>
                          <td className="px-4 py-4 text-right font-numeric">{formatRupiah(order.totalAmount)}</td>
                          <td className="px-4 py-4 text-right text-revenue font-numeric font-medium">{formatRupiah(order.paymentsReceived)}</td>
                        </tr>
                      ))}
                      {recentOrders.length === 0 && (
                        <tr>
                          <td colSpan="5" className="px-4 py-8 text-center text-muted-foreground">
                            No recent orders found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Fees & Compensation Widget */}
            <FeesAndCompensationWidget />
          </div>
        </div>
      </div>
    </>
  );
};

export default OwnerDashboard;