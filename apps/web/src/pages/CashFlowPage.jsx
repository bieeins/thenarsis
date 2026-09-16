import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import FinancialNavigation from '@/components/FinancialNavigation';
import { exportToPDF } from '@/lib/exportUtils';
import { paymentService } from '@/services/paymentService.js';
import { expenseService } from '@/services/expenseService.js';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subMonths, isSameMonth } from 'date-fns';
import { formatRupiah } from '@/lib/currency.js';

const CashFlowPage = () => {
  const [data, setData] = useState({ totalIn: 0, totalOut: 0, net: 0, chartData: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [payments, expenses] = await Promise.all([
        paymentService.listAll({ status: 'Confirmed' }),
        expenseService.listAll(),
      ]);

      const totalIn = payments.reduce((sum, p) => sum + p.amount, 0);
      const totalOut = expenses.reduce((sum, e) => sum + e.amount, 0);
      
      const now = new Date();
      const chartData = [];
      let cumulativeBalance = 0;

      // Build 6 months data
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(now, i);
        const monthName = format(d, 'MMM yyyy');
        
        const mIn = payments.filter(p => isSameMonth(new Date(p.payment_date), d)).reduce((sum, p) => sum + p.amount, 0);
        const mOut = expenses.filter(e => isSameMonth(new Date(e.transaction_date), d)).reduce((sum, e) => sum + e.amount, 0);
        
        cumulativeBalance += (mIn - mOut);
        
        chartData.push({
          name: monthName,
          CashIn: mIn,
          CashOut: mOut,
          Balance: cumulativeBalance
        });
      }

      setData({ totalIn, totalOut, net: totalIn - totalOut, chartData });
    } catch (error) {
      toast.error('Failed to load Cash Flow data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <>
      <Helmet><title>Cash Flow - Thenarsis</title></Helmet>
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FinancialNavigation />
          
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Cash Flow Analysis</h1>
              <p className="text-muted-foreground mt-1">Track liquidity and cash balances</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-0 shadow-md border-l-4 border-revenue">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Cash In</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold font-numeric text-revenue">{formatRupiah(data.totalIn)}</div></CardContent>
            </Card>
            <Card className="border-0 shadow-md border-l-4 border-expense">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Cash Out</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold font-numeric text-expense">{formatRupiah(data.totalOut)}</div></CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-secondary text-secondary-foreground border-l-4 border-primary">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium opacity-80">Net Cash Flow</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold font-numeric text-primary">{formatRupiah(data.net)}</div></CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-lg mb-8">
            <CardHeader><CardTitle>Cash Balance Trend (Last 6 Months)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(val) => `Rp${val/1000}k`} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value) => formatRupiah(value)} />
                    <Line type="monotone" dataKey="Balance" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default CashFlowPage;