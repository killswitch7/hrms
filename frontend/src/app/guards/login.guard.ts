import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const loginGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return true; // allow /login
  }

  const role = auth.getRole();

  if (role === 'admin') {
    return router.createUrlTree(['/admin-dashboard']);
  }

  return router.createUrlTree(['/dashboard']);
};
