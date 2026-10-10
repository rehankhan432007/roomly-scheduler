'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/core/auth/store';
import { Logo, Card, Input, Button, Divider, Tabs, cn } from '@/design-system';
import { toast } from 'sonner';
import { Building2, User } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email(),
  password: z.string().min(8, 'Must be at least 8 chars').regex(/[a-zA-Z]/, 'Must contain a letter').regex(/[0-9]/, 'Must contain a number'),
  company: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next');
  const defaultRole = (searchParams.get('role') as 'CLIENT' | 'OWNER') || 'CLIENT';
  
  const [role, setRole] = useState<'CLIENT' | 'OWNER'>(defaultRole);
  const registerAuth = useAuth((s) => s.register);
  const [loading, setLoading] = useState(false);

  const { register: registerForm, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      setLoading(true);
      await registerAuth({ ...data, role });
      toast.success('Account created successfully');
      if (nextUrl) {
        router.push(nextUrl);
      } else {
        router.push(role === 'CLIENT' ? '/client' : '/owner/dashboard');
      }
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4 py-12">
      <Link href="/" className="mb-8"><Logo size="lg" /></Link>
      
      <Card className="w-full max-w-[450px]">
        <div className="text-center mb-6">
          <h1 className="text-h2 font-semibold text-ink">Create an account</h1>
          <p className="text-small text-muted mt-1">Join MeetMaze today</p>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            type="button"
            onClick={() => setRole('CLIENT')}
            className={cn(
              'flex-1 p-3 rounded-control border text-center transition-all',
              role === 'CLIENT' ? 'border-primary bg-primary-50 ring-1 ring-primary' : 'border-line bg-surface hover:bg-canvas'
            )}
          >
            <User className={cn('w-6 h-6 mx-auto mb-2', role === 'CLIENT' ? 'text-primary' : 'text-muted')} />
            <div className="text-small font-semibold text-ink">I need rooms</div>
            <div className="text-caption text-muted">Client Portal</div>
          </button>
          <button
            type="button"
            onClick={() => setRole('OWNER')}
            className={cn(
              'flex-1 p-3 rounded-control border text-center transition-all',
              role === 'OWNER' ? 'border-primary bg-primary-50 ring-1 ring-primary' : 'border-line bg-surface hover:bg-canvas'
            )}
          >
            <Building2 className={cn('w-6 h-6 mx-auto mb-2', role === 'OWNER' ? 'text-primary' : 'text-muted')} />
            <div className="text-small font-semibold text-ink">I own rooms</div>
            <div className="text-caption text-muted">Owner Portal</div>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Jane Doe"
            error={errors.name?.message}
            {...registerForm('name')}
          />
          <Input
            label="Email"
            type="email"
            placeholder="jane@example.com"
            error={errors.email?.message}
            {...registerForm('email')}
          />
          <Input
            label="Password"
            type="password"
            hint="Min 8 chars, 1 letter, 1 number"
            error={errors.password?.message}
            {...registerForm('password')}
          />
          {role === 'OWNER' && (
            <Input
              label="Company Name (Optional)"
              placeholder="Acme Corp"
              error={errors.company?.message}
              {...registerForm('company')}
            />
          )}
          <Button type="submit" fullWidth loading={loading} className="mt-4">
            Create account
          </Button>
        </form>

        <Divider />
        
        <p className="text-center text-small text-muted">
          Already have an account?{' '}
          <Link href={`/login${nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : ''}`} className="text-primary hover:underline font-medium">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}
