import { useSupplierStore } from '../stores/useSupplierStore';
import { SUPPLIERS } from '../data/suppliers';
import { Badge, EmptyState, SupplierBadge } from '../components/shared';
import { formatTimeAgo } from '../utils/format';

/** /mcp-monitor — 공급사 연결상태, 응답시간, 성공률, 최근 도구 호출 */
export function McpMonitorPage() {
  const health = useSupplierStore((s) => s.health);
  const recentResults = useSupplierStore((s) => s.recentResults);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Travel MCP Gateway 모니터</h1>
          <p className="text-xs text-ink-500">
            AI Orchestrator → MCP Gateway → Supplier Registry → Adapters → Mock Data 구조의 상태 화면입니다.
          </p>
        </div>

        <section className="overflow-x-auto rounded-xl border border-ink-100 bg-white">
          <table className="w-full min-w-[560px] text-left text-xs">
            <caption className="sr-only">공급사 상태 테이블</caption>
            <thead>
              <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">
                <th className="px-4 py-2.5">공급사</th>
                <th className="px-4 py-2.5">프로토콜</th>
                <th className="px-4 py-2.5">상태</th>
                <th className="px-4 py-2.5">최근 응답시간</th>
                <th className="px-4 py-2.5">성공률</th>
                <th className="px-4 py-2.5">호출</th>
              </tr>
            </thead>
            <tbody>
              {SUPPLIERS.map((s) => {
                const h = health.find((x) => x.supplierId === s.id);
                return (
                  <tr key={s.id} className="border-b border-ink-50 last:border-0">
                    <td className="px-4 py-2.5">
                      <p className="font-semibold text-ink-800">{s.name}</p>
                      <p className="text-xs text-ink-400">{s.description}</p>
                    </td>
                    <td className="px-4 py-2.5"><Badge tone="neutral">{s.apiProtocol}</Badge></td>
                    <td className="px-4 py-2.5"><SupplierBadge name="" status={h?.status ?? 'connected'} /></td>
                    <td className="px-4 py-2.5 tabular-nums">{h?.latencyMs ?? s.avgLatencyMs}ms</td>
                    <td className="px-4 py-2.5 tabular-nums">
                      <span className={h && h.successRate < 0.8 ? 'text-red-700 font-semibold' : 'text-emerald-700'}>
                        {Math.round((h?.successRate ?? 1) * 100)}%
                      </span>
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-ink-500">
                      {h?.recentCalls ?? 0}회 {h && h.recentFailures > 0 && <span className="text-red-600">(실패 {h.recentFailures})</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section className="rounded-xl border border-ink-100 bg-white p-4">
          <h2 className="mb-2 text-base font-semibold text-ink-800">최근 MCP 도구 호출</h2>
          {recentResults.length === 0 ? (
            <EmptyState title="아직 도구 호출이 없습니다" description="워크스페이스에서 검색을 실행하면 호출 기록이 여기 표시됩니다." />
          ) : (
            <ul className="max-h-96 space-y-1 overflow-y-auto">
              {recentResults.map((r) => (
                <li key={r.callId} className="flex flex-wrap items-center gap-2 rounded-md bg-ink-50 px-2.5 py-1.5 text-xs">
                  <Badge tone={r.ok ? (r.status === 'degraded' ? 'warning' : 'success') : 'danger'}>{r.status}</Badge>
                  <code className="font-mono text-ink-700">{r.toolName}</code>
                  {r.supplierId && <span className="text-ink-400">@{r.supplierId}</span>}
                  <span className="ml-auto tabular-nums text-ink-400">{r.latencyMs}ms · {formatTimeAgo(r.completedAt)}</span>
                  {r.errorMessage && <span className="w-full text-red-600">{r.errorMessage}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
