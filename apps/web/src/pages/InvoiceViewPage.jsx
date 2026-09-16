import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Share2, Download, Mail, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { invoiceService } from '@/services/invoiceService.js';
import { formatRupiah } from '@/lib/currency.js';

const InvoiceViewPage = () => {
  const { invoiceNumber } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [order, setOrder] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (invoiceNumber) loadInvoice();
  }, [invoiceNumber]);

  const loadInvoice = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await invoiceService.getPublicByNumber(invoiceNumber);
      const invoiceData = res.data;

      if (!invoiceData) {
        toast.error('Invoice not found');
        setLoading(false);
        return;
      }

      setInvoice(invoiceData);

      const sortedPayments = [...(invoiceData.payments || [])].sort(
        (a, b) => new Date(b.payment_date) - new Date(a.payment_date)
      );
      setPayments(sortedPayments);
      setOrder(invoiceData.order || null);
    } catch (err) {
      setError(true);
      toast.error('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const remainingBalance = invoice ? (invoice.total_amount || 0) - totalPaid : 0;

  const handleShare = (platform) => {
    const url = window.location.href;
    const text = `Invoice ${invoiceNumber || ''} - Thenarsis Management System`;

    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    } else if (platform === 'email') {
      window.location.href = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`;
    }
  };

  const handleDownload = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground animate-pulse">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center p-8 bg-card rounded-2xl shadow-sm border border-border max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="font-bold text-lg mb-2">Error Loading Invoice</p>
          <p className="text-muted-foreground mb-6">We couldn't load the invoice details. Please try again.</p>
          <Button onClick={loadInvoice}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md border-0 shadow-sm w-full">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold mb-2">Invoice Not Found</h2>
            <p className="text-muted-foreground">The invoice you are looking for does not exist or has been deleted.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayOrder = order || {};

  return (
    <>
      <Helmet>
        <title>{`Invoice ${invoiceNumber || 'Details'} - Thenarsis`}</title>
        <meta name="description" content="View invoice details and payment information" />
      </Helmet>

      <div className="min-h-screen bg-secondary/5 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-end gap-2 mb-6 print:hidden">
            <Button variant="outline" size="sm" onClick={() => handleShare('whatsapp')}>
              <Share2 className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleShare('email')}>
              <Mail className="w-4 h-4 mr-2" />
              Email
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download / Print
            </Button>
          </div>

          <Card className="shadow-lg border-0">
            <CardHeader className="text-center border-b pb-8">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-3xl">T</span>
                </div>
              </div>
              <CardTitle className="text-3xl font-bold">Thenarsis Management System</CardTitle>
              <p className="text-sm text-muted-foreground">Professional Event Services</p>
            </CardHeader>

            <CardContent className="p-8 sm:p-12 space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-8">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Invoice Details</h2>
                  <p className="text-sm text-muted-foreground">Invoice Number</p>
                  <p className="font-bold text-lg mb-4">{invoice.invoice_number}</p>
                  <p className="text-sm text-muted-foreground">Date Issued</p>
                  <p className="font-medium">{invoice.created_at ? format(new Date(invoice.created_at), 'MMMM dd, yyyy') : 'N/A'}</p>
                </div>
                <div className="sm:text-right">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Bill To</h2>
                  <p className="font-bold text-xl mb-1">{displayOrder.customer_name || 'Customer'}</p>
                  <p className="text-sm text-muted-foreground">{displayOrder.phone_number || '-'}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h2 className="text-lg font-semibold mb-4">Event Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-muted/20 p-6 rounded-xl border">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Event Name</p>
                    <p className="font-semibold text-lg">{displayOrder.event_name || 'Unnamed Event'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Event Date</p>
                    <p className="font-medium">{displayOrder.event_date ? format(new Date(displayOrder.event_date), 'MMMM dd, yyyy') : 'TBD'}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-sm text-muted-foreground mb-1">Location</p>
                    <p className="font-medium">{displayOrder.event_location || 'TBD'}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">Description</th>
                      <th className="text-right py-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-4">
                        <p className="font-semibold">{displayOrder.product?.package_name || 'Custom Package'}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2 max-w-md">{displayOrder.product?.description?.replace(/<[^>]*>?/gm, '') || ''}</p>
                      </td>
                      <td className="py-4 text-right font-numeric font-semibold text-lg">
                        {formatRupiah(invoice.total_amount || 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <div className="w-full sm:w-1/2 md:w-1/3 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-numeric font-medium">{formatRupiah(invoice.total_amount || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600 pb-3 border-b border-border">
                    <span>Payments Received</span>
                    <span className="font-numeric font-medium">- {formatRupiah(totalPaid)}</span>
                  </div>
                  <div className="flex justify-between text-lg pt-1">
                    <span className="font-bold">Balance Due</span>
                    <span className="font-numeric font-bold text-primary">{formatRupiah(remainingBalance)}</span>
                  </div>
                </div>
              </div>

              {payments.length > 0 && (
                <div className="pt-8 print:pt-4">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Payment History</h2>
                  <div className="grid gap-3">
                    {payments.map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center p-4 bg-muted/30 border rounded-lg">
                        <div>
                          <p className="font-semibold font-numeric">{formatRupiah(payment.amount || 0)}</p>
                          <p className="text-sm text-muted-foreground">
                            {payment.payment_date ? format(new Date(payment.payment_date), 'MMM dd, yyyy') : 'Unknown Date'} • {payment.payment_method || 'Unknown Method'}
                          </p>
                        </div>
                        <div className="text-green-600 bg-green-100 px-3 py-1 rounded-full text-xs font-semibold">
                          Confirmed
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="text-center pt-8 mt-8 border-t border-border text-sm text-muted-foreground print:text-xs">
                <p>Thank you for your business!</p>
                <p>If you have any questions about this invoice, please contact us.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default InvoiceViewPage;