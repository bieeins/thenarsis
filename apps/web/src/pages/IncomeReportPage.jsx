import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Download, Search } from 'lucide-react';
import FinancialNavigation from '@/components/FinancialNavigation';
import { format } from 'date-fns';
import { exportToCSV, exportToPDF } from '@/lib/exportUtils';
import { toast } from 'sonner';
import { invoiceService } from '@/services/invoiceService.js';
import { paymentService } from '@/services/paymentService.js';
import { orderService } from '@/services/orderService.js';

const IncomeReportPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [orderMap, setOrderMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [invs, pays, orders] = await Promise.all([
        invoiceService.listAll({ sort: 'created_at', order: 'desc' }),
        paymentService.listAll({ status: 'Confirmed' }),
        orderService.listAll(),
      ]);
      setInvoices(invs);
      setPayments(pays);
      setOrderMap(Object.fromEntries(orders.map((o) => [o.id, o])));
    } catch (error) {
      toast.error('Failed to load income data');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentForInvoice = (invoiceId) => {
    return payments.filter(p => p.invoice_id === invoiceId).reduce((sum, p) => sum + p.amount, 0);
  };

  const filteredInvoices = invoices.filter(inv => {
    if (!search) return true;
    const s = search.toLowerCase();
    const order = orderMap[inv.order_id];
    return inv.invoice_number.toLowerCase().includes(s) || order?.customer_name?.toLowerCase().includes(s) || order?.event_name?.toLowerCase().includes(s);
  });

  const handleExportCSV = () => {
    const data = filteredInvoices.map(inv => ({
      'Invoice': inv.invoice_number,
      'Customer': orderMap[inv.order_id]?.customer_name,
      'Event': orderMap[inv.order_id]?.event_name,
      'Date': format(new Date(inv.created_at), 'yyyy-MM-dd'),
      'Total Amount': inv.total_amount,
      'Paid': getPaymentForInvoice(inv.id),
      'Pending': inv.total_amount - getPaymentForInvoice(inv.id)
    }));
    exportToCSV('Income_Report', ['Invoice', 'Customer', 'Event', 'Date', 'Total Amount', 'Paid', 'Pending'], data);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <>
      <Helmet><title>Income Report - Thenarsis</title></Helmet>
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FinancialNavigation />
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Income Report</h1>
              <p className="text-muted-foreground mt-1">Detailed breakdown of all revenue sources</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportCSV}><Download className="w-4 h-4 mr-2"/> CSV</Button>
              <Button onClick={() => exportToPDF('income-report-table', 'Income_Report')}><Download className="w-4 h-4 mr-2"/> PDF</Button>
            </div>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-col sm:flex-row gap-4 justify-between">
              <CardTitle>Income Breakdown</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search invoice or customer..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </CardHeader>
            <CardContent id="income-report-table">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50 whitespace-nowrap">
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Pending</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map(inv => {
                      const order = orderMap[inv.order_id];
                      const paid = getPaymentForInvoice(inv.id);
                      const pending = inv.total_amount - paid;
                      return (
                        <TableRow key={inv.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium whitespace-nowrap">{inv.invoice_number}</TableCell>
                          <TableCell className="whitespace-nowrap">{order?.customer_name}</TableCell>
                          <TableCell className="whitespace-nowrap">{order?.event_name}</TableCell>
                          <TableCell>{order?.product?.package_name}</TableCell>
                          <TableCell className="text-right font-numeric font-medium">Rp {inv.total_amount.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-numeric text-revenue">Rp {paid.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-numeric text-pending">{pending > 0 ? `Rp ${pending.toLocaleString()}` : '0'}</TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredInvoices.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No records found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default IncomeReportPage;