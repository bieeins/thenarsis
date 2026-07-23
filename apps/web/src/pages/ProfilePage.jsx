import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { apiClient } from '@/lib/apiClient.js';
import { userService } from '@/services/userService.js';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { User, Mail, Phone, Lock, CalendarDays, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const ProfilePage = () => {
  const { currentUser } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [emailError, setEmailError] = useState('');

  const [profileData, setProfileData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || ''
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    password: '',
    passwordConfirm: ''
  });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setEmailError('');
    setIsUpdating(true);

    try {
      // Email changes aren't supported by the account API — only name/phone are editable.
      const payload = {
        name: profileData.name.trim(),
        phone: profileData.phone.trim()
      };

      await userService.update(currentUser.id, payload);

      setProfileData({
        ...profileData,
        name: payload.name,
        phone: payload.phone
      });

      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.password !== passwordData.passwordConfirm) {
      toast.error('New passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      await apiClient.post('/api/auth/change-password', {
        currentPassword: passwordData.oldPassword,
        newPassword: passwordData.password,
      });
      toast.success('Password changed successfully');
      setPasswordData({ oldPassword: '', password: '', passwordConfirm: '' });
    } catch (error) {
      toast.error(error.message || 'Failed to change password. Ensure your current password is correct.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Profile Settings - Thenarsis</title>
      </Helmet>

      <div className="min-h-screen bg-muted/30 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
            <p className="text-muted-foreground mt-1 text-balance">Manage your personal information, contact details, and security</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Sidebar info */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="md:col-span-1 space-y-6"
            >
              <Card className="border-0 shadow-md">
                <CardContent className="pt-6 flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-2xl bg-primary/20 text-primary flex items-center justify-center text-4xl font-bold mb-4 shadow-sm">
                    {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <h2 className="text-xl font-bold text-balance">{currentUser?.name}</h2>
                  <p className="text-muted-foreground capitalize mb-4 font-medium">{currentUser?.role}</p>
                  
                  <div className="w-full space-y-4 mt-2 pt-4 border-t text-sm">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Mail className="w-4 h-4 shrink-0" />
                      <span className="truncate">{currentUser?.email}</span>
                    </div>
                    {currentUser?.phone && (
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Phone className="w-4 h-4 shrink-0" />
                        <span>{currentUser?.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <CalendarDays className="w-4 h-4 shrink-0" />
                      <span>Joined {currentUser?.created_at ? format(new Date(currentUser.created_at), 'MMMM yyyy') : 'Recently'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Forms */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="md:col-span-2 space-y-6"
            >
              <Card className="border-0 shadow-md">
                <CardHeader className="bg-card border-b border-border pb-4">
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your contact details and display name</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleUpdateProfile} className="space-y-5">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
                      <Input 
                        id="name" 
                        value={profileData.name} 
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                        required
                        className="text-foreground"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email" className={emailError ? 'text-destructive' : ''}>
                        Email Address <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="text"
                        value={profileData.email}
                        readOnly
                        disabled
                        className="text-foreground opacity-70 cursor-not-allowed"
                      />
                      <p className="text-xs text-muted-foreground">Email address cannot be changed.</p>
                      {emailError && (
                        <div className="flex items-center gap-1.5 mt-1 text-sm text-destructive font-medium">
                          <AlertCircle className="w-4 h-4" />
                          <span>{emailError}</span>
                        </div>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input 
                        id="phone" 
                        type="tel" 
                        value={profileData.phone} 
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        className="text-foreground"
                      />
                    </div>
                    <div className="pt-2">
                      <Button type="submit" disabled={isUpdating} className="transition-all active:scale-[0.98]">
                        {isUpdating ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardHeader className="bg-card border-b border-border pb-4">
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Update your account password</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleChangePassword} className="space-y-5">
                    <div className="grid gap-2">
                      <Label htmlFor="oldPassword">Current Password</Label>
                      <Input 
                        id="oldPassword" 
                        type="password" 
                        value={passwordData.oldPassword} 
                        onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})}
                        required
                        className="text-foreground"
                      />
                    </div>
                    <Separator className="my-4" />
                    <div className="grid gap-2">
                      <Label htmlFor="password">New Password</Label>
                      <Input 
                        id="password" 
                        type="password" 
                        value={passwordData.password} 
                        onChange={(e) => setPasswordData({...passwordData, password: e.target.value})}
                        required
                        minLength={8}
                        className="text-foreground"
                      />
                      <p className="text-xs text-muted-foreground">Must be at least 8 characters long.</p>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="passwordConfirm">Confirm New Password</Label>
                      <Input 
                        id="passwordConfirm" 
                        type="password" 
                        value={passwordData.passwordConfirm} 
                        onChange={(e) => setPasswordData({...passwordData, passwordConfirm: e.target.value})}
                        required
                        minLength={8}
                        className="text-foreground"
                      />
                    </div>
                    <div className="pt-2">
                      <Button type="submit" variant="secondary" disabled={isChangingPassword || !passwordData.password} className="transition-all active:scale-[0.98]">
                        <Lock className="w-4 h-4 mr-2" />
                        {isChangingPassword ? 'Updating...' : 'Change Password'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;