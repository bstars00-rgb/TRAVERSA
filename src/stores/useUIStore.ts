import { create } from 'zustand';
import { uid } from '../utils/id';

export type MobileTab = 'chat' | 'plan' | 'booking';

export interface ToastItem {
  id: string;
  kind: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

interface UIState {
  mobileTab: MobileTab;
  toasts: ToastItem[];
  setMobileTab: (tab: MobileTab) => void;
  pushToast: (kind: ToastItem['kind'], message: string) => void;
  dismissToast: (id: string) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  mobileTab: 'chat',
  toasts: [],
  setMobileTab: (mobileTab) => set({ mobileTab }),
  pushToast: (kind, message) => {
    const id = uid('toast');
    set((s) => ({ toasts: [...s.toasts, { id, kind, message }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 5000);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
