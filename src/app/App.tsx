import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { HomePage } from '../pages/HomePage';
import { WorkspacePage } from '../pages/WorkspacePage';
import { BookingPage } from '../pages/BookingPage';
import { DesignSystemPage } from '../pages/DesignSystemPage';
import { McpMonitorPage } from '../pages/McpMonitorPage';
import { ActivityLogPage } from '../pages/ActivityLogPage';
import { MemoryPage } from '../pages/MemoryPage';
import { FutureJourneyPage } from '../pages/FutureJourneyPage';
import { SettingsPage } from '../pages/SettingsPage';

/**
 * HashRouter 사용 — GitHub Pages 정적 호스팅에서 직접 경로 접근/새로고침 문제를 피한다.
 */
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/new-trip" element={<HomePage />} />
          <Route path="/trip" element={<WorkspacePage />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/design-system" element={<DesignSystemPage />} />
          <Route path="/mcp-monitor" element={<McpMonitorPage />} />
          <Route path="/activity-log" element={<ActivityLogPage />} />
          <Route path="/memory" element={<MemoryPage />} />
          <Route path="/future-journey" element={<FutureJourneyPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
