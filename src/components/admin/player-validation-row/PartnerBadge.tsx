'use client';

import { Phone } from 'lucide-react';
import type { Player } from '../../../lib/types';

export function PartnerBadge({ player }: { player: Player }) {
  if (player.mode !== 'doubles' || !player.partner) return null;

  const partner = player.partner;

  return (
    <div className="mt-2.5 rounded-lg border border-indigo-200/60 bg-indigo-50/50 px-3 py-2">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
        პარტნიორი
      </p>
      <span className="text-sm font-semibold text-ink">
        {partner.firstName} {partner.lastName}
      </span>
      {partner.phone && (
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-2">
          <Phone className="h-3 w-3 shrink-0" />
          <span>{partner.phone}</span>
        </div>
      )}
    </div>
  );
}
