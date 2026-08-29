'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, Leaf, Phone, Mail, Lock, User, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/providers/auth-provider';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [identifierType, setIdentifierType] = useState<'phone' | 'email'>('phone');

  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });

  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [id]: value,
    }));

    if (errors[id as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [id]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: { identifier?: string; password?: string } = {};

    if (!formData.identifier.trim()) {
      newErrors.identifier = `${identifierType === 'phone' ? 'Phone number' : 'Email'} is required`;
    }

    if (identifierType === 'phone') {
      const phoneRegex = /^(\+254|0)[0-9]{9}$/;
      if (formData.identifier && !phoneRegex.test(formData.identifier.replace(/\s/g, ''))) {
        newErrors.identifier = 'Enter a valid Kenyan phone number';
      }
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (formData.identifier && !emailRegex.test(formData.identifier)) {
        newErrors.identifier = 'Enter a valid email address';
      }
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    startTransition(async () => {
      try {
        let identifier = formData.identifier.trim();

        if (identifierType === 'phone') {
          identifier = identifier.replace(/\s/g, '');
          if (identifier.startsWith('0')) {
            identifier = '+254' + identifier.substring(1);
          }
        }

        await login(identifier, formData.password);

        toast.success('Welcome back 🌱', {
          description: 'Redirecting to dashboard...',
        });

        router.push('/dashboard');
      } catch (error: any) {
        if (error.response?.status === 401) {
          toast.error('Invalid phone/email or password');
          setErrors({ password: 'Invalid credentials' });
        } else if (error.response?.status === 403) {
          toast.error('Account locked. Try again later.');
        } else {
          toast.warning(error.response?.data?.message || 'Login failed');
        }
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted/30 via-background to-muted/20 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl group-hover:bg-primary/30 transition-all duration-500" />
              <Leaf className="relative w-9 h-9 text-primary group-hover:scale-110 transition-transform duration-300" />
            </div>
            <span className="text-2xl font-bold tracking-tight">
              Agro<span className="text-primary">Sense</span>
            </span>
          </Link>
          <p className="text-sm text-muted-foreground mt-2">
            Welcome back to smarter farming
          </p>
        </div>

        <Card className="relative overflow-hidden shadow-2xl border-muted/50">
          {/* Decorative top bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

          <CardHeader className="text-center pt-8 pb-4">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Sign in
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Use your phone or email to sign in
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Toggle */}
              <div className="flex gap-1 p-1 bg-muted/50 rounded-xl">
                {['phone', 'email'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setIdentifierType(type as any);
                      setFormData(prev => ({ ...prev, identifier: '' }));
                      setErrors(prev => ({ ...prev, identifier: undefined }));
                    }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      identifierType === type
                        ? 'bg-background text-primary shadow-sm shadow-primary/10'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {type === 'phone' ? (
                        <Phone className="h-4 w-4" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                      {type === 'phone' ? 'Phone' : 'Email'}
                    </span>
                  </button>
                ))}
              </div>

              {/* Identifier */}
              <div className="space-y-1.5">
                <Label htmlFor="identifier" className="text-sm font-medium">
                  {identifierType === 'phone' ? 'Phone Number' : 'Email Address'}
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60">
                    {identifierType === 'phone' ? (
                      <Phone className="h-4 w-4" />
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}
                  </div>
                  <Input
                    id="identifier"
                    type={identifierType === 'email' ? 'email' : 'text'}
                    placeholder={
                      identifierType === 'phone' 
                        ? '0712 345 678' 
                        : 'you@example.com'
                    }
                    className="pl-10 h-11"
                    value={formData.identifier}
                    onChange={handleChange}
                    disabled={isPending}
                  />
                </div>
                {errors.identifier && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <span className="inline-block h-1 w-1 rounded-full bg-destructive" />
                    {errors.identifier}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="pl-10 pr-12 h-11"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <span className="inline-block h-1 w-1 rounded-full bg-destructive" />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* ✨ Forgot Password Link - Added Here ✨ */}
              <div className="flex items-center justify-end">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 hover:underline underline-offset-4"
                >
                  Forgot password?
                </Link>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 text-base font-medium shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow duration-300"
                disabled={isPending}
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 border-t pt-6">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link 
                href="/signup" 
                className="text-primary font-medium hover:underline underline-offset-4 transition-colors"
              >
                Sign up
              </Link>
            </p>

            <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
              <Shield className="h-3 w-3" />
              <span>Your data is encrypted and secure</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}