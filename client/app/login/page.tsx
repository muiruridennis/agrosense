'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, Leaf, Phone, Mail } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Leaf className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold">
              Agro<span className="text-primary">Sense</span>
            </span>
          </Link>
          <p className="text-sm text-muted-foreground mt-2">
            Welcome back to smarter farming
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl">Sign in</CardTitle>
            <CardDescription className="text-center">
              Use phone or email
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Toggle */}
              <div className="flex gap-2 p-1 bg-muted rounded-lg">
                {['phone', 'email'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setIdentifierType(type as any);
                      setFormData(prev => ({ ...prev, identifier: '' }));
                    }}
                    className={`flex-1 py-2 rounded-md ${
                      identifierType === type
                        ? 'bg-card text-primary shadow'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {type === 'phone' ? 'Phone' : 'Email'}
                  </button>
                ))}
              </div>

              {/* Identifier */}
              <div>
                <Label htmlFor="identifier">
                  {identifierType === 'phone' ? 'Phone' : 'Email'}
                </Label>
                <Input
                  id="identifier"
                  value={formData.identifier}
                  onChange={handleChange}
                  disabled={isPending}
                />
                {errors.identifier && (
                  <p className="text-xs text-destructive">{errors.identifier}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? 'Signing in...' : 'Sign In'}
                {!isPending && <ArrowRight className="ml-2 w-4 h-4" />}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center">
            <p className="text-sm">
              No account?{' '}
              <Link href="/signup" className="text-primary">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}