import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Search, Paperclip } from 'lucide-react';
import FinancialNavigation from '@/components/FinancialNavigation';
import pb from '@/lib/pocketbaseClient';
import { format } from 'date-fns';
import { exportToCSV, exportToPDF } from '@/lib/exportUtils';
import { toast } from 'sonner';

const ExpenseReportPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const records = await pb.collection('expenses').getFullList({ expand: 'uploaded_by_id', sort: '-transaction_date', $autoCancel: false });
      setExpenses(records);
    } catch (error) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const filteredExpenses = expenses.filter(exp => {
    if (category !== 'All' && exp.category !== category) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return exp.description?.toLowerCase().includes(s) || exp.expand?.uploaded_by_id?.name?.toLowerCase().includes(s);
  });

  const handleExportCSV = () => {
    const data = filteredExpenses.map(exp => ({
      'Date': format(new Date(exp.transaction_date), 'yyyy-MM-dd'),
      'Category': exp.category,
      'Description': exp.description?.replace(/<[^>]*>?/gm, '') || '',
      'Amount': exp.amount,
      'Uploaded By': exp.expand?.uploaded_by_id?.name || 'Unknown'
    }));
    exportToCSV('Expense_Report', ['Date', 'Category', 'Description', 'Amount', 'Uploaded By'], data);
  };

  const categories = [...new Set(expenses.map(e => e.category))];

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <>
      <Helmet><title>Expense Report - Thenarsis</title></Helmet>
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FinancialNavigation />
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Expense Report</h1>
              <p className="text-muted-foreground mt-1">Detailed breakdown of operating costs</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportCSV}><Download className="w-4 h-4 mr-2"/> CSV</Button>
              <Button onClick={() => exportToPDF('expense-report-table', 'Expense_Report')}><Download className="w-4 h-4 mr-2"/> PDF</Button>
            </div>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-col sm:flex-row gap-4 justify-between">
              <CardTitle>Expense Breakdown</CardTitle>
              <div className="flex gap-2 w-full sm:w-auto">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Categories</SelectItem>
                    {categories.map(c => <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search desc or member..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
              </div>
            </CardHeader>
            <CardContent id="expense-report-table">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50 whitespace-nowrap">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Uploaded By</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Receipt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map(exp => (
                      <TableRow key={exp.id} className="hover:bg-muted/30">
                        <TableCell className="whitespace-nowrap">{format(new Date(exp.transaction_date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="capitalize whitespace-nowrap">{exp.category.replace('_', ' ')}</TableCell>
                        <TableCell className="truncate max-w-[250px]" dangerouslySetInnerHTML={{ __html: exp.description || '-' }}></TableCell>
                        <TableCell className="whitespace-nowrap">{exp.expand?.uploaded_by_id?.name || 'Unknown'}</TableCell>
                        <TableCell className="text-right font-numeric font-medium text-expense">Rp {exp.amount.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          {exp.receipt_file ? (
                            <a href={pb.files.getURL(exp, exp.receipt_file)} target="_blank" rel="noreferrer" className="inline-flex items-center text-primary hover:underline">
                              <Paperclip className="w-4 h-4" />
                            </a>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredExpenses.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No records found</TableCell></TableRow>
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

export default ExpenseReportPage;