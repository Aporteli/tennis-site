'use client';

import { useRef, useState } from 'react';
import { X, UserPlus, CheckCircle2 } from 'lucide-react';
import type { Mode } from '../lib/types';

interface RegisterModalProps {
  isOpen: boolean;
  mode: Mode;
  onClose: () => void;
  onSuccess?: () => void;
}

/** Honeypot field names — common targets bots look for. */
const HONEYPOT_NAMES = ['website', 'url', 'company', 'email2', 'fax', 'address', 'username'] as const;

type HoneypotKey = (typeof HONEYPOT_NAMES)[number];

const emptyHoneypots = (): Record<HoneypotKey, string> =>
  HONEYPOT_NAMES.reduce((acc, k) => ({ ...acc, [k]: '' }), {} as Record<HoneypotKey, string>);

const MIN_FILL_TIME_MS = 2000;

export default function RegisterModal({ isOpen, mode, onClose, onSuccess }: RegisterModalProps) {
  const [matchType, setMatchType] = useState<Mode>(mode);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [partnerFirstName, setPartnerFirstName] = useState('');
  const [partnerLastName, setPartnerLastName] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // ── Honeypot state ────────────────────────────────────────────────
  const [honeypots, setHoneypots] = useState<Record<HoneypotKey, string>>(emptyHoneypots);
  const openedAtRef = useRef<number>(Date.now());

  if (!isOpen) return null;

  const phoneDigitsRegex = /^\d{9}$/;

  /** True if any honeypot fired or the form was filled impossibly fast. */
  const looksLikeBot = (): boolean => {
    for (const name of HONEYPOT_NAMES) {
      if (honeypots[name].trim() !== '') return true;
    }
    if (Date.now() - openedAtRef.current < MIN_FILL_TIME_MS) return true;
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Bot detected → pretend success, never hit the API.
    if (looksLikeBot()) {
      setSubmitted(true);
      return;
    }

    if (!firstName.trim() || !lastName.trim() || !phoneDigitsRegex.test(phone.trim())) {
      setError('გთხოვთ შეავსოთ სახელი, გვარი და ტელეფონის ნომერი');
      return;
    }
    if (
      matchType === 'doubles' &&
      (!partnerFirstName.trim() || !partnerLastName.trim() || !phoneDigitsRegex.test(partnerPhone.trim()))
    ) {
      setError('გთხოვთ შეავსოთ პარტნიორის სახელი, გვარი და ტელეფონის ნომერი');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || null,
        mode: matchType,
        partner:
          matchType === 'doubles'
            ? {
                firstName: partnerFirstName.trim(),
                lastName: partnerLastName.trim(),
                phone: partnerPhone.trim() || null,
              }
            : null,
        // ── anti-bot signals ──
        openedAt: openedAtRef.current,
        ...honeypots,
      };

      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(`სერვერმა დააბრუნა არასწორი პასუხი (HTTP ${res.status})`);
      }

      if (!res.ok) {
        throw new Error(data.error || `რეგისტრაცია ვერ მოხერხდა (HTTP ${res.status})`);
      }

      setSubmitted(true);
      setFirstName('');
      setLastName('');
      setPhone('');
      setPartnerFirstName('');
      setPartnerLastName('');
      setPartnerPhone('');
      onSuccess?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'დაფიქსირდა შეცდომა';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setError(null);
    setMatchType(mode);
    setHoneypots(emptyHoneypots());
    openedAtRef.current = Date.now(); // reset timer for next open
    onClose();
  };

  const inputClass =
    'w-full rounded-xl border border-line bg-card pl-3 pr-3 py-2.5 text-sm text-ink placeholder:text-ink-3 outline-none focus:border-accent-2 focus:ring-1 focus:ring-accent-2 transition';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-line bg-panel p-6 sm:p-8 shadow-2xl">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-ink-3 hover:text-ink hover:bg-overlay transition cursor-pointer">
          <X className="h-5 w-5" />
        </button>

        {submitted ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-win/10 text-win border border-win/20">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="text-2xl font-bold text-ink tracking-tight">განაცხადი მიღებულია!</h3>
            <p className="text-sm text-ink-2 leading-relaxed max-w-xs mx-auto">
              თქვენი მონაცემები წარმატებით დარეგისტრირდა. ადმინისტრატორის დადასტურების შემდეგ გამოჩნდებით სიაში.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="w-full mt-2 rounded-xl bg-win hover:opacity-90 px-4 py-3 text-sm font-bold text-inverse shadow-lg transition cursor-pointer active:scale-[0.98]">
              დახურვა
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off" noValidate={false}>
            {/* ═══════════════════════════════════════════════════════
                HONEYPOT LAYER 1 — display:none fields
                Naive bots fill every <input> they see.
            ═══════════════════════════════════════════════════════ */}
            <div aria-hidden="true" style={{ display: 'none' }}>
              <label>
                Website
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypots.website}
                  onChange={(e) => setHoneypots((h) => ({ ...h, website: e.target.value }))}
                />
              </label>
              <label>
                Company
                <input
                  type="text"
                  name="company"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypots.company}
                  onChange={(e) => setHoneypots((h) => ({ ...h, company: e.target.value }))}
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  name="email2"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypots.email2}
                  onChange={(e) => setHoneypots((h) => ({ ...h, email2: e.target.value }))}
                />
              </label>
              <label>
                Username
                <input
                  type="text"
                  name="username"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypots.username}
                  onChange={(e) => setHoneypots((h) => ({ ...h, username: e.target.value }))}
                />
              </label>
            </div>

            {/* ═══════════════════════════════════════════════════════
                HONEYPOT LAYER 2 — off-screen fields
                Smarter bots skip display:none but still fill
                inputs they can "see" in the DOM.
            ═══════════════════════════════════════════════════════ */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: '-9999px',
                top: 'auto',
                width: '1px',
                height: '1px',
                overflow: 'hidden',
              }}>
              <label>
                Fax number
                <input
                  type="text"
                  name="fax"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypots.fax}
                  onChange={(e) => setHoneypots((h) => ({ ...h, fax: e.target.value }))}
                />
              </label>
              <label>
                Home address
                <input
                  type="text"
                  name="address"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypots.address}
                  onChange={(e) => setHoneypots((h) => ({ ...h, address: e.target.value }))}
                />
              </label>
              <label>
                Personal URL
                <input
                  type="url"
                  name="url"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypots.url}
                  onChange={(e) => setHoneypots((h) => ({ ...h, url: e.target.value }))}
                />
              </label>
            </div>

            {/* ═══════════════════════════════════════════════════════
                HONEYPOT LAYER 3 — timing trap
                A hidden timestamp written on mount. If the form
                submits within MIN_FILL_TIME_MS, it's automated.
                (Handled via openedAtRef — no DOM field needed.)
            ═══════════════════════════════════════════════════════ */}

            {/* ── Header ── */}
            <div className="flex items-center gap-3.5 pb-3 border-b border-line">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-2/10 text-accent-2 border border-accent-2/20 shrink-0">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-ink tracking-tight">ტურნირზე რეგისტრაცია</h3>
                <p className="text-xs text-ink-2 mt-0.5"></p>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-danger/30 bg-danger/10 p-3.5 text-xs font-medium text-danger">
                {error}
              </div>
            )}

            {/* ── Mode toggle ── */}
            <div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMatchType('singles')}
                  className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition cursor-pointer ${
                    matchType === 'singles'
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-line bg-card text-ink-2 hover:bg-overlay'
                  }`}>
                  ერთეული (Singles)
                </button>
                <button
                  type="button"
                  onClick={() => setMatchType('doubles')}
                  className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition cursor-pointer ${
                    matchType === 'doubles'
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-line bg-card text-ink-2 hover:bg-overlay'
                  }`}>
                  წყვილი (Doubles)
                </button>
              </div>
            </div>

            {/* ── Player fields ── */}
            <div className="space-y-4">
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="სახელი"
                className={inputClass}
              />
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="გვარი"
                className={inputClass}
              />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 9);
                  setPhone(val);
                }}
                pattern="\d{9}"
                placeholder="ტელეფონის ნომერი"
                className={inputClass}
              />
            </div>

            {matchType === 'doubles' && (
              <div className="space-y-4 rounded-2xl border border-accent-2/20 bg-accent-2/5 p-4">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-accent-2" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-accent-2">მეწყვილე</h4>
                </div>

                <input
                  type="text"
                  required
                  value={partnerFirstName}
                  onChange={(e) => setPartnerFirstName(e.target.value)}
                  placeholder="სახელი"
                  className={inputClass}
                />
                <input
                  type="text"
                  required
                  value={partnerLastName}
                  onChange={(e) => setPartnerLastName(e.target.value)}
                  placeholder="გვარი"
                  className={inputClass}
                />
                <input
                  type="tel"
                  required
                  value={partnerPhone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 9);
                    setPartnerPhone(val);
                  }}
                  pattern="\d{9}"
                  placeholder="ტელეფონის ნომერი"
                  className={inputClass}
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl px-4 py-2.5 text-xs font-semibold text-ink-2 hover:text-ink hover:bg-overlay transition cursor-pointer">
                გაუქმება
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-accent text-inverse font-bold px-5 py-2.5 text-xs transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 cursor-pointer accent-glow">
                {loading ? 'იგზავნება...' : 'რეგისტრაცია'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
