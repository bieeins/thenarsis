import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const user = await login(formData.email, formData.password);
      toast.success('Login successful');
      
      // Check if there's a redirect target stored in location state
      const from = location.state?.from?.pathname;
      
      if (from && from !== '/' && from !== '/login') {
        navigate(from, { replace: true });
      } else {
        // Role-based routing
        if (user.role === 'owner') {
          navigate('/owner-dashboard', { replace: true });
        } else if (user.role === 'designer') {
          navigate('/designer-dashboard', { replace: true });
        } else if (user.role === 'crew') {
          navigate('/crew-dashboard', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }
    } catch (error) {
      setErrorMsg(error.message || 'Authentication failed. Please check your credentials.');
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Login - Thenarsis Management System</title>
        <meta name="description" content="Login to access your Thenarsis account" />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-muted/40 py-12 px-4 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md relative z-10"
        >
          <Card className="border-0 shadow-xl overflow-hidden">
            <div className="h-2 w-full bg-primary" />
            <CardHeader className="text-center pt-8 pb-6">
              <div className="flex justify-center mb-6">
                <div className="w-14 h-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-md rotate-3 transition-transform hover:rotate-6">
                  <span className="font-bold text-3xl">T</span>
                </div>
              </div>
              <CardTitle className="text-3xl font-bold tracking-tight text-balance">Welcome back</CardTitle>
              <CardDescription className="text-base mt-2">
                Sign in to your Thenarsis workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                {errorMsg && (
                  <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 rounded-md border border-destructive/20 text-center">
                    {errorMsg}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="h-11 text-foreground transition-all focus-visible:ring-primary"
                    placeholder="name@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="h-11 pr-10 text-foreground transition-all focus-visible:ring-primary"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-medium shadow-md transition-all active:scale-[0.98]" 
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Authenticating...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default LoginPage;