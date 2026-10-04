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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Wallet, PieChart, Plus, Pencil, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { expenseService } from '@/services/expenseService.js';
import { expenseCategoryService } from '@/services/expenseCategoryService.js';
import { fileService } from '@/services/fileService.js';
import { userService } from '@/services/userService.js';
import { formatRupiah } from '@/lib/currency.js';

const ExpenseInputPage = () => {
  const { currentUser } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const emptyForm = {
    transaction_date: new Date().toISOString().split('T')[0],
    category: '',
    amount: '',
    description: '',
    receipt_file: null
  };

  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      const [records, users, categoryList] = await Promise.all([
        expenseService.listAll({ sort: 'transaction_date', order: 'desc' }),
        userService.listAll(),
        expenseCategoryService.list(),
      ]);
      setExpenses(records);
      setUserMap(Object.fromEntries(users.map((u) => [u.id, u])));
      setCategories(categoryList);
    } catch (error) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingExpense(null);
    setEditDialogOpen(false);
    const fileInput = document.getElementById('receipt_file');
    if (fileInput) fileInput.value = '';
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      transaction_date: expense.transaction_date?.split('T')[0] ?? expense.transaction_date?.split(' ')[0] ?? '',
      category: expense.category || '',
      amount: expense.amount || '',
      description: expense.description || '',
      receipt_file: null,
    });
    setEditDialogOpen(true);
  };

  const handleDelete = async (expense) => {
    if (!window.confirm('Hapus pengeluaran ini? Tindakan tidak bisa dibatalkan.')) return;
    try {
      await expenseService.remove(expense.id);
      toast.success('Pengeluaran dihapus');
      if (editingExpense?.id === expense.id) resetForm();
      loadExpenses();
    } catch (error) {
      toast.error(error.message || 'Gagal menghapus pengeluaran');
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
      let receiptFileId = editingExpense?.receipt_file ?? null;
      if (formData.receipt_file) {
        const uploadRes = await fileService.upload(formData.receipt_file, 'expenses');
        receiptFileId = uploadRes.data?.id || null;
      }

      if (editingExpense) {
        await expenseService.update(editingExpense.id, {
          transaction_date: formData.transaction_date + ' 12:00:00.000Z',
          category: formData.category,
          amount: formData.amount,
          description: formData.description,
          receipt_file: receiptFileId,
        });
        toast.success('Pengeluaran diperbarui');
      } else {
        await expenseService.create({
          transaction_date: formData.transaction_date + ' 12:00:00.000Z',
          category: formData.category,
          amount: formData.amount,
          description: formData.description,
          uploaded_by_id: currentUser?.id,
          receipt_file: receiptFileId,
        });
        toast.success('Expense recorded successfully');
      }

      resetForm();
      loadExpenses();
    } catch (error) {
      toast.error(error.message || 'Failed to record expense');
    } finally {
      setSubmitting(false);
    }
  };

  // ── filters & pagination ──────────────────────────────────────────────
  const PAGE_SIZE = 10;
  const [monthFilter, setMonthFilter] = React.useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [page, setPage] = React.useState(1);

  const handleMonthChange = (val) => { setMonthFilter(val); setPage(1); };
  const handleCategoryChange = (val) => { setCategoryFilter(val); setPage(1); };

  const filteredExpenses = expenses.filter((e) => {
    const dateStr = e.transaction_date?.slice(0, 7);
    const monthOk = monthFilter === 'all' || dateStr === monthFilter;
    const catOk = categoryFilter === 'all' || e.category === categoryFilter;
    return monthOk && catOk;
  });

  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / PAGE_SIZE));
  const pagedExpenses = filteredExpenses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const availableMonths = [...new Set(expenses.map((e) => e.transaction_date?.slice(0, 7)).filter(Boolean))].sort().reverse();

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
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.name}>
                              {cat.name}
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
                        <p className="text-3xl font-bold">{formatRupiah(totalFiltered)}</p>
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
                      <Select value={categoryFilter} onValueChange={handleCategoryChange}>
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                          <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.name}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 max-h-[100px] overflow-y-auto pr-2 text-sm">
                      {Object.entries(expensesByCategory).map(([cat, amount]) => (
                        <div key={cat} className="flex justify-between items-center">
                          <span className="capitalize">{cat.replace('_', ' ')}</span>
                          <span className="font-semibold">{formatRupiah(amount)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-lg border-0">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1">
                      <CardTitle>Riwayat Pengeluaran</CardTitle>
                      <CardDescription>
                        {filteredExpenses.length} transaksi
                        {monthFilter !== 'all' ? ` — ${monthFilter}` : ''}
                        {categoryFilter !== 'all' ? ` — ${categoryFilter}` : ''}
                      </CardDescription>
                    </div>
                    {/* Filter bulan */}
                    <Select value={monthFilter} onValueChange={handleMonthChange}>
                      <SelectTrigger className="w-[150px] h-8 text-xs">
                        <SelectValue placeholder="Pilih bulan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Bulan</SelectItem>
                        {availableMonths.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {/* Filter kategori */}
                    <Select value={categoryFilter} onValueChange={handleCategoryChange}>
                      <SelectTrigger className="w-[150px] h-8 text-xs">
                        <SelectValue placeholder="Semua Kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Kategori</SelectItem>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredExpenses.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">Belum ada data pengeluaran.</p>
                    </div>
                  ) : (
                    <>
                    <div className="space-y-4">
                      {pagedExpenses.map((expense) => (
                        <div key={expense.id} className="flex flex-col sm:flex-row justify-between p-4 rounded-xl border bg-card hover:shadow-md transition-shadow">
                          <div className="mb-2 sm:mb-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-lg">{formatRupiah(expense.amount)}</span>
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
                          <div className="flex items-center gap-1">
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
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(expense)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(expense)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t mt-4">
                        <p className="text-sm text-muted-foreground">
                          {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredExpenses.length)} dari {filteredExpenses.length}
                        </p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                            ← Prev
                          </Button>
                          <span className="flex items-center text-sm px-2">{page} / {totalPages}</span>
                          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
                            Next →
                          </Button>
                        </div>
                      </div>
                    )}
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Edit Dialog — muncul di tengah layar, tidak perlu scroll */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-4 h-4" />
              Edit Pengeluaran
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <Label htmlFor="edit_transaction_date">Tanggal (Date) *</Label>
              <Input
                id="edit_transaction_date"
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit_category">Kategori *</Label>
              <Input
                id="edit_category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                placeholder="e.g. Bahan Baku"
                className="mt-1"
                list="edit_category_list"
              />
              <datalist id="edit_category_list">
                {categories.map((cat) => <option key={cat} value={cat} />)}
              </datalist>
            </div>
            <div>
              <Label htmlFor="edit_amount">Jumlah (IDR) *</Label>
              <Input
                id="edit_amount"
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
              <Label htmlFor="edit_description">Deskripsi (Description)</Label>
              <Textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detail pengeluaran..."
                className="mt-1"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit_receipt_file">Bukti / Nota (ganti jika perlu)</Label>
              <Input
                id="edit_receipt_file"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setFormData({ ...formData, receipt_file: e.target.files?.[0] || null })}
                className="mt-1"
              />
              {editingExpense?.receipt_file && !formData.receipt_file && (
                <p className="text-xs text-muted-foreground mt-1">Receipt lama tetap disimpan jika tidak upload baru.</p>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? 'Menyimpan...' : 'Update Pengeluaran'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm} disabled={submitting}>
                Batal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExpenseInputPage;