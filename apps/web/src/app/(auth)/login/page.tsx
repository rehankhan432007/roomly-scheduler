'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/core/auth/store';
import { Logo, Card, Input, Button, Divider } from '@/design-system';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next');
  const login = useAuth((s) => s.login);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setLoading(true);
      const user = await login(data.email, data.password);
      toast.success('Welcome back!');
      if (nextUrl) {
        router.push(nextUrl);
      } else {
        router.push(user.role === 'CLIENT' ? '/client' : '/owner/dashboard');
      }
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
      <Link href="/" className="mb-8"><Logo size="lg" /></Link>
      
      <Card className="w-full max-w-[400px]">
        <div className="text-center mb-6">
          <h1 className="text-h2 font-semibold text-ink">Welcome back</h1>
          <p className="text-small text-muted mt-1">Sign in to your MeetMaze account</p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-3 bg-primary-50 rounded-control border border-primary-100 text-small">
            <p className="font-semibold text-primary-700 mb-1">Demo accounts:</p>
            <ul className="text-primary-700 space-y-1">
              <li>Owner: <code>owner@meetmaze.dev</code></li>
              <li>Client: <code>client@meetmaze.dev</code></li>
              <li className="text-muted mt-2 border-t border-primary-100 pt-1">Password: <code>Demo@1234</code></li>
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="name@example.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Password"
            type="password"
            error={errors.password?.message}
            {...register('password')}
          />
          <Button type="submit" fullWidth loading={loading} className="mt-2">
            Sign in
          </Button>
        </form>

        <Divider />
        
        <p className="text-center text-small text-muted">
          Don't have an account?{' '}
          <Link href={`/register${nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : ''}`} className="text-primary hover:underline font-medium">
            Register
          </Link>
        </p>
      </Card>
    </div>
  );
}
