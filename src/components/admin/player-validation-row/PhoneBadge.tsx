'use client';

import { Phone } from 'lucide-react';

export function PhoneBadge({ phone }: { phone: string }) {
  return (
    <span className="flex items-center gap-1 text-xs text-ink-2/80">
      <Phone className="h-3 w-3 shrink-0" />
      {phone}
    </span>
  );
}
