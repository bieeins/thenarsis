import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FinancialNavigation from '@/components/FinancialNavigation';
import { toast } from 'sonner';
import { orderService } from '@/services/orderService.js';
import { paymentService } from '@/services/paymentService.js';
import { expenseService } from '@/services/expenseService.js';

const FinancialAnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [orders, payments, expenses] = await Promise.all([
        orderService.listAll(),
        paymentService.listAll({ status: 'Confirmed' }),
        expenseService.listAll(),
      ]);

      const rev = payments.reduce((sum, p) => sum + p.amount, 0);
      const exp = expenses.reduce((sum, e) => sum + e.amount, 0);
      const numOrders = orders.length || 1; // prevent div by zero

      setData({
        revenuePerOrder: rev / numOrders,
        expenseRatio: rev > 0 ? (exp / rev) * 100 : 0,
        profitMargin: rev > 0 ? ((rev - exp) / rev) * 100 : 0,
        totalOrders: numOrders
      });
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <>
      <Helmet><title>Financial Analytics - Thenarsis</title></Helmet>
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FinancialNavigation />
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Key Performance Indicators</h1>
            <p className="text-muted-foreground mt-1">Deep dive into financial health metrics</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Avg Revenue per Order</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-numeric text-revenue">Rp {Math.round(data.revenuePerOrder).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-2">Based on {data.totalOrders} total orders</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Expense Ratio</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-numeric text-expense">{data.expenseRatio.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-2">Percentage of revenue consumed by costs</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-secondary text-secondary-foreground">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium opacity-80">Overall Profit Margin</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-numeric text-primary">{data.profitMargin.toFixed(1)}%</div>
                <p className="text-xs opacity-70 mt-2">Net margin across all time</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 p-8 border border-border bg-card rounded-xl text-center">
            <p className="text-muted-foreground mb-4">Advanced analytics and AI forecasting models are being prepared for your account.</p>
            <div className="inline-flex items-center justify-center px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold">
              Forecasting Engine Coming Soon
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FinancialAnalyticsPage;