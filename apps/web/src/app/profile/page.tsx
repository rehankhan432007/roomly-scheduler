'use client';

import { useState } from 'react';
import { useAuth } from '@/core/auth/store';
import { PortalShell } from '@/core/PortalShell';
import { PageHeader, Card, Input, Button, Divider } from '@/design-system';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { api } from '@/core/api/client';
import { useRouter } from 'next/navigation';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  company: z.string().optional(),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string().min(8, 'Min 8 chars').regex(/[a-zA-Z]/, 'Need a letter').regex(/[0-9]/, 'Need a number'),
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user, updateProfile, status } = useAuth();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const router = useRouter();

  const { register: regProfile, handleSubmit: submitProfile, formState: { errors: profileErr } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      company: user?.company || '',
      phone: user?.phone || '',
    },
  });

  const { register: regPwd, handleSubmit: submitPwd, reset: resetPwd, formState: { errors: pwdErr } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  if (status === 'loading' || !user) return null; // handled by layout

  const onUpdateProfile = async (data: ProfileForm) => {
    try {
      setProfileLoading(true);
      await updateProfile(data);
      toast.success('Profile updated');
    } catch (err: any) {
      toast.error(err.message || 'Update failed');
    } finally {
      setProfileLoading(false);
    }
  };

  const onChangePassword = async (data: PasswordForm) => {
    try {
      setPasswordLoading(true);
      await api.post('/users/me/password', data);
      toast.success('Password changed');
      resetPwd();
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <PortalShell role={user.role}>
      <PageHeader title="Profile" description="Manage your account settings" />
      
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <Card title="Personal Information">
          <form onSubmit={submitProfile(onUpdateProfile)} className="space-y-4">
            <Input label="Email" value={user.email} disabled hint="Email cannot be changed" />
            <Input label="Role" value={user.role} disabled />
            <Input label="Full Name" error={profileErr.name?.message} {...regProfile('name')} />
            <Input label="Company" error={profileErr.company?.message} {...regProfile('company')} />
            <Input label="Phone" error={profileErr.phone?.message} {...regProfile('phone')} />
            <div className="flex justify-end pt-2">
              <Button type="submit" loading={profileLoading}>Save Changes</Button>
            </div>
          </form>
        </Card>

        <Card title="Change Password">
          <form onSubmit={submitPwd(onChangePassword)} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              error={pwdErr.currentPassword?.message}
              {...regPwd('currentPassword')}
            />
            <Input
              label="New Password"
              type="password"
              hint="Min 8 chars, 1 letter, 1 number"
              error={pwdErr.newPassword?.message}
              {...regPwd('newPassword')}
            />
            <div className="flex justify-end pt-2">
              <Button type="submit" variant="secondary" loading={passwordLoading}>Update Password</Button>
            </div>
          </form>
        </Card>
      </div>
    </PortalShell>
  );
}
