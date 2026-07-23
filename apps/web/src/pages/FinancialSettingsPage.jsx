import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save } from 'lucide-react';
import FinancialNavigation from '@/components/FinancialNavigation';
import { toast } from 'sonner';

const FinancialSettingsPage = () => {
  const [settings, setSettings] = useState({
    currency: 'IDR',
    taxRate: '11',
    paymentTerms: '14',
    autoReports: false,
    reportEmail: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('financial_settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('financial_settings', JSON.stringify(settings));
    toast.success('Financial preferences saved successfully');
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