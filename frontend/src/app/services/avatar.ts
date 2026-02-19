import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AvatarService {
  private prefix = 'hrms_avatar';
  private eventName = 'hrms-avatar-updated';

  private key(role: 'admin' | 'manager' | 'employee', email: string): string {
    return `${this.prefix}:${role}:${email.toLowerCase()}`;
  }

  get(role: 'admin' | 'manager' | 'employee', email: string): string | null {
    if (!email || typeof localStorage === 'undefined') return null;
    return localStorage.getItem(this.key(role, email));
  }

  set(role: 'admin' | 'manager' | 'employee', email: string, dataUrl: string): void {
    if (!email || typeof localStorage === 'undefined') return;
    localStorage.setItem(this.key(role, email), dataUrl);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(this.eventName, { detail: { role, email } }));
    }
  }

  clear(role: 'admin' | 'manager' | 'employee', email: string): void {
    if (!email || typeof localStorage === 'undefined') return;
    localStorage.removeItem(this.key(role, email));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(this.eventName, { detail: { role, email } }));
    }
  }
}
