import { NavLink, Outlet } from 'react-router-dom';
import {
  Activity,
  BookOpenCheck,
  Brain,
  Compass,
  CreditCard,
  ListTree,
  Palette,
  Settings,
  Sparkles,
} from 'lucide-react';
import { ToastHost } from '../components/shared';

/** 소비자용 주 메뉴 */
const PRIMARY_NAV = [
  { to: '/trip', label: '내 여행', icon: Compass },
  { to: '/booking', label: '예약 준비', icon: CreditCard },
  { to: '/future-journey', label: '미래 여행', icon: Sparkles },
  { to: '/memory', label: '여행 기억', icon: Brain },
];

/** 데모·운영자용 보조 메뉴 (아이콘만, 구분선 뒤) */
const SECONDARY_NAV = [
  { to: '/mcp-monitor', label: '판매처 연결 상태', icon: Activity },
  { to: '/activity-log', label: '이벤트 로그', icon: ListTree },
  { to: '/design-system', label: '디자인 시스템', icon: Palette },
  { to: '/settings', label: '설정 · 데모', icon: Settings },
];

export function AppLayout() {
  return (
    <div className="flex h-full flex-col">
      <header className="z-20 border-b border-ink-100 bg-white">
        <div className="flex items-center gap-4 px-4 py-2.5 md:px-6">
          <NavLink to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-800 text-white">
              <BookOpenCheck size={16} />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-sm font-bold tracking-wide text-ink-900">TRAVERSA AI</span>
              <span className="text-[10px] text-ink-400">Conversational Travel Prototype</span>
            </span>
          </NavLink>
          <nav aria-label="주 메뉴" className="ml-auto flex items-center gap-0.5 overflow-x-auto">
            {PRIMARY_NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    isActive ? 'bg-brand-100 text-brand-800' : 'text-ink-500 hover:bg-ink-100 hover:text-ink-700'
                  }`
                }
              >
                <Icon size={14} />
                <span className="hidden md:inline">{label}</span>
              </NavLink>
            ))}
            <span className="mx-1.5 hidden h-4 w-px shrink-0 bg-ink-200 md:block" aria-hidden />
            {SECONDARY_NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                title={label}
                aria-label={label}
                className={({ isActive }) =>
                  `flex shrink-0 items-center rounded-lg p-1.5 transition-colors ${
                    isActive ? 'bg-brand-100 text-brand-800' : 'text-ink-400 hover:bg-ink-100 hover:text-ink-600'
                  }`
                }
              >
                <Icon size={14} />
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="min-h-0 flex-1">
        <Outlet />
      </main>
      <ToastHost />
    </div>
  );
}
