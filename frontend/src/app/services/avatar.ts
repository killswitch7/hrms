import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AvatarService {
  private prefix = 'hrms_avatar';

  private key(role: 'admin' | 'employee', email: string): string {
    return `${this.prefix}:${role}:${email.toLowerCase()}`;
  }

  get(role: 'admin' | 'employee', email: string): string | null {
    if (!email) return null;
    return localStorage.getItem(this.key(role, email));
  }

  set(role: 'admin' | 'employee', email: string, dataUrl: string): void {
    if (!email) return;
    localStorage.setItem(this.key(role, email), dataUrl);
  }

  clear(role: 'admin' | 'employee', email: string): void {
    if (!email) return;
    localStorage.removeItem(this.key(role, email));
  }
}
