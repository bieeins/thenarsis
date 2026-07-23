import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { ArrowLeft, Save, Link as LinkIcon, ExternalLink, Activity, Clock, User, Banknote, Loader2, AlertCircle, FileText, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { designWorkService } from '@/services/designWorkService.js';
import { designIncomeService } from '@/services/designIncomeService.js';
import { orderService } from '@/services/orderService.js';
import { userService } from '@/services/userService.js';
import { toast } from 'sonner';
import { format } from 'date-fns';
import OrderDataDisplay from '@/components/OrderDataDisplay.jsx';
import { validateAndFormatDesignLink } from '@/lib/validateAndFormatDesignLink.js';

const DesignWorkDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [work, setWork] = useState(null);
  const [assignedByName, setAssignedByName] = useState('Unknown User');
  const [incomeRecord, setIncomeRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingFee, setSavingFee] = useState(false);

  const [formData, setFormData] = useState({
    status: '',
    design_notes: '',
    design_file_link: ''
  });
  
  const [linkValidation, setLinkValidation] = useState({ isValid: true, error: null, isImage: false });
  const [feeAmount, setFeeAmount] = useState('');

  useEffect(() => {
    if (id) loadWorkDetail();
  }, [id]);

  const loadWorkDetail = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await designWorkService.get(id);
      let record = res.data;

      // design_work.order is not expanded with its product, so fetch the
      // order separately (orderService expands .product automatically).
      if (record?.order_id) {
        try {
          const orderRes = await orderService.get(record.order_id);
          record = { ...record, order: orderRes.data };
        } catch (orderErr) {
          console.error('Failed to load related order:', orderErr);
        }
      }

      setWork(record || null);

      if (record?.assigned_by) {
        try {
          const userRes = await userService.get(record.assigned_by);
          setAssignedByName(userRes.data?.name || 'Unknown User');
        } catch (userErr) {
          setAssignedByName('Unknown User');
        }
      }

      setFormData({
        status: record?.status || 'pending',
        design_notes: record?.design_notes || '',
        design_file_link: record?.design_file_link || ''
      });
      
      if (record?.design_file_link) {
        setLinkValidation(validateAndFormatDesignLink(record.design_file_link));
      }
      
      setFeeAmount(record?.design_fee ? String(record.design_fee) : '');

      if (record?.order_id && record?.designer_id) {
        const incomeRes = await designIncomeService
          .list({ designerId: record.designer_id })
          .catch(() => null);
        const income = incomeRes?.data?.find((i) => i.order_id === record.order_id) || null;
        setIncomeRecord(income);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(true);
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, design_file_link: val }));
    
    if (val.trim() === '') {
      setLinkValidation({ isValid: true, error: null, isImage: false });
    } else {
      setLinkValidation(validateAndFormatDesignLink(val));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!work) return;

    if (formData.design_file_link && !linkValidation.isValid) {
      toast.error(linkValidation.error || 'Please provide a valid URL');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        status: formData.status || 'pending',
        design_notes: formData.design_notes || '',
        design_file_link: linkValidation.url || ''
      };

      await designWorkService.update(id, payload);
      
      if (formData.status === 'completed' && work.status !== 'completed') {
        toast.success('Project marked as Completed!');
      } else {
        toast.success('Project details and link saved successfully');
      }

      await loadWorkDetail();
    } catch (err) {
      toast.error('Failed to save project details');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFee = async () => {
    const feeNum = Number(feeAmount);
    if (feeAmount === '' || isNaN(feeNum) || feeNum < 0 || !work) {
      toast.error('Please enter a valid fee amount (minimum 0).');
      return;
    }

    setSavingFee(true);
    try {
      const submitDate = new Date().toISOString();
      await designWorkService.update(id, {
        design_fee: feeNum,
        fee_submitted_date: submitDate
      });

      if (incomeRecord) {
        await designIncomeService.update(incomeRecord.id, {
          fee_amount: feeNum
        });
      } else if (currentUser) {
        await designIncomeService.create({
          order_id: work.order_id,
          designer_id: currentUser.id,
          designer_name: currentUser.name || 'Unknown',
          fee_amount: feeNum,
          status: 'pending'
        });
      }

      toast.success('Design fee submitted successfully');
      await loadWorkDetail();
    } catch (err) {
      toast.error('Failed to submit design fee');
    } finally {
      setSavingFee(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p>Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error || !work || !work.order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="bg-card border rounded-xl p-8 max-w-md w-full text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Project Not Found</h2>
          <p className="text-muted-foreground mb-6">Failed to load the design project details.</p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => navigate('/designer/my-projects')}>Go Back</Button>
            {error && <Button onClick={loadWorkDetail}>Retry</Button>}
          </div>
        </div>
      </div>
    );
  }

  const order = work.order;
  const assignedBy = assignedByName;
  const savedLinkDetails = validateAndFormatDesignLink(work.design_file_link);

  return (
    <>
      <Helmet>
        <title>{`${order?.event_name || 'Project Details'} - Thenarsis`}</title>
      </Helmet>

      <div className="min-h-screen bg-muted/30 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" onClick={() => navigate('/designer/my-projects')} className="mb-6 -ml-4 hover:bg-transparent">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Projects
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <OrderDataDisplay 
                order={order} 
                assignmentDate={work.assigned_date || work.created} 
                assignedBy={assignedBy} 
              />
              
              <Card className="border-0 shadow-lg" id="workspace">
                <CardHeader className="border-b border-border pb-4 bg-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        Design Workspace
                      </CardTitle>
                      <CardDescription>Update your progress and link finalized assets</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleSave} className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="status">Current Progress Status</Label>
                      <Select 
                        value={formData.status || 'pending'} 
                        onValueChange={(val) => setFormData({...formData, status: val})}
                        disabled={saving}
                      >
                        <SelectTrigger className="w-full sm:w-[300px] h-11 bg-background">
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="revision">Revision</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-4 border rounded-xl p-5 bg-muted/20">
                      <div>
                        <Label className="text-base font-semibold" htmlFor="design_link">Design Reference Link</Label>
                        <p className="text-sm text-muted-foreground mt-1 mb-4">
                          Provide a URL to Google Drive, Dropbox, Figma, or a direct image link.
                        </p>
                      </div>

                      {work.design_file_link && savedLinkDetails.isValid && (
                        <div className="mb-6 bg-card border border-primary/20 rounded-xl p-5 shadow-sm">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                              <LinkIcon className="w-4 h-4 text-primary" /> Current Saved Link
                            </div>
                            <Button size="sm" asChild className="h-8">
                              <a href={savedLinkDetails.url} target="_blank" rel="noopener noreferrer">
                                Open Design <ExternalLink className="w-3.5 h-3.5 ml-2" />
                              </a>
                            </Button>
                          </div>
                          
                          {savedLinkDetails.isImage ? (
                            <div className="rounded-lg overflow-hidden border bg-muted flex items-center justify-center min-h-[200px] relative group">
                              <img src={savedLinkDetails.url} alt="Design Preview" className="w-full h-auto max-h-[400px] object-contain block" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button variant="secondary" asChild>
                                  <a href={savedLinkDetails.url} target="_blank" rel="noopener noreferrer">
                                    <ImageIcon className="w-4 h-4 mr-2" /> View Full Image
                                  </a>
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-muted p-4 rounded-lg flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                              <a href={savedLinkDetails.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">
                                {savedLinkDetails.url}
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="relative">
                          <LinkIcon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${!linkValidation.isValid && formData.design_file_link ? 'text-destructive' : 'text-muted-foreground'}`} />
                          <Input
                            id="design_link"
                            type="url"
                            placeholder="https://example.com/project"
                            className={`pl-9 h-11 bg-background ${!linkValidation.isValid && formData.design_file_link ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                            value={formData.design_file_link}
                            onChange={handleLinkChange}
                            disabled={saving}
                          />
                        </div>
                        {!linkValidation.isValid && formData.design_file_link && (
                          <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3" /> {linkValidation.error}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="notes" className="text-base font-semibold">Designer Notes</Label>
                      <p className="text-sm text-muted-foreground">Add specific instructions or internal notes for the team.</p>
                      <Textarea 
                        id="notes" 
                        placeholder="Add specific instructions, or internal notes..."
                        className="min-h-[120px] bg-background resize-y"
                        value={formData.design_notes || ''}
                        onChange={(e) => setFormData({...formData, design_notes: e.target.value})}
                        disabled={saving}
                      />
                    </div>

                    <div className="pt-4 border-t border-border flex justify-end">
                      <Button type="submit" className="w-full sm:w-auto h-11 text-base shadow-md transition-all active:scale-[0.98]" disabled={saving || (!linkValidation.isValid && !!formData.design_file_link)}>
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        {saving ? 'Saving Updates...' : 'Save All Changes'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1 space-y-6">
              <Card className="border-0 shadow-md">
                <CardHeader className="border-b border-border pb-4 bg-card">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-green-600" /> Design Fee
                    </CardTitle>
                    {incomeRecord && (
                      <Badge variant="outline" className={
                        incomeRecord.status === 'paid' ? 'bg-green-100 text-green-800 border-green-200' :
                        incomeRecord.status === 'approved' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        'bg-yellow-100 text-yellow-800 border-yellow-200'
                      }>
                        {(incomeRecord.status || 'pending').toUpperCase()}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-3">
                    <Label htmlFor="feeAmount">Compensation Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">Rp</span>
                      <Input
                        id="feeAmount"
                        type="number"
                        min="0"
                        placeholder="0"
                        className="pl-10 font-numeric font-medium"
                        value={feeAmount || ''}
                        onChange={(e) => setFeeAmount(e.target.value)}
                        disabled={savingFee || incomeRecord?.status === 'paid' || incomeRecord?.status === 'approved'}
                      />
                    </div>
                    {incomeRecord?.status === 'paid' && (
                      <p className="text-xs text-muted-foreground">Fee has been paid and cannot be changed.</p>
                    )}
                  </div>
                  
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white" 
                    onClick={handleSaveFee}
                    disabled={savingFee || incomeRecord?.status === 'paid' || incomeRecord?.status === 'approved'}
                  >
                    {savingFee ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    {savingFee ? 'Submitting...' : 'Submit Design Fee'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DesignWorkDetail;