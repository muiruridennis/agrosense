'use client';

import { useState, useActionState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { registerSchema } from '@/lib/validations/auth';

const cleanPhoneNumber = (phone: string): string => {
  // Remove all spaces, dashes, parentheses, and dots
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  
  // If starts with '0', replace with '+254'
  if (cleaned.startsWith('0')) {
    cleaned = '+254' + cleaned.substring(1);
  }
  
  // If starts with '254' without '+', add '+'
  if (cleaned.startsWith('254') && !cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  // If doesn't start with '+', add '+'
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
};

type State = {
  errors?: Record<string, string>;
  success?: boolean;
  general?: string;
};

export default function SignUpPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const [state, formAction] = useActionState<State, FormData>(
    async (prevState: State, formData: FormData) => {
      const rawPhone = formData.get('phone') as string;
      
      // ✅ Clean phone number before validation
      const cleanedPhone = cleanPhoneNumber(rawPhone);
      
      const rawData = {
        fullName: formData.get('fullName') as string,
        email: formData.get('email') as string,
        phone: cleanedPhone, // ✅ Use cleaned phone number
        password: formData.get('password') as string,
        confirmPassword: formData.get('confirmPassword') as string,
      };

      // Update local state with cleaned phone number for display
      setFormData(prev => ({ 
        ...prev, 
        phone: cleanedPhone,
        fullName: rawData.fullName,
        email: rawData.email,
      }));

      // ✅ Validate with Zod (using cleaned phone)
      const result = registerSchema.safeParse(rawData);

      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.issues.forEach(issue => {
          const field = issue.path[0] as string;
          fieldErrors[field] = issue.message;
        });
        
        return { errors: fieldErrors };
      }

      try {
        await apiClient.post('/auth/register', {
          fullName: rawData.fullName,
          email: rawData.email,
          phoneNumber: rawData.phone, 
          password: rawData.password,
        });

        toast.success('Account created successfully!');
        
        startTransition(() => {
          router.push('/login');
        });
        
        return { success: true };
      } catch (error: any) {
        return {
          general: error.response?.data?.message || 'Failed to create account. Try again.',
        };
      }
    },
    { errors: {} }
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      await formAction(formData);
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-muted/30">
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
            Start your 14-day free trial
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Create your account
            </CardTitle>
            <CardDescription className="text-center">
              Join farmers already using AgroSense
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} action={formAction} className="space-y-4">
              {/* Full Name */}
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="John Mwangi"
                  disabled={isPending}
                />
                {state.errors?.fullName && (
                  <p className="text-sm text-destructive mt-1">
                    {state.errors.fullName}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="farmer@example.com"
                  disabled={isPending}
                />
                {state.errors?.email && (
                  <p className="text-sm text-destructive mt-1">
                    {state.errors.email}
                  </p>
                )}
              </div>

              {/* Phone - with formatting hint */}
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="072200000000 or +2720000"
                  disabled={isPending}
                />
              
                {state.errors?.phone && (
                  <p className="text-sm text-destructive mt-1">
                    {state.errors.phone}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {state.errors?.password && (
                  <p className="text-sm text-destructive mt-1">
                    {state.errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {state.errors?.confirmPassword && (
                  <p className="text-sm text-destructive mt-1">
                    {state.errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* General Error */}
              {state.general && (
                <p className="text-sm text-destructive text-center">
                  {state.general}
                </p>
              )}

              {/* Submit Button */}
              <Button type="submit" className="w-full gap-2" disabled={isPending}>
                {isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Start Free Trial
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center border-t pt-6">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}