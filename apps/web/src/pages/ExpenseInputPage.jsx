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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Wallet, PieChart, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { expenseService } from '@/services/expenseService.js';
import { fileService } from '@/services/fileService.js';
import { userService } from '@/services/userService.js';

const ExpenseInputPage = () => {
  const { currentUser } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const [formData, setFormData] = useState({
    transaction_date: new Date().toISOString().split('T')[0],
    category: '',
    amount: '',
    description: '',
    receipt_file: null
  });

  const CATEGORIES = [
    { value: 'supplies', label: 'Supplies' },
    { value: 'hosting', label: 'Hosting' },
    { value: 'domain', label: 'Domain' },
    { value: 'internet', label: 'Internet' },
    { value: 'ads', label: 'Ads' },
    { value: 'equipment_maintenance', label: 'Equipment Maintenance' },
    { value: 'food', label: 'Food' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      const [records, users] = await Promise.all([
        expenseService.listAll({ sort: 'transaction_date', order: 'desc' }),
        userService.listAll(),
      ]);
      setExpenses(records);
      setUserMap(Object.fromEntries(users.map((u) => [u.id, u])));
    } catch (error) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData({ ...formData, receipt_file: e.target.files[0] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let receiptFileId = null;
      if (formData.receipt_file) {
        const uploadRes = await fileService.upload(formData.receipt_file, 'expenses');
        receiptFileId = uploadRes.data?.id || null;
      }

      await expenseService.create({
        transaction_date: formData.transaction_date + ' 12:00:00.000Z',
        category: formData.category,
        amount: formData.amount,
        description: formData.description,
        uploaded_by_id: currentUser?.id,
        receipt_file: receiptFileId,
      });

      toast.success('Expense recorded successfully');
      setFormData({
        transaction_date: new Date().toISOString().split('T')[0],
        category: '',
        amount: '',
        description: '',
        receipt_file: null
      });
      // Reset file input manually
      const fileInput = document.getElementById('receipt_file');
      if (fileInput) fileInput.value = '';
      
      loadExpenses();
    } catch (error) {
      toast.error(error.message || 'Failed to record expense');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredExpenses = categoryFilter === 'all' 
    ? expenses 
    : expenses.filter(e => e.category === categoryFilter);

  const totalFiltered = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const expensesByCategory = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Expense Management - Thenarsis</title>
      </Helmet>

      <div className="min-h-screen bg-muted/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Pengeluaran (Expenses)</h1>
            <p className="text-muted-foreground mt-1">Record and track business expenses</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-1"
            >
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-secondary text-secondary-foreground rounded-t-xl">
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5 text-primary" />
                    Input Pengeluaran
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="transaction_date">Tanggal (Date) *</Label>
                      <Input
                        id="transaction_date"
                        type="date"
                        value={formData.transaction_date}
                        onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                        required
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="category">Kategori (Category) *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                        required
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="amount">Jumlah (Amount IDR) *</Label>
                      <Input
                        id="amount"
                        type="number"
                        min="0"
                        step="1"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        required
                        placeholder="e.g. 150000"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Deskripsi (Description)</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Detail pengeluaran..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="receipt_file">Bukti / Nota (Receipt)</Label>
                      <Input
                        id="receipt_file"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="mt-1"
                      />
                    </div>

                    <Button type="submit" className="w-full font-semibold" disabled={submitting}>
                      {submitting ? 'Menyimpan...' : 'Simpan Pengeluaran'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            {/* List & Summary Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="bg-primary text-primary-foreground shadow-lg border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-black/10 rounded-xl">
                        <Wallet className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-sm font-medium opacity-90">Total Filtered</p>
                        <p className="text-3xl font-bold">IDR {totalFiltered.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-muted-foreground font-medium">
                        <PieChart className="w-5 h-5" /> Summary
                      </div>
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                          <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {CATEGORIES.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 max-h-[100px] overflow-y-auto pr-2 text-sm">
                      {Object.entries(expensesByCategory).map(([cat, amount]) => (
                        <div key={cat} className="flex justify-between items-center">
                          <span className="capitalize">{cat.replace('_', ' ')}</span>
                          <span className="font-semibold">IDR {amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle>Riwayat Pengeluaran (History)</CardTitle>
                  <CardDescription>Recent expenses based on your filter</CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredExpenses.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">Belum ada data pengeluaran.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredExpenses.map((expense) => (
                        <div key={expense.id} className="flex flex-col sm:flex-row justify-between p-4 rounded-xl border bg-card hover:shadow-md transition-shadow">
                          <div className="mb-2 sm:mb-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-lg">IDR {expense.amount.toLocaleString()}</span>
                              <Badge variant="outline" className="capitalize text-xs">
                                {expense.category.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(expense.transaction_date), 'MMM dd, yyyy')} • Oleh {userMap[expense.uploaded_by_id]?.name || 'Unknown'}
                            </p>
                            {expense.description && (
                              <p className="text-sm mt-2 max-w-[500px] truncate">{expense.description}</p>
                            )}
                          </div>
                          <div className="flex items-center">
                            {expense.receipt_file && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    const url = await fileService.getObjectUrl(expense.receipt_file);
                                    window.open(url, '_blank', 'noopener,noreferrer');
                                  } catch (err) {
                                    toast.error('Failed to load receipt');
                                  }
                                }}
                              >
                                View Receipt
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExpenseInputPage;