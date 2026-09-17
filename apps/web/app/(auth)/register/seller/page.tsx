import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDashboardForRole } from '@/lib/auth/redirects';

export default async function SellerRegistrationRedirectPage() {
  const store = await cookies();
  const userRole = store.get('userRole')?.value ?? '';
  const hasSession = !!store.get('accessToken')?.value;

  if (!hasSession) {
    redirect('/register');
  }

  if (userRole === 'SELLER' || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'MANAGER') {
    redirect(getDashboardForRole(userRole));
  }

  redirect('/register/vendor-onboarding');
}