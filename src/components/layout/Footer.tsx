import schoolLogo from '@/assets/college-rebero-logo.png';
import { MapPin, Phone, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-8 border-t border-border bg-card/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-start gap-3">
            <img src={schoolLogo} alt="College De Rebero" className="h-10 w-10 object-contain" />
            <div>
              <p className="font-semibold text-foreground">College De Rebero</p>
              <p className="text-xs text-muted-foreground">Behavior Management System</p>
            </div>
          </div>
          <div className="space-y-1.5 text-sm text-muted-foreground">
            <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Rebero, Kicukiro, Kigali, Rwanda</p>
            <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> +250 788 000 000</p>
            <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> info@collegederebero.rw</p>
          </div>
          <div className="text-sm text-muted-foreground sm:text-right">
            <p>© {new Date().getFullYear()} College De Rebero. All rights reserved.</p>
            <p className="mt-1 text-xs">Excellence · Discipline · Integrity</p>
          </div>
        </div>
      </div>
    </footer>
  );
}