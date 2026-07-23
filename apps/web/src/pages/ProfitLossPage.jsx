import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Calculator } from 'lucide-react';
import FinancialNavigation from '@/components/FinancialNavigation';
import pb from '@/lib/pocketbaseClient';
import { exportToPDF } from '@/lib/exportUtils';
import { toast } from 'sonner';

const ProfitLossPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [payments, expenses] = await Promise.all([
        pb.collection('payments').getFullList({ filter: "payment_status = 'Confirmed'", $autoCancel: false }),
        pb.collection('expenses').getFullList({ $autoCancel: false })
      ]);

      const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
      
      const expenseByCategory = expenses.reduce((acc, curr) => {
        const cat = curr.category.replace('_', ' ');
        acc[cat] = (acc[cat] || 0) + curr.amount;
        return acc;
      }, {});

      const totalExpenses = Object.values(expenseByCategory).reduce((a, b) => a + b, 0);
      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      setData({ totalRevenue, expenseByCategory, totalExpenses, netProfit, profitMargin });
    } catch (error) {
      toast.error('Failed to load P&L data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <>
      <Helmet><title>Profit & Loss - Thenarsis</title></Helmet>
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FinancialNavigation />
          
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Profit & Loss Statement</h1>
              <p className="text-muted-foreground mt-1">Comprehensive view of business profitability (All Time)</p>
            </div>
            <Button onClick={() => exportToPDF('pl-statement', 'Profit_Loss_Statement')}><Download className="w-4 h-4 mr-2"/> PDF</Button>
          </div>

          <Card id="pl-statement" className="border-0 shadow-xl overflow-hidden bg-white">
            <CardHeader className="border-b border-border bg-muted/10 pb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary rounded-xl text-primary-foreground"><Calculator className="w-6 h-6" /></div>
                <div>
                  <CardTitle className="text-2xl">Thenarsis P&L</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Generated: {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              {/* Revenue */}
              <div>
                <h3 className="text-lg font-bold border-b border-border pb-2 mb-4 text-revenue">Revenue</h3>
                <div className="flex justify-between items-center py-2 px-4 bg-muted/20 rounded-md mb-2">
                  <span className="font-medium">Total Orders Revenue</span>
                  <span className="font-numeric font-semibold">Rp {data.totalRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-3 px-4 bg-muted/40 rounded-md border-t-2 border-border mt-4">
                  <span className="font-bold text-lg">Total Revenue</span>
                  <span className="font-numeric font-bold text-lg text-revenue">Rp {data.totalRevenue.toLocaleString()}</span>
                </div>
              </div>

              {/* Expenses */}
              <div>
                <h3 className="text-lg font-bold border-b border-border pb-2 mb-4 text-expense">Operating Expenses</h3>
                <div className="space-y-1">
                  {Object.entries(data.expenseByCategory).map(([cat, amount]) => (
                    <div key={cat} className="flex justify-between items-center py-2 px-4 hover:bg-muted/20 rounded-md transition-colors">
                      <span className="capitalize">{cat}</span>
                      <span className="font-numeric">Rp {amount.toLocaleString()}</span>
                    </div>
                  ))}
                  {Object.keys(data.expenseByCategory).length === 0 && (
                    <div className="text-muted-foreground px-4 py-2 italic text-sm">No expenses recorded</div>
                  )}
                </div>
                <div className="flex justify-between items-center py-3 px-4 bg-muted/40 rounded-md border-t-2 border-border mt-4">
                  <span className="font-bold text-lg">Total Expenses</span>
                  <span className="font-numeric font-bold text-lg text-expense">Rp {data.totalExpenses.toLocaleString()}</span>
                </div>
              </div>

              {/* Net Profit */}
              <div className={`p-6 rounded-xl border-2 ${data.netProfit >= 0 ? 'border-success bg-success/5' : 'border-destructive bg-destructive/5'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xl font-bold">Net Profit</span>
                  <span className={`text-2xl font-numeric font-bold ${data.netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                    Rp {data.netProfit.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm opacity-80">
                  <span>Profit Margin</span>
                  <span className="font-numeric font-medium">{data.profitMargin.toFixed(2)}%</span>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default ProfitLossPage;