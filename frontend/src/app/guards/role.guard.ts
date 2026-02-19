import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export function roleGuard(allowed: Array<'admin' | 'manager' | 'employee'>): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const role = auth.getRole();

    if (role && allowed.includes(role)) return true;

    if (role === 'admin') return router.createUrlTree(['/admin-dashboard']);
    if (role === 'manager') return router.createUrlTree(['/manager-dashboard']);
    if (role === 'employee') return router.createUrlTree(['/dashboard']);
    return router.createUrlTree(['/login']);
  };
}
