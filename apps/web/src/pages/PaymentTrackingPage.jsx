import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CreditCard, Download, FileText, Send, Share2, CheckCircle2 } from 'lucide-react';

const PaymentTrackingPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [stripeMockOpen, setStripeMockOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'Bank Transfer',
    payment_status: 'Confirmed',
    notes: ''
  });

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const records = await pb.collection('invoices').getFullList({
        expand: 'order_id,order_id.product_id',
        sort: '-created',
        $autoCancel: false
      });

      const invoicesWithPayments = await Promise.all(
        records.map(async (invoice) => {
          const payments = await pb.collection('payments').getFullList({
            filter: `invoice_id = "${invoice.id}"`,
            $autoCancel: false
          });
          const totalPaid = payments.reduce((sum, p) => p.payment_status === 'Confirmed' ? sum + p.amount : sum, 0);
          return {
            ...invoice,
            payments,
            totalPaid,
            remainingBalance: invoice.total_amount - totalPaid
          };
        })
      );

      setInvoices(invoicesWithPayments);
    } catch (error) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (invoice) => {
    setSelectedInvoice(invoice);
    setFormData({
      amount: invoice.remainingBalance.toString(),
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'Bank Transfer',
      payment_status: 'Confirmed',
      notes: ''
    });
    setFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (formData.payment_method === 'Credit Card') {
        // Open Stripe Mock instead of saving immediately
        setFormOpen(false);
        setStripeMockOpen(true);
        setSubmitting(false);
        return;
      }

      await executePaymentSave(formData);
    } catch (error) {
      toast.error('Failed to record payment');
      setSubmitting(false);
    }
  };

  const executePaymentSave = async (data) => {
    try {
      await pb.collection('payments').create({
        invoice_id: selectedInvoice.id,
        amount: parseFloat(data.amount),
        payment_date: data.payment_date + ' 12:00:00.000Z',
        payment_method: data.payment_method,
        payment_status: data.payment_status,
        notes: data.notes
      }, { $autoCancel: false });

      toast.success('Payment recorded successfully');
      setFormOpen(false);
      setStripeMockOpen(false);
      loadInvoices();
    } catch (error) {
      toast.error('Failed to save payment record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStripeSuccess = () => {
    executePaymentSave({ ...formData, payment_status: 'Confirmed', payment_method: 'Credit Card' });
  };

  const generatePDF = async (invoice) => {
    try {
      toast.info('Generating PDF Invoice...');
      const html2pdf = (await import('html2pdf.js')).default;
      
      const element = document.createElement('div');
      element.innerHTML = `
        <div style="padding: 40px; font-family: sans-serif; color: #000;">
          <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #FBBF24; padding-bottom: 20px; mb-6">
            <div>
               <h1 style="font-size: 32px; color: #000; margin: 0;">THENARSIS</h1>
               <p style="color: #666; margin: 5px 0;">Professional Event Services</p>
            </div>
            <div style="text-align: right;">
               <h2 style="font-size: 24px; margin: 0; color: #FBBF24;">INVOICE</h2>
               <p>#${invoice.invoice_number}</p>
               <p>${format(new Date(invoice.created), 'MMM dd, yyyy')}</p>
            </div>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-top: 40px;">
            <div>
              <h3 style="margin-bottom: 10px; color: #333;">Billed To:</h3>
              <p style="font-weight: bold; margin: 0;">${invoice.expand?.order_id?.customer_name}</p>
              <p style="margin: 5px 0;">${invoice.expand?.order_id?.phone_number}</p>
            </div>
            <div style="text-align: right;">
              <h3 style="margin-bottom: 10px; color: #333;">Event Details:</h3>
              <p style="margin: 0;">${invoice.expand?.order_id?.event_name}</p>
              <p style="margin: 5px 0;">${format(new Date(invoice.expand?.order_id?.event_date), 'MMM dd, yyyy')}</p>
              <p style="margin: 0;">${invoice.expand?.order_id?.event_location}</p>
            </div>
          </div>

          <table style="width: 100%; margin-top: 40px; border-collapse: collapse;">
            <thead>
              <tr style="background: #FBBF24; color: #000;">
                <th style="padding: 12px; text-align: left;">Description</th>
                <th style="padding: 12px; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">
                  <strong>${invoice.expand?.order_id?.expand?.product_id?.package_name || 'Event Package'}</strong>
                </td>
                <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">
                  IDR ${invoice.total_amount.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>

          <div style="margin-top: 40px; width: 300px; float: right;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span>Total Amount:</span>
              <strong>IDR ${invoice.total_amount.toLocaleString()}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: green;">
              <span>Total Paid:</span>
              <span>- IDR ${invoice.totalPaid.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; border-top: 2px solid #000; padding-top: 10px; font-size: 18px;">
              <strong>Balance Due:</strong>
              <strong style="color: #FBBF24;">IDR ${invoice.remainingBalance.toLocaleString()}</strong>
            </div>
          </div>
          
          <div style="clear: both; margin-top: 60px; text-align: center; color: #666; font-size: 12px;">
             Thank you for trusting Thenarsis Management System.
          </div>
        </div>
      `;

      const opt = {
        margin: 10,
        filename: `${invoice.invoice_number}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      html2pdf().from(element).set(opt).save();
    } catch (e) {
      toast.error('Failed to generate PDF');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Confirmed': return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Confirmed</Badge>;
      case 'Pending': return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case 'Failed': return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
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
        <title>Payment Tracking - Thenarsis</title>
      </Helmet>

      <div className="min-h-screen bg-muted/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Payment Tracking & Invoicing</h1>
            <p className="text-muted-foreground mt-1">Manage digital payments and generate invoices</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {invoices.map((invoice) => (
              <Card key={invoice.id} className="shadow-md border-0 overflow-hidden flex flex-col">
                <CardHeader className="bg-secondary text-secondary-foreground pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{invoice.invoice_number}</CardTitle>
                      <CardDescription className="text-secondary-foreground/70">
                        {invoice.expand?.order_id?.customer_name}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-white/10 border-white/20 text-white">
                      {invoice.remainingBalance === 0 ? 'PAID' : 'DUE'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4 flex-grow">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Amount</span>
                      <span className="font-semibold text-foreground">IDR {invoice.total_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Confirmed Paid</span>
                      <span className="font-semibold text-green-600">IDR {invoice.totalPaid.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-2 pt-2 border-t border-border">
                      <span className="font-medium text-foreground">Balance</span>
                      <span className="font-bold text-primary text-base">IDR {invoice.remainingBalance.toLocaleString()}</span>
                    </div>
                  </div>

                  {invoice.payments && invoice.payments.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent Payments</p>
                      {invoice.payments.slice(0, 3).map(p => (
                        <div key={p.id} className="flex justify-between items-center text-xs p-2 bg-muted rounded-md">
                          <div>
                            <p className="font-medium">IDR {p.amount.toLocaleString()}</p>
                            <p className="text-muted-foreground">{p.payment_method}</p>
                          </div>
                          {getStatusBadge(p.payment_status)}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="bg-muted/50 p-4 flex gap-2 flex-wrap border-t border-border">
                  <Button variant="outline" size="sm" onClick={() => generatePDF(invoice)} className="flex-1">
                    <Download className="w-4 h-4 mr-2" /> PDF
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      const url = `${window.location.origin}/invoice/${invoice.invoice_number}`;
                      window.open(`https://wa.me/?text=Here is your invoice link: ${url}`, '_blank');
                    }}
                    className="flex-1"
                  >
                    <Share2 className="w-4 h-4 mr-2" /> Share
                  </Button>
                  {invoice.remainingBalance > 0 && (
                    <Button onClick={() => handleOpenForm(invoice)} size="sm" className="w-full mt-2">
                      <CreditCard className="w-4 h-4 mr-2" /> Process Payment
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>

          {invoices.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-border">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-xl font-medium">No invoices found</p>
              <p className="text-muted-foreground mt-2">Create an order to generate your first invoice.</p>
            </div>
          )}
        </div>
      </div>

      {/* Manual Payment Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount (IDR) *</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                min="1"
                max={selectedInvoice?.remainingBalance}
                className="mt-1"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="payment_date">Date *</Label>
                <Input
                  id="payment_date"
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="payment_status">Status *</Label>
                <Select
                  value={formData.payment_status}
                  onValueChange={(value) => setFormData({ ...formData, payment_status: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="payment_method">Method *</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Credit Card">Credit Card (Stripe)</SelectItem>
                  <SelectItem value="E-wallet">E-wallet</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Check">Check</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {formData.payment_method === 'Credit Card' && (
                <p className="text-xs text-primary mt-2 font-medium">
                  Proceeding will open the Stripe secure payment gateway.
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-1"
                rows={2}
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {formData.payment_method === 'Credit Card' ? 'Proceed to Stripe' : 'Save Payment'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stripe Mock Dialog */}
      <Dialog open={stripeMockOpen} onOpenChange={setStripeMockOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader className="text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-[#635BFF]/10 text-[#635BFF] rounded-full flex items-center justify-center mb-2">
              <CreditCard className="w-6 h-6" />
            </div>
            <DialogTitle>Stripe Checkout (Simulation)</DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="bg-muted p-4 rounded-xl text-center">
              <p className="text-sm text-muted-foreground mb-1">Total to pay</p>
              <p className="text-3xl font-bold">IDR {Number(formData.amount).toLocaleString()}</p>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              In a real environment, the user would enter their credit card details here via Stripe Elements.
            </p>
            <Button onClick={handleStripeSuccess} className="w-full bg-[#635BFF] hover:bg-[#635BFF]/90 text-white shadow-lg" disabled={submitting}>
              {submitting ? 'Processing...' : 'Simulate Success'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PaymentTrackingPage;