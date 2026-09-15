'use client';

import { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  children: ReactNode;
  maxWidth?: number;
}

export default function Modal({ open, children, maxWidth = 440 }: ModalProps) {
  return (
    <div
      className={`fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-md transition-opacity duration-200 ${
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}>
      <div
        className="w-[90%] rounded-2xl border border-line bg-panel p-8 text-ink shadow-2xl transition-transform duration-300"
        style={{
          maxWidth,
          transform: open ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
        }}>
        {children}
      </div>
    </div>
  );
}
