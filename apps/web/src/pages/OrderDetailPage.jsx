import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, User, Users, Trash2, Calendar, MapPin, Phone, Banknote, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { createAssignmentNotification } from '@/lib/notificationUtils.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { orderService } from '@/services/orderService.js';
import { userService } from '@/services/userService.js';
import { crewAssignmentService } from '@/services/crewAssignmentService.js';
import { designWorkService } from '@/services/designWorkService.js';
import { designIncomeService } from '@/services/designIncomeService.js';

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [order, setOrder] = useState(null);
  const [designers, setDesigners] = useState([]);
  const [crew, setCrew] = useState([]);
  const [assignedCrew, setAssignedCrew] = useState([]);
  const [designWork, setDesignWork] = useState(null);
  const [designIncome, setDesignIncome] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedDesigner, setSelectedDesigner] = useState('');
  const [selectedCrewId, setSelectedCrewId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [updatingFee, setUpdatingFee] = useState(false);

  useEffect(() => {
    if (id) {
      loadOrderDetails();
      loadUsers();
      loadAssignedCrew();
      loadDesignData();
    }
  }, [id]);

  const loadOrderDetails = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await orderService.get(id);
      const record = res.data;
      setOrder(record || null);
      setSelectedDesigner(record?.assigned_designer_id || 'unassigned');
    } catch (err) {
      setError(true);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const loadDesignData = async () => {
    try {
      const dwRes = await designWorkService.list({ orderId: id }).catch(() => null);
      const dw = dwRes?.data?.[0] || null;
      setDesignWork(dw);

      if (dw?.designer_id) {
        const diRes = await designIncomeService.list({ designerId: dw.designer_id }).catch(() => null);
        const di = diRes?.data?.find((i) => i.order_id === id) || null;
        setDesignIncome(di);
      } else {
        setDesignIncome(null);
      }
    } catch (err) {
      console.error('Error loading design related data', err);
    }
  };

  const loadUsers = async () => {
    try {
      const designerRecords = await userService.listAll({ role: 'designer' });
      setDesigners(designerRecords || []);

      const crewRecords = await userService.listAll({ role: 'crew' });
      setCrew(crewRecords || []);
    } catch (err) {
      toast.error('Failed to load team members');
    }
  };

  const loadAssignedCrew = async () => {
    try {
      const assignments = await crewAssignmentService.listAll({ orderId: id });
      setAssignedCrew(assignments || []);
    } catch (err) {
      console.error('Failed to load assigned crew', err);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await orderService.update(id, { status: newStatus });
      toast.success('Status updated successfully');
      loadOrderDetails();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleAssignDesigner = async () => {
    if (!selectedDesigner) {
      toast.error('Please select a designer');
      return;
    }

    setSubmitting(true);
    try {
      if (selectedDesigner === 'unassigned') {
        await orderService.update(id, {
          assigned_designer_id: null
        });
        toast.success('Designer removed successfully');
      } else {
        await orderService.update(id, {
          assigned_designer_id: selectedDesigner
        });

        const existingWork = await designWorkService.listAll({ orderId: id });

        if (existingWork && existingWork.length > 0) {
          await designWorkService.update(existingWork[0].id, {
            designer_id: selectedDesigner,
            assigned_by: currentUser?.id
          });
        } else {
          await designWorkService.create({
            order_id: id,
            designer_id: selectedDesigner,
            status: 'pending',
            assigned_by: currentUser?.id,
            assigned_date: new Date().toISOString()
          });
        }

        if (order.assigned_designer_id !== selectedDesigner) {
          await createAssignmentNotification(selectedDesigner, order);
        }

        toast.success('Designer assigned successfully');
      }
      
      loadOrderDetails();
      loadDesignData();
    } catch (err) {
      toast.error('Failed to assign designer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignCrew = async () => {
    if (!selectedCrewId) {
      toast.error('Please select a crew member');
      return;
    }

    setSubmitting(true);
    try {
      const existingAssignment = assignedCrew.find(a => a.crew_id === selectedCrewId);

      if (existingAssignment) {
        toast.error('This crew member is already assigned');
        setSubmitting(false);
        return;
      }

      await crewAssignmentService.create({
        order_id: id,
        crew_id: selectedCrewId,
        status: 'pending',
        attendance_status: 'pending', // Replaced invalid 'belum_jawab' with valid enum 'pending'
        assigned_by: currentUser?.id,
        assigned_date: new Date().toISOString()
      });

      await createAssignmentNotification(selectedCrewId, order);

      toast.success('Crew member assigned successfully');
      setSelectedCrewId('');
      loadAssignedCrew();
    } catch (err) {
      console.error('Failed to assign crew member:', err);
      const errorMsg = err?.message || 'Failed to assign crew member. Check permissions or valid fields.';
      toast.error(`Assignment failed: ${errorMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveCrew = async (assignmentId) => {
    if (window.confirm('Are you sure you want to remove this crew member from the event?')) {
      try {
        await crewAssignmentService.remove(assignmentId);
        toast.success('Crew member removed');
        loadAssignedCrew();
      } catch (err) {
        toast.error('Failed to remove crew member');
      }
    }
  };

  const handleUpdateFeeStatus = async (status) => {
    if (!designIncome) return;
    setUpdatingFee(true);
    try {
      await designIncomeService.update(designIncome.id, { status });
      toast.success(`Fee successfully marked as ${status}`);
      await loadDesignData();
    } catch (err) {
      toast.error('Failed to update fee status');
    } finally {
      setUpdatingFee(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground animate-pulse">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center p-8 bg-card rounded-2xl shadow-sm border border-border max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="font-bold text-lg mb-2">Error Loading Order</p>
          <p className="text-muted-foreground mb-6">We couldn't load the order details. Please try again.</p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => navigate('/orders')}>Go Back</Button>
            <Button onClick={loadOrderDetails}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-card rounded-2xl shadow-sm border border-border max-w-md w-full">
          <p className="text-muted-foreground font-medium text-lg">Order not found</p>
          <Button onClick={() => navigate('/orders')} className="mt-4" variant="outline">Return to Orders</Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      Pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      Confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      'In Progress': 'bg-purple-100 text-purple-800 border-purple-200',
      Completed: 'bg-green-100 text-green-800 border-green-200',
      Cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || colors.Pending;
  };

  const getAttendanceBadge = (status) => {
    switch(status) {
      case 'confirmed': return <Badge className="bg-blue-100 text-blue-800 border-blue-200 font-semibold shadow-sm">Confirmed</Badge>;
      case 'completed': return <Badge className="bg-green-100 text-green-800 border-green-200 font-semibold shadow-sm">Completed</Badge>;
      default: return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 font-semibold shadow-sm">Pending</Badge>;
    }
  };

  return (
    <>
      <Helmet>
        <title>{`Order ${order?.invoice_number || 'Details'} - Thenarsis`}</title>
      </Helmet>

      <div className="min-h-screen bg-muted/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" onClick={() => navigate('/orders')} className="mb-6 -ml-4 hover:bg-transparent">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-card border-b border-border pb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-2xl">{order.event_name || 'Event Name'}</CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-2">
                        Invoice: <span className="font-medium text-foreground">{order.invoice_number || 'N/A'}</span>
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className={`px-3 py-1 text-sm font-semibold shadow-sm ${getStatusColor(order.status || 'Pending')}`}>
                      {order.status || 'Pending'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x border-b">
                    <div className="p-6 space-y-4">
                      <div className="flex items-start gap-3">
                        <User className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Customer Details</p>
                          <p className="font-semibold text-lg">{order.customer_name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" /> {order.phone_number || '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 space-y-4 bg-muted/10">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Event Schedule</p>
                          <p className="font-semibold text-foreground">
                            {order.event_date ? format(new Date(order.event_date), 'EEEE, MMMM dd, yyyy') : 'Date not set'}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-start gap-1 mt-1">
                            <MapPin className="w-3 h-3 mt-0.5 shrink-0" /> 
                            <span className="line-clamp-2">{order.event_location || 'Location not set'}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="bg-muted/30 p-4 rounded-xl border">
                      <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Package Info</p>
                      <p className="font-medium text-lg">{order.product?.package_name || 'No Package Selected'}</p>
                    </div>
                  </div>

                  <div className="p-6 border-t bg-muted/10">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Overall Order Status</p>
                        <p className="text-xs text-muted-foreground">Change the status of the entire project here.</p>
                      </div>
                      <Select value={order.status || 'Pending'} onValueChange={handleStatusChange} disabled={submitting}>
                        <SelectTrigger className="w-full sm:w-48 bg-background">
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Confirmed">Confirmed</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Designer Assignment Card */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Designer Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {order.assigned_designer ? (
                    <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-xs text-primary font-semibold uppercase tracking-wider">Assigned Designer</p>
                        <p className="font-semibold text-foreground mt-1">{order.assigned_designer.name}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted p-4 rounded-xl border border-dashed text-center">
                      <p className="text-sm text-muted-foreground">No designer assigned</p>
                    </div>
                  )}
                  
                  <div className="pt-2">
                    <Label className="text-sm text-muted-foreground mb-2 block">Change/Select Designer</Label>
                    <div className="flex flex-col gap-3">
                      <Select value={selectedDesigner || 'unassigned'} onValueChange={setSelectedDesigner} disabled={submitting}>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select designer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned" className="text-muted-foreground italic">Unassigned (Remove)</SelectItem>
                          {designers.map((designer) => (
                            <SelectItem key={designer.id} value={designer.id}>
                              {designer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        onClick={handleAssignDesigner} 
                        className="w-full"
                        disabled={submitting || (selectedDesigner === (order.assigned_designer_id || 'unassigned'))}
                      >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (selectedDesigner === 'unassigned' ? 'Remove Designer' : 'Update Designer Assignment')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Designer Fee Card (Visible only if fee submitted) */}
              {designWork && designWork.design_fee > 0 && designIncome && (
                <Card className="border-0 shadow-md border-t-4 border-t-green-500">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Banknote className="w-5 h-5 text-green-600" />
                        Designer Fee
                      </span>
                      <Badge variant="outline" className={
                        (designIncome.status || 'pending') === 'paid' ? 'bg-green-100 text-green-800 border-green-200' :
                        (designIncome.status || 'pending') === 'approved' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        'bg-yellow-100 text-yellow-800 border-yellow-200'
                      }>
                        {(designIncome.status || 'pending').toUpperCase()}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-muted/30 rounded-xl border border-border">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-muted-foreground">Designer</span>
                        <span className="font-semibold">{designIncome.designer_name || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-muted-foreground">Submitted Amount</span>
                        <span className="font-semibold text-lg font-numeric text-foreground">
                          Rp {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(designIncome.fee_amount || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Date Submitted</span>
                        <span className="text-sm font-medium text-foreground">
                          {designWork.fee_submitted_date ? format(new Date(designWork.fee_submitted_date), 'MMM dd, yyyy') : 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <Button 
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 w-full"
                        onClick={() => handleUpdateFeeStatus('approved')}
                        disabled={updatingFee || designIncome.status === 'approved' || designIncome.status === 'paid'}
                      >
                        {updatingFee && designIncome.status !== 'approved' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                        Approve
                      </Button>
                      <Button 
                        className="bg-green-600 text-white hover:bg-green-700 w-full"
                        onClick={() => handleUpdateFeeStatus('paid')}
                        disabled={updatingFee || designIncome.status === 'paid'}
                      >
                        {updatingFee && designIncome.status !== 'paid' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Banknote className="w-4 h-4 mr-2" />}
                        Mark Paid
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Crew Assignment Card */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    Crew Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {assignedCrew.length > 0 ? (
                      assignedCrew.map((assignment) => {
                        const assigner = assignment.assigned_by_user;
                        const assignerName = assigner?.name || 'System';
                        const assignerEmail = assigner?.email || '';
                        // Avatar object URLs require an authenticated fetch; fall back to initials here.
                        const assignerAvatar = null;
                        const assignedDate = assignment.assigned_date || assignment.created_at;

                        return (
                          <div key={assignment.id} className="flex flex-col p-3 border rounded-xl bg-card hover:border-blue-200 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="text-sm font-semibold">{assignment.crew?.name || 'Unknown'}</p>
                                <div className="mt-1.5">
                                  {getAttendanceBadge(assignment.attendance_status)}
                                </div>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive/70 hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                                onClick={() => handleRemoveCrew(assignment.id)}
                                title="Remove crew member"
                                disabled={submitting}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="pt-3 border-t flex items-center gap-3">
                              <Avatar className="w-8 h-8 border">
                                <AvatarImage src={assignerAvatar} />
                                <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                                  {assignerName.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">Assigned by</span>
                                <span className="text-xs font-medium text-foreground">
                                  {assignerName} {assignerEmail && <span className="text-muted-foreground font-normal">({assignerEmail})</span>}
                                </span>
                                <span className="text-[10px] text-muted-foreground mt-0.5">
                                  {assignedDate ? format(new Date(assignedDate), 'MMM dd, yyyy HH:mm') : 'Unknown date'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="bg-muted p-4 rounded-xl border border-dashed text-center">
                        <p className="text-sm text-muted-foreground">No crew assigned yet</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-4 border-t space-y-3">
                    <Label className="text-sm text-muted-foreground block">Add Crew Member</Label>
                    <Select value={selectedCrewId || ''} onValueChange={setSelectedCrewId} disabled={submitting}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select crew member" />
                      </SelectTrigger>
                      <SelectContent>
                        {crew.map((member) => (
                          <SelectItem key={member.id} value={member.id} disabled={assignedCrew.some(a => a.crew_id === member.id)}>
                            {member.name} {assignedCrew.some(a => a.crew_id === member.id) ? '(Assigned)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleAssignCrew} 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                      disabled={submitting || !selectedCrewId}
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add to Event Crew'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderDetailPage;