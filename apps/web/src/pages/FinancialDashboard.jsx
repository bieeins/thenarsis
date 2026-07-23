import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, DollarSign, Receipt, PieChart as PieChartIcon } from 'lucide-react';
import FinancialNavigation from '@/components/FinancialNavigation';
import { format, subMonths, isSameMonth } from 'date-fns';
import { orderService } from '@/services/orderService.js';
import { paymentService } from '@/services/paymentService.js';
import { expenseService } from '@/services/expenseService.js';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'sonner';

const FinancialDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      const [orders, payments, expenses] = await Promise.all([
        orderService.listAll({ sort: 'created_at', order: 'desc' }),
        paymentService.listAll({ status: 'Confirmed', sort: 'payment_date', order: 'desc' }),
        expenseService.listAll({ sort: 'transaction_date', order: 'desc' }),
      ]);

      const now = new Date();
      
      // Totals
      const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      // Current Month
      const currentMonthPayments = payments.filter(p => isSameMonth(new Date(p.payment_date), now));
      const currentMonthExpenses = expenses.filter(e => isSameMonth(new Date(e.transaction_date), now));
      const cmRevenue = currentMonthPayments.reduce((sum, p) => sum + p.amount, 0);
      const cmExpenses = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
      const cmProfit = cmRevenue - cmExpenses;

      // Prepare Trend Data (last 6 months)
      const trends = [];
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(now, i);
        const monthName = format(d, 'MMM yyyy');
        
        const mPayments = payments.filter(p => isSameMonth(new Date(p.payment_date), d));
        const mExpenses = expenses.filter(e => isSameMonth(new Date(e.transaction_date), d));
        
        const rev = mPayments.reduce((sum, p) => sum + p.amount, 0);
        const exp = mExpenses.reduce((sum, e) => sum + e.amount, 0);
        
        trends.push({
          name: monthName,
          Revenue: rev,
          Expenses: exp,
          Profit: rev - exp
        });
      }

      // Expense Breakdown
      const expGrouped = expenses.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
      }, {});
      const expenseBreakdown = Object.keys(expGrouped).map(key => ({
        name: key.replace('_', ' '),
        value: expGrouped[key]
      }));

      setData({
        totals: { totalRevenue, totalExpenses, netProfit, profitMargin, cashBalance: netProfit },
        currentMonth: { revenue: cmRevenue, expenses: cmExpenses, profit: cmProfit, ordersCount: orders.filter(o => isSameMonth(new Date(o.created_at), now)).length },
        trends,
        expenseBreakdown,
        recent: {
          orders: orders.slice(0, 5),
          expenses: expenses.slice(0, 5),
          payments: payments.slice(0, 5)
        }
      });
    } catch (error) {
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['hsl(var(--revenue))', 'hsl(var(--expense))', 'hsl(var(--pending))', 'hsl(var(--info))', 'hsl(var(--primary))'];

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>Financial Dashboard - Thenarsis</title></Helmet>
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FinancialNavigation />
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Financial Overview</h1>
            <p className="text-muted-foreground mt-1">Real-time metrics and cash flow analysis</p>
          </div>

          {/* Key Metrics Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-lg bg-card col-span-1 lg:col-span-2 row-span-2 flex flex-col justify-center overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-muted-foreground">Net Profit (All Time)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-bold tracking-tight font-numeric text-foreground mb-4">
                  IDR {data.totals.netProfit.toLocaleString()}
                </div>
                <div className="flex gap-4 text-sm font-medium">
                  <div className="flex items-center gap-1 text-revenue">
                    <TrendingUp className="w-4 h-4" /> Revenue: {data.totals.totalRevenue.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1 text-expense">
                    <TrendingDown className="w-4 h-4" /> Expenses: {data.totals.totalExpenses.toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">This Month Revenue</CardTitle>
                <DollarSign className="w-4 h-4 text-revenue" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-numeric">IDR {data.currentMonth.revenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">{data.currentMonth.ordersCount} new orders</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">This Month Expenses</CardTitle>
                <Receipt className="w-4 h-4 text-expense" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-numeric">IDR {data.currentMonth.expenses.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-secondary text-secondary-foreground">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium opacity-80">Profit Margin</CardTitle>
                <PieChartIcon className="w-4 h-4 opacity-80" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-numeric text-primary">{data.totals.profitMargin.toFixed(1)}%</div>
                <p className="text-xs opacity-70 mt-1">Overall health</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Cash Balance</CardTitle>
                <DollarSign className="w-4 h-4 text-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-numeric text-profit">IDR {data.totals.cashBalance.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="col-span-1 lg:col-span-2 border-0 shadow-md">
              <CardHeader>
                <CardTitle>Revenue vs Expenses (Last 6 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.trends} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tickFormatter={(val) => `Rp${val/1000}k`} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip formatter={(value) => `IDR ${value.toLocaleString()}`} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
                      <Legend iconType="circle" />
                      <Bar dataKey="Revenue" fill="hsl(var(--revenue))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      <Bar dataKey="Expenses" fill="hsl(var(--expense))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1 border-0 shadow-md">
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {data.expenseBreakdown.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">No expenses recorded</div>
                ) : (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data.expenseBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {data.expenseBreakdown.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value) => `IDR ${value.toLocaleString()}`} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Zig-Zag Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Recent Payments In</CardTitle>
                <CardDescription>Latest confirmed incoming cash</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.recent.payments.length === 0 ? <p className="text-sm text-muted-foreground">No recent payments.</p> :
                    data.recent.payments.map((p) => (
                      <div key={p.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/30 border border-border">
                        <div>
                          <p className="font-medium text-sm">Payment via {p.payment_method}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(p.payment_date), 'MMM dd, yyyy')}</p>
                        </div>
                        <div className="font-numeric font-medium text-revenue">+IDR {p.amount.toLocaleString()}</div>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Recent Expenses Out</CardTitle>
                <CardDescription>Latest operating costs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.recent.expenses.length === 0 ? <p className="text-sm text-muted-foreground">No recent expenses.</p> :
                    data.recent.expenses.map((e) => (
                      <div key={e.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/30 border border-border">
                        <div>
                          <p className="font-medium text-sm capitalize">{e.category.replace('_', ' ')}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(e.transaction_date), 'MMM dd, yyyy')}</p>
                        </div>
                        <div className="font-numeric font-medium text-expense">-IDR {e.amount.toLocaleString()}</div>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </>
  );
};

export default FinancialDashboard;