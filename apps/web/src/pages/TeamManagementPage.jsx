import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';
import { Users, Plus, Pencil, Trash2, Shield, AlertCircle, Check, Copy } from 'lucide-react';
import { motion } from 'framer-motion';

const generateSecurePassword = () => {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const num = '0123456789';
  const symbol = '!@#$%^&*';
  
  // Guarantee at least one of each required type
  let password = 
    upper[Math.floor(Math.random() * upper.length)] +
    lower[Math.floor(Math.random() * lower.length)] +
    num[Math.floor(Math.random() * num.length)] +
    symbol[Math.floor(Math.random() * symbol.length)];
    
  // Fill the rest to reach 12 chars
  const allChars = upper + lower + num + symbol;
  for (let i = 0; i < 8; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle
  return password.split('').sort(() => 0.5 - Math.random()).join('');
};

const TeamManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');
  
  // For showing credentials after creation
  const [newMemberCredentials, setNewMemberCredentials] = useState(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'crew'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const records = await pb.collection('users').getFullList({
        sort: 'name',
        $autoCancel: false
      });
      setUsers(records);
    } catch (error) {
      toast.error('Failed to load team members. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (user = null) => {
    setEmailError(''); // Reset validation error
    if (user) {
      setSelectedUser(user);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'crew'
      });
    } else {
      setSelectedUser(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'crew'
      });
    }
    setFormOpen(true);
  };

  const handleEmailChange = (e) => {
    setFormData({ ...formData, email: e.target.value });
    if (emailError) setEmailError(''); // Clear error on type
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');

    const emailInput = formData.email.trim().toLowerCase();
    const isEmailChanged = !selectedUser || selectedUser.email !== emailInput;

    // 1. Validate email format if it changed or if it's a new user
    if (isEmailChanged) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailInput)) {
        setEmailError('Invalid email format');
        return;
      }
    }

    setSubmitting(true);

    try {
      // 2. Check if email already exists (only if changed)
      if (isEmailChanged) {
        const existingUsers = await pb.collection('users').getList(1, 1, {
          filter: `email="${emailInput}"`,
          $autoCancel: false
        });

        if (existingUsers.totalItems > 0) {
          setEmailError('This email is already in use by another account');
          setSubmitting(false);
          return;
        }
      }

      // 3. Prepare payload, definitively excluding email if unchanged
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        role: formData.role
      };

      if (isEmailChanged) {
        payload.email = emailInput;
      }

      // 4. Proceed with save/update
      if (selectedUser) {
        await pb.collection('users').update(selectedUser.id, payload, { $autoCancel: false });
        toast.success('Team member updated successfully');
        setFormOpen(false);
      } else {
        // Generate a secure password for new users
        const generatedPassword = generateSecurePassword();
        const createPayload = {
          ...payload,
          password: generatedPassword,
          passwordConfirm: generatedPassword
        };
        
        await pb.collection('users').create(createPayload, { $autoCancel: false });
        
        // Show credentials dialog instead of just closing
        setNewMemberCredentials({
          email: payload.email,
          password: generatedPassword,
          role: payload.role
        });
        toast.success('Team member added successfully.');
        setFormOpen(false);
      }
      
      loadUsers();
    } catch (error) {
      // 5. Handle API errors gracefully
      let errorMessage = 'An unexpected error occurred';
      
      if (error.data?.data?.email?.message) {
        errorMessage = error.data.data.email.message;
        setEmailError('Email validation failed. Please check the email format or try a different email.');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(`Failed to save team member: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this team member? This action cannot be undone.')) {
      try {
        await pb.collection('users').delete(id, { $autoCancel: false });
        toast.success('Team member removed');
        loadUsers();
      } catch (error) {
        toast.error('Failed to remove team member. They might be referenced in existing records.');
      }
    }
  };

  const copyCredentials = () => {
    if (newMemberCredentials) {
      const text = `Welcome to Thenarsis!\n\nLogin Email: ${newMemberCredentials.email}\nTemporary Password: ${newMemberCredentials.password}\nRole: ${newMemberCredentials.role}\n\nPlease login and change your password immediately.`;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Credentials copied to clipboard');
    }
  };

  const roleCounts = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});

  const getRoleBadge = (role) => {
    switch(role) {
      case 'owner': return <Badge className="bg-secondary text-secondary-foreground shadow-sm">Owner</Badge>;
      case 'designer': return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Designer</Badge>;
      case 'crew': return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Crew</Badge>;
      default: return <Badge variant="outline">{role}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Team Management - Thenarsis</title>
      </Helmet>

      <div className="min-h-screen bg-muted/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
              <p className="text-muted-foreground mt-1 text-balance">Manage staff, assign roles, and control access limits</p>
            </div>
            <Button onClick={() => handleOpenForm()} className="shadow-md transition-all active:scale-[0.98]">
              <Plus className="w-4 h-4 mr-2" /> Add Team Member
            </Button>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <Card className="border-0 shadow-md transition-transform hover:-translate-y-1 duration-300">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-4 bg-secondary text-secondary-foreground rounded-2xl">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Owners / Admins</p>
                  <p className="text-2xl font-bold font-numeric">{roleCounts['owner'] || 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md transition-transform hover:-translate-y-1 duration-300">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-4 bg-purple-100 text-purple-700 rounded-2xl">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Designers</p>
                  <p className="text-2xl font-bold font-numeric">{roleCounts['designer'] || 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md transition-transform hover:-translate-y-1 duration-300">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-4 bg-blue-100 text-blue-700 rounded-2xl">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Crew Members</p>
                  <p className="text-2xl font-bold font-numeric">{roleCounts['crew'] || 0}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-card border-b border-border pb-4">
              <CardTitle>All Team Members</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="pl-6 font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Phone</TableHead>
                    <TableHead className="font-semibold">Role</TableHead>
                    <TableHead className="text-right pr-6 font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="pl-6 font-medium text-foreground">{user.name}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell className="text-muted-foreground">{user.phone || '-'}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell className="text-right pr-6">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenForm(user)} aria-label="Edit user">
                          <Pencil className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                        </Button>
                        {user.id !== pb.authStore.model?.id && (
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)} aria-label="Delete user">
                            <Trash2 className="w-4 h-4 text-destructive/70 hover:text-destructive transition-colors" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Users className="w-12 h-12 mb-4 opacity-20" />
                          <p className="text-lg font-medium">No team members found</p>
                          <p className="text-sm">Click "Add Team Member" to get started.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedUser ? 'Edit Team Member' : 'Add New Team Member'}</DialogTitle>
            {!selectedUser && (
              <DialogDescription>
                A secure password will be generated automatically and shown to you after creation.
              </DialogDescription>
            )}
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="text-foreground"
                placeholder="e.g. Maya Chen"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className={emailError ? 'text-destructive' : ''}>
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email" 
                value={formData.email}
                onChange={handleEmailChange}
                required
                className={`text-foreground ${emailError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                placeholder="maya@thenarsis.com"
              />
              {emailError && (
                <div className="flex items-center gap-1.5 mt-1 text-sm text-destructive font-medium animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{emailError}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="text-foreground"
                placeholder="+62 812..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role <span className="text-destructive">*</span></Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger className="text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="designer">Designer</SelectItem>
                  <SelectItem value="crew">Crew</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end gap-3 pt-6">
              <Button type="button" variant="ghost" onClick={() => setFormOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="min-w-[120px] transition-all active:scale-[0.98]">
                {submitting ? 'Saving...' : (selectedUser ? 'Save Changes' : 'Create Member')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* New Member Credentials Dialog */}
      <Dialog open={!!newMemberCredentials} onOpenChange={(open) => !open && setNewMemberCredentials(null)}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <Check className="w-6 h-6" />
            </div>
            <DialogTitle className="text-center text-xl">Member Created Successfully!</DialogTitle>
            <DialogDescription className="text-center pt-2">
              Please securely share these login credentials with the new team member. They will not be shown again.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-muted p-4 rounded-lg mt-4 space-y-3 font-mono text-sm border">
            <div>
              <span className="text-muted-foreground">Email:</span>
              <div className="font-semibold text-foreground mt-1">{newMemberCredentials?.email}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Password:</span>
              <div className="font-semibold text-foreground mt-1 break-all bg-background p-2 rounded border mt-1">
                {newMemberCredentials?.password}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Role:</span>
              <div className="font-semibold text-foreground mt-1 capitalize">{newMemberCredentials?.role}</div>
            </div>
          </div>
          
          <DialogFooter className="mt-6 flex-col sm:flex-row gap-3 items-center">
            <Button 
              variant="outline" 
              className="w-full sm:w-auto" 
              onClick={() => setNewMemberCredentials(null)}
            >
              Close
            </Button>
            <Button 
              className="w-full sm:w-auto flex-1 gap-2" 
              onClick={copyCredentials}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied to Clipboard' : 'Copy Credentials'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TeamManagementPage;