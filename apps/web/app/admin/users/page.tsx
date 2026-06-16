'use client';

import { DashboardPageHeader, StatusBadge, TableSkeleton } from '@/components/dashboard';
import { useUsers } from '@/hooks';
import { User, AlertCircle } from 'lucide-react';
import type { User as UserType } from '@/lib/api/types';

export default function AdminUsersPage() {
  const { data, isLoading, error } = useUsers();
  const users = data?.data ?? [];

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Users" description="Manage platform users" />
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="mt-4 text-lg font-medium text-text-primary dark:text-dark-text-primary">Failed to load users</p>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">{error.message}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Users" description="Manage platform users" />
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Users"
        description="Manage platform users"
      />

      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
          <User className="h-12 w-12 text-text-tertiary" />
          <p className="mt-4 text-lg font-medium text-text-primary dark:text-dark-text-primary">No users found</p>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">Users will appear here once they register on the platform.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface dark:bg-dark-surface dark:border-dark-border">
          <div className="hidden grid-cols-12 gap-4 border-b border-border px-6 py-3 text-xs font-medium uppercase text-text-secondary dark:border-dark-border dark:text-dark-text-secondary sm:grid">
            <div className="col-span-3">User</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Joined</div>
            <div className="col-span-2">Status</div>
          </div>
          {users.map((user: UserType) => (
            <div
              key={user.id}
              className="grid grid-cols-1 gap-3 border-b border-border px-6 py-4 last:border-0 sm:grid-cols-12 sm:items-center dark:border-dark-border"
            >
              <div className="flex items-center gap-3 sm:col-span-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                  <User className="h-4 w-4" />
                </div>
                <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{user.name}</p>
              </div>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary sm:col-span-3">{user.email}</p>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary sm:col-span-2">{user.role}</p>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary sm:col-span-2">{new Date(user.createdAt).toLocaleDateString('en-IN')}</p>
              <div className="sm:col-span-2">
                <StatusBadge status={user.isVerified ? 'verified' : 'pending'} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
