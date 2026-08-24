import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save, Plus, Pencil, Trash2, X, Check, Loader2, Tag } from 'lucide-react';
import FinancialNavigation from '@/components/FinancialNavigation';
import { toast } from 'sonner';
import { expenseCategoryService } from '@/services/expenseCategoryService.js';
import { ApiError } from '@/lib/apiClient.js';

const FinancialSettingsPage = () => {
  const [settings, setSettings] = useState({
    currency: 'IDR',
    taxRate: '11',
    paymentTerms: '14',
    autoReports: false,
    reportEmail: ''
  });

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('financial_settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const records = await expenseCategoryService.list();
      setCategories(records);
    } catch (error) {
      toast.error('Failed to load expense categories');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleSave = () => {
    localStorage.setItem('financial_settings', JSON.stringify(settings));
    toast.success('Financial preferences saved successfully');
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;

    setAddingCategory(true);
    try {
      const res = await expenseCategoryService.create(name);
      setCategories((prev) => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCategoryName('');
      toast.success('Category added');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Failed to add category');
    } finally {
      setAddingCategory(false);
    }
  };

  const startEditing = (category) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleRenameCategory = async (id) => {
    const name = editingName.trim();
    if (!name) return;

    setSavingId(id);
    try {
      const res = await expenseCategoryService.update(id, name);
      setCategories((prev) => prev.map((c) => (c.id === id ? res.data : c)).sort((a, b) => a.name.localeCompare(b.name)));
      toast.success('Category renamed');
      cancelEditing();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Failed to rename category');
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteCategory = async (category) => {
    if (!window.confirm(`Delete category "${category.name}"?`)) return;

    setDeletingId(category.id);
    try {
      await expenseCategoryService.remove(category.id);
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
      toast.success('Category deleted');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Failed to delete category');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <Helmet><title>Financial Settings - Thenarsis</title></Helmet>
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FinancialNavigation />
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Financial Settings</h1>
            <p className="text-muted-foreground mt-1">Configure reporting and financial defaults</p>
          </div>

          <div className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>General Preferences</CardTitle>
                <CardDescription>Default values used across reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Input value={settings.currency} disabled />
                    <p className="text-xs text-muted-foreground">Currency is fixed to IDR</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Default Tax Rate (%)</Label>
                    <Input 
                      type="number" 
                      value={settings.taxRate} 
                      onChange={(e) => setSettings({...settings, taxRate: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Default Payment Terms (Days)</Label>
                    <Input 
                      type="number" 
                      value={settings.paymentTerms} 
                      onChange={(e) => setSettings({...settings, paymentTerms: e.target.value})} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Tag className="w-5 h-5" /> Expense Categories</CardTitle>
                <CardDescription>Manage the categories available when recording an expense</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleAddCategory} className="flex gap-2">
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="New category name, e.g. Travel"
                    disabled={addingCategory}
                  />
                  <Button type="submit" disabled={addingCategory || !newCategoryName.trim()}>
                    {addingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  </Button>
                </form>

                {categoriesLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No categories yet. Add one above.</p>
                ) : (
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center justify-between gap-2 p-3 border rounded-lg bg-muted/20">
                        {editingId === category.id ? (
                          <>
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              disabled={savingId === category.id}
                              className="h-8"
                              autoFocus
                            />
                            <div className="flex gap-1 shrink-0">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => handleRenameCategory(category.id)}
                                disabled={savingId === category.id || !editingName.trim()}
                              >
                                {savingId === category.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEditing} disabled={savingId === category.id}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="text-sm font-medium">{category.name}</span>
                            <div className="flex gap-1 shrink-0">
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEditing(category)}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteCategory(category)}
                                disabled={deletingId === category.id}
                              >
                                {deletingId === category.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Automated Reports</CardTitle>
                <CardDescription>Schedule financial summaries via email</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/20">
                  <div>
                    <p className="font-medium">Enable Auto-Reports</p>
                    <p className="text-sm text-muted-foreground">Send monthly PDF reports automatically</p>
                  </div>
                  <Switch 
                    checked={settings.autoReports}
                    onCheckedChange={(val) => setSettings({...settings, autoReports: val})}
                  />
                </div>
                {settings.autoReports && (
                  <div className="space-y-2 pt-2">
                    <Label>Recipient Email</Label>
                    <Input 
                      type="email" 
                      placeholder="admin@thenarsis.com" 
                      value={settings.reportEmail} 
                      onChange={(e) => setSettings({...settings, reportEmail: e.target.value})} 
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave} className="w-full sm:w-auto">
                <Save className="w-4 h-4 mr-2" /> Save Settings
              </Button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default FinancialSettingsPage;