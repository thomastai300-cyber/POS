import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Lock, User, Loader2, Phone, MapPin, ArrowLeft, Shield } from 'lucide-react';
import logoImg from '@/assets/logo.png';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  businessName: z.string().min(2, 'Business name is required'),
  businessPhone: z.string().optional(),
  businessAddress: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ 
    fullName: '', email: '', password: '', confirmPassword: '',
    businessName: '', businessPhone: '', businessAddress: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast({ title: 'Error', description: 'Please enter your email.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Check your email', description: 'A password reset link has been sent.' });
      setShowForgotPassword(false);
    }
  };

  if (user) {
    navigate('/');
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = loginSchema.safeParse(loginData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setIsLoading(true);
    const { error } = await signIn(loginData.email, loginData.password);
    setIsLoading(false);
    if (error) {
      toast({ title: 'Login Failed', description: error.message || 'Invalid email or password', variant: 'destructive' });
    } else {
      toast({ title: 'Welcome back!', description: 'You have been logged in.' });
      navigate('/');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = signupSchema.safeParse(signupData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setIsLoading(true);
    const { error } = await signUp(signupData.email, signupData.password, signupData.fullName, {
      businessName: signupData.businessName,
      businessPhone: signupData.businessPhone,
      businessAddress: signupData.businessAddress,
    });
    setIsLoading(false);
    if (error) {
      if (error.message.includes('already registered')) {
        toast({ title: 'Account Exists', description: 'This email is already registered. Please log in instead.', variant: 'destructive' });
      } else {
        toast({ title: 'Signup Failed', description: error.message, variant: 'destructive' });
      }
    } else {
      toast({ title: 'Account Created!', description: 'Your business registration is pending approval.' });
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-primary-foreground">
          <div className="flex items-center gap-3 mb-8">
            <img src={logoImg} alt="Ringo POS" className="h-16 w-auto" />
          </div>
          <h2 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
            Streamline your<br />business operations
          </h2>
          <p className="text-lg text-primary-foreground/80 leading-relaxed max-w-md">
            Complete point-of-sale, inventory management, customer loyalty, and accounting — all in one powerful platform.
          </p>
          <div className="mt-12 space-y-4">
            {['Multi-location inventory tracking', 'Real-time sales analytics', 'Customer loyalty programs', 'M-Pesa & cash payments'].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <Shield className="w-3 h-3" />
                </div>
                <span className="text-primary-foreground/90">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Auth Forms */}
      <div className="flex-1 flex items-center justify-center bg-background p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img src={logoImg} alt="Ringo POS" className="h-12 w-auto" />
          </div>

          {showForgotPassword ? (
            <Card className="p-8 shadow-card border-border/50">
              <button onClick={() => setShowForgotPassword(false)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to login
              </button>
              <h2 className="text-2xl font-bold text-foreground mb-2">Reset Password</h2>
              <p className="text-muted-foreground text-sm mb-6">Enter your email and we'll send a reset link.</p>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="email" placeholder="you@company.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="pl-10 h-11" />
                </div>
                <Button type="submit" className="w-full h-11 gradient-primary font-semibold" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Send Reset Link
                </Button>
              </form>
            </Card>
          ) : (
            <Card className="p-8 shadow-card border-border/50">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground">Welcome</h2>
                <p className="text-muted-foreground text-sm mt-1">Sign in to your account or register your business</p>
              </div>

              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 h-11">
                  <TabsTrigger value="login" className="font-medium">Sign In</TabsTrigger>
                  <TabsTrigger value="signup" className="font-medium">Register</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="login-email" className="text-sm font-medium">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="login-email" type="email" placeholder="you@company.com" value={loginData.email} onChange={(e) => setLoginData(d => ({ ...d, email: e.target.value }))} className="pl-10 h-11" />
                      </div>
                      {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="login-password" type="password" placeholder="••••••••" value={loginData.password} onChange={(e) => setLoginData(d => ({ ...d, password: e.target.value }))} className="pl-10 h-11" />
                      </div>
                      {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                    </div>
                    <Button type="submit" className="w-full h-11 gradient-primary font-semibold" disabled={isLoading}>
                      {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Sign In
                    </Button>
                    <button type="button" onClick={() => setShowForgotPassword(true)} className="w-full text-sm text-primary hover:underline">
                      Forgot your password?
                    </button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-3">
                    <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 border border-border/50">
                      <Shield className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                      New businesses require approval before they can operate.
                    </p>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input type="text" placeholder="John Doe" value={signupData.fullName} onChange={(e) => setSignupData(d => ({ ...d, fullName: e.target.value }))} className="pl-10 h-11" />
                      </div>
                      {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Business Name</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input type="text" placeholder="Acme Retail Ltd" value={signupData.businessName} onChange={(e) => setSignupData(d => ({ ...d, businessName: e.target.value }))} className="pl-10 h-11" />
                      </div>
                      {errors.businessName && <p className="text-xs text-destructive">{errors.businessName}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input type="email" placeholder="you@company.com" value={signupData.email} onChange={(e) => setSignupData(d => ({ ...d, email: e.target.value }))} className="pl-10 h-11" />
                        </div>
                        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">Phone</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input type="tel" placeholder="0712345678" value={signupData.businessPhone} onChange={(e) => setSignupData(d => ({ ...d, businessPhone: e.target.value }))} className="pl-10 h-11" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Business Address</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input type="text" placeholder="Nairobi, Kenya" value={signupData.businessAddress} onChange={(e) => setSignupData(d => ({ ...d, businessAddress: e.target.value }))} className="pl-10 h-11" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input type="password" placeholder="••••••••" value={signupData.password} onChange={(e) => setSignupData(d => ({ ...d, password: e.target.value }))} className="pl-10 h-11" />
                        </div>
                        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">Confirm</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input type="password" placeholder="••••••••" value={signupData.confirmPassword} onChange={(e) => setSignupData(d => ({ ...d, confirmPassword: e.target.value }))} className="pl-10 h-11" />
                        </div>
                        {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                      </div>
                    </div>

                    <Button type="submit" className="w-full h-11 gradient-primary font-semibold" disabled={isLoading}>
                      {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Register Business
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </Card>
          )}

          <p className="text-center text-xs text-muted-foreground mt-6">
            &copy; {new Date().getFullYear()} Ringo POS. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
