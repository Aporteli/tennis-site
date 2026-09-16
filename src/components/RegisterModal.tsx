'use client';

import { useRef, useState } from 'react';
import { X, UserPlus, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { Mode } from '../lib/types';

interface RegisterModalProps {
  isOpen: boolean;
  mode: Mode;
  onClose: () => void;
  onSuccess?: () => void;
}

const HONEYPOT_NAMES = [
  'website',
  'url',
  'company',
  'email2',
  'fax',
  'address',
  'username',
] as const;

type HoneypotKey = (typeof HONEYPOT_NAMES)[number];

const emptyHoneypots = (): Record<HoneypotKey, string> =>
  HONEYPOT_NAMES.reduce(
    (acc, k) => ({ ...acc, [k]: '' }),
    {} as Record<HoneypotKey, string>,
  );

const MIN_FILL_TIME_MS = 2000;

/** Georgian letters + Georgian Supplement + space + hyphen. */
const GEORGIAN_NAME_RE = /^[\u10A0-\u10FF\u1C90-\u1CBF\u2D00-\u2D2F\s\-]+$/;

function isGeorgianName(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= 2 && GEORGIAN_NAME_RE.test(trimmed);
}

const inputClass =
  'w-full rounded-xl border border-line bg-card pl-3 pr-3 py-2.5 text-sm text-ink placeholder:text-ink-3 outline-none focus:border-accent-2 focus:ring-1 focus:ring-accent-2 transition';

function NameInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const touched = value.length > 0;
  const valid = isGeorgianName(value);
  return (
    <div>
      <input
        type="text"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputClass} ${
          touched && !valid ? 'border-danger/60 focus:border-danger' : ''
        }`}
      />
      {touched && !valid && (
        <p className="mt-1 text-[11px] text-danger">მხოლოდ ქართული ასოები</p>
      )}
    </div>
  );
}

export default function RegisterModal({
  isOpen,
  mode,
  onClose,
  onSuccess,
}: RegisterModalProps) {
  const [matchType, setMatchType] = useState<Mode>(mode);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [partnerFirstName, setPartnerFirstName] = useState('');
  const [partnerLastName, setPartnerLastName] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateOf, setDuplicateOf] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [honeypots, setHoneypots] =
    useState<Record<HoneypotKey, string>>(emptyHoneypots);
  const openedAtRef = useRef<number>(Date.now());

  if (!isOpen) return null;

  const phoneDigitsRegex = /^\d{9}$/;

  const looksLikeBot = (): boolean => {
    for (const name of HONEYPOT_NAMES) {
      if (honeypots[name].trim() !== '') return true;
    }
    if (Date.now() - openedAtRef.current < MIN_FILL_TIME_MS) return true;
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (looksLikeBot()) {
      setSubmitted(true);
      return;
    }

    if (
      !isGeorgianName(firstName) ||
      !isGeorgianName(lastName) ||
      !phoneDigitsRegex.test(phone.trim())
    ) {
      setError(
        'სახელი და გვარი უნდა იყოს ქართული ასოებით, ტელეფონი — 9 ციფრი',
      );
      return;
    }
    if (
      matchType === 'doubles' &&
      (!isGeorgianName(partnerFirstName) ||
        !isGeorgianName(partnerLastName) ||
        !phoneDigitsRegex.test(partnerPhone.trim()))
    ) {
      setError(
        'პარტნიორის სახელი და გვარი უნდა იყოს ქართული ასოებით, ტელეფონი — 9 ციფრი',
      );
      return;
    }

    setLoading(true);
    setError(null);
    setDuplicateOf(null);

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
        throw new Error(
          `სერვერმა დააბრუნა არასწორი პასუხი (HTTP ${res.status})`,
        );
      }

      if (!res.ok) {
        if (res.status === 409) {
          setError(data.error || 'ეს რეგისტრაცია დუბლირებულია.');
          setDuplicateOf(data.duplicateOf ?? null);
          return;
        }
        throw new Error(
          data.error || `რეგისტრაცია ვერ მოხერხდა (HTTP ${res.status})`,
        );
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
      const message =
        err instanceof Error ? err.message : 'დაფიქსირდა შეცდომა';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setError(null);
    setDuplicateOf(null);
    setMatchType(mode);
    setHoneypots(emptyHoneypots());
    openedAtRef.current = Date.now();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-line bg-panel p-6 sm:p-8 shadow-2xl">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-ink-3 hover:text-ink hover:bg-overlay transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {submitted ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-win/10 text-win border border-win/20">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="text-2xl font-bold text-ink tracking-tight">
              განაცხადი მიღებულია!
            </h3>
            <p className="text-sm text-ink-2 leading-relaxed max-w-xs mx-auto">
              თქვენი მონაცემები წარმატებით დარეგისტრირდა. ადმინისტრატორის
              დადასტურების შემდეგ გამოჩნდებით სიაში.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="w-full mt-2 rounded-xl bg-win hover:opacity-90 px-4 py-3 text-sm font-bold text-inverse shadow-lg transition cursor-pointer active:scale-[0.98]"
            >
              დახურვა
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
            autoComplete="off"
            noValidate={false}
          >
            {/* HONEYPOT LAYER 1 — display:none */}
            <div aria-hidden="true" style={{ display: 'none' }}>
              <label>
                Website
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypots.website}
                  onChange={(e) =>
                    setHoneypots((h) => ({ ...h, website: e.target.value }))
                  }
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
                  onChange={(e) =>
                    setHoneypots((h) => ({ ...h, company: e.target.value }))
                  }
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
                  onChange={(e) =>
                    setHoneypots((h) => ({ ...h, email2: e.target.value }))
                  }
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
                  onChange={(e) =>
                    setHoneypots((h) => ({ ...h, username: e.target.value }))
                  }
                />
              </label>
            </div>

            {/* HONEYPOT LAYER 2 — off-screen */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: '-9999px',
                top: 'auto',
                width: '1px',
                height: '1px',
                overflow: 'hidden',
              }}
            >
              <label>
                Fax number
                <input
                  type="text"
                  name="fax"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypots.fax}
                  onChange={(e) =>
                    setHoneypots((h) => ({ ...h, fax: e.target.value }))
                  }
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
                  onChange={(e) =>
                    setHoneypots((h) => ({ ...h, address: e.target.value }))
                  }
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
                  onChange={(e) =>
                    setHoneypots((h) => ({ ...h, url: e.target.value }))
                  }
                />
              </label>
            </div>

            {/* Header */}
            <div className="flex items-center gap-3.5 pb-3 border-b border-line">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-2/10 text-accent-2 border border-accent-2/20 shrink-0">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-ink tracking-tight">
                  ტურნირზე რეგისტრაცია
                </h3>
                <p className="text-xs text-ink-2 mt-0.5"></p>
              </div>
            </div>

            {/* Error + duplicate warning */}
            {error && (
              <div className="rounded-xl border border-danger/30 bg-danger/10 p-3.5 text-xs font-medium text-danger">
                <p>{error}</p>
                {duplicateOf && (
                  <p className="mt-1.5 flex items-start gap-1.5 text-danger/90">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>
                      ემთხვევა უკვე დამტკიცებულ წყვილს:{' '}
                      <strong>{duplicateOf}</strong>
                    </span>
                  </p>
                )}
              </div>
            )}

            {/* Mode toggle */}
            <div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMatchType('singles')}
                  className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition cursor-pointer ${
                    matchType === 'singles'
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-line bg-card text-ink-2 hover:bg-overlay'
                  }`}
                >
                  ერთეული (Singles)
                </button>
                <button
                  type="button"
                  onClick={() => setMatchType('doubles')}
                  className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition cursor-pointer ${
                    matchType === 'doubles'
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-line bg-card text-ink-2 hover:bg-overlay'
                  }`}
                >
                  წყვილი (Doubles)
                </button>
              </div>
            </div>

            {/* Player fields */}
            <div className="space-y-4">
              <NameInput
                value={firstName}
                onChange={setFirstName}
                placeholder="სახელი"
              />
              <NameInput
                value={lastName}
                onChange={setLastName}
                placeholder="გვარი"
              />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => {
                  const val = e.target.value
                    .replace(/[^0-9]/g, '')
                    .slice(0, 9);
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
                  <h4 className="text-xs font-bold uppercase tracking-wider text-accent-2">
                    მეწყვილე
                  </h4>
                </div>

                <NameInput
                  value={partnerFirstName}
                  onChange={setPartnerFirstName}
                  placeholder="სახელი"
                />
                <NameInput
                  value={partnerLastName}
                  onChange={setPartnerLastName}
                  placeholder="გვარი"
                />
                <input
                  type="tel"
                  required
                  value={partnerPhone}
                  onChange={(e) => {
                    const val = e.target.value
                      .replace(/[^0-9]/g, '')
                      .slice(0, 9);
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
                className="rounded-xl px-4 py-2.5 text-xs font-semibold text-ink-2 hover:text-ink hover:bg-overlay transition cursor-pointer"
              >
                გაუქმება
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-accent text-inverse font-bold px-5 py-2.5 text-xs transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 cursor-pointer accent-glow"
              >
                {loading ? 'იგზავნება...' : 'რეგისტრაცია'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}