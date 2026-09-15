'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        onClose();
        router.push('/admin');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'არასწორი მონაცემები');
      }
    } catch {
      setError('შეცდომა ავტორიზაციისას');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-panel p-6 shadow-xl">
        <h2 className="text-xl font-black uppercase text-ink mb-4">ადმინში შესვლა</h2>

        {error && (
          <div className="mb-4 rounded-lg bg-danger/10 border border-danger/30 p-3 text-xs text-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-2">ელ. ფოსტა</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-2">პაროლი</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-ink-2 hover:bg-overlay cursor-pointer"
            >
              გაუქმება
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-accent px-5 py-2 text-xs font-bold text-inverse transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'შესვლა...' : 'შესვლა'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}