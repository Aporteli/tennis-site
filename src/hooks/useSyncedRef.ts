'use client';

import { useRef } from 'react';
import type { MutableRefObject } from 'react';

/** Keeps a ref in sync with a value — useful inside stable callbacks. */
export function useSyncedRef<T>(value: T): MutableRefObject<T> {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}