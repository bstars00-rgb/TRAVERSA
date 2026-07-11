import { useState } from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { BellRing, CheckCircle2, Languages, Plane, Wallet, MapPinned, LifeBuoy, Star, ClipboardList } from 'lucide-react';
import { useUserMemoryStore } from '../stores/useUserMemoryStore';
import { useConversationStore } from '../stores/useConversationStore';
import { Badge, Button, SourceTag } from '../components/shared';
import type { TravelPersonaAxes } from '../types';

const AXIS_LABELS: Record<keyof TravelPersonaAxes, string> = {
  comfort: '편안함',
  price: '가격',
  localExperience: '현지 경험',
  scheduleDensity: '일정 밀도',
  food: '음식',
  luxury: '럭셔리',
  familyFriendly: '가족 친화',
  adventure: '모험',
  mobilityEase: '이동 편의성',
};

/** 현재 여행 성향 (Mock) — 온천 시나리오 기준 */
const CURRENT_TRIP: TravelPersonaAxes = {
  comfort: 92,
  price: 48,
  localExperience: 74,
  scheduleDensity: 22,
  food: 90,
  luxury: 72,
  familyFriendly: 60,
  adventure: 15,
  mobilityEase: 95,
};

const POST_BOOKING_STAGES = [
  { icon: ClipboardList, title: '출발 전 준비', detail: '비자·보험·짐 체크리스트를 D-7부터 단계별로 안내' },
  { icon: Plane, title: '온라인 체크인', detail: '체크인 오픈 시점 알림, 좌석 선호 반영 (사용자 승인 후 실행)' },
  { icon: MapPinned, title: '공항 이동', detail: '실시간 교통 상황 기반 출발시간 제안' },
  { icon: BellRing, title: '현지 일정 안내', detail: '당일 일정·날씨·이동 브리핑, 실시간 변경 제안' },
  { icon: Languages, title: '번역', detail: '료칸 체크인, 식당 주문 등 상황별 실시간 통역' },
  { icon: LifeBuoy, title: '문제 해결', detail: '항공 지연·분실물 발생 시 대체안과 보상 절차 안내' },
  { icon: Wallet, title: '귀국 후 비용 정리', detail: '통화별 지출 자동 집계, 예산 대비 리포트' },
  { icon: Star, title: '만족도 학습', detail: '피드백을 여행 기억에 반영 (허용한 항목만)' },
];

export function FutureJourneyPage() {
  const persona = useUserMemoryStore((s) => s.persona);
  const { monitoringAlerts, resolveAlert } = useUserMemoryStore();
  const agents = useConversationStore((s) => s.agentActivities);
  const [activeStage, setActiveStage] = useState(0);

  const radarData = (Object.keys(AXIS_LABELS) as (keyof TravelPersonaAxes)[]).map((k) => ({
    axis: AXIS_LABELS[k],
    평소성향: persona[k],
    현재여행: CURRENT_TRIP[k],
  }));

  const matchScore = Math.round(
    100 -
      (Object.keys(AXIS_LABELS) as (keyof TravelPersonaAxes)[]).reduce(
        (sum, k) => sum + Math.abs(persona[k] - CURRENT_TRIP[k]),
        0,
      ) / (Object.keys(AXIS_LABELS).length * 1.0) ,
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl space-y-5 p-4 md:p-6">
        <div>
          <h1 className="text-lg font-bold text-ink-900">미래 여행 경험 데모</h1>
          <p className="text-xs text-ink-500">10년 후를 향한 기능들 — 모두 사용자 승인을 전제로 동작합니다.</p>
        </div>

        {/* 2. Autonomous Trip Monitoring */}
        <section className="rounded-xl border border-ink-100 bg-white p-4">
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-ink-800">
            <BellRing size={15} className="text-brand-700" /> 자율 여행 모니터링
          </h2>
          <p className="mt-0.5 text-[11px] text-ink-500">
            AI가 변화를 감지해도 자동으로 변경하지 않습니다. 영향과 함께 제안하고 승인을 기다립니다.
          </p>
          <ul className="mt-3 space-y-2">
            {monitoringAlerts.map((a) => (
              <li key={a.id} className={`rounded-lg border p-3 ${a.status === 'pending_user' ? 'border-brand-200 bg-brand-50' : 'border-ink-100 bg-ink-50 opacity-60'}`}>
                <div className="flex flex-wrap items-center gap-1.5">
                  <h3 className="text-xs font-semibold text-ink-800">{a.title}</h3>
                  <Badge tone={a.status === 'approved' ? 'success' : a.status === 'dismissed' ? 'neutral' : 'brand'}>
                    {a.status === 'pending_user' ? '승인 대기' : a.status === 'approved' ? '승인됨' : '거절됨'}
                  </Badge>
                </div>
                <p className="mt-1 text-[11px] text-ink-600">{a.description}</p>
                <p className="mt-1 text-[11px] text-ink-700"><strong>제안:</strong> {a.proposedAction} <span className="text-ink-400">({a.impact})</span></p>
                {a.status === 'pending_user' && (
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" onClick={() => resolveAlert(a.id, 'approved')}>제안 승인</Button>
                    <Button size="sm" variant="ghost" onClick={() => resolveAlert(a.id, 'dismissed')}>유지</Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* 3. Personal Travel Digital Twin */}
        <section className="rounded-xl border border-ink-100 bg-white p-4">
          <h2 className="text-sm font-bold text-ink-800">Personal Travel Digital Twin</h2>
          <p className="mt-0.5 text-[11px] text-ink-500">
            평소 여행 성향과 현재 계획 중인 여행의 일치도: <strong className="text-brand-700">{matchScore}%</strong>
          </p>
          <div className="h-72 w-full" aria-label="여행 성향 레이더 차트">
            <ResponsiveContainer>
              <RadarChart data={radarData} outerRadius="70%">
                <PolarGrid stroke="var(--color-ink-200)" />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: 'var(--color-ink-500)' }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="평소 성향" dataKey="평소성향" stroke="var(--color-brand-600)" fill="var(--color-brand-500)" fillOpacity={0.25} />
                <Radar name="현재 여행" dataKey="현재여행" stroke="var(--color-gold-500)" fill="var(--color-gold-500)" fillOpacity={0.2} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 4. Multi-agent Collaboration */}
        <section className="rounded-xl border border-ink-100 bg-white p-4">
          <h2 className="text-sm font-bold text-ink-800">Multi-agent Collaboration</h2>
          <p className="mt-0.5 text-[11px] text-ink-500">
            전문 에이전트가 협업하고 Travel Orchestrator가 통합합니다. 예약 실행은 항상 사용자 승인이 필요합니다.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
            {agents.map((a) => (
              <div key={a.id} className="rounded-lg border border-ink-100 bg-ink-50 p-2.5">
                <p className="text-[11px] font-semibold text-ink-700">{a.label}</p>
                <p className="mt-0.5 truncate text-[10px] text-ink-400">{a.message}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-500">
            <CheckCircle2 size={12} className="text-emerald-600" />
            최종 결정: Travel Orchestrator 통합 → <SourceTag source="user_confirmed" /> 사용자 승인 → 예약 실행
          </p>
        </section>

        {/* 5. Post-booking Journey Agent */}
        <section className="rounded-xl border border-ink-100 bg-white p-4">
          <h2 className="text-sm font-bold text-ink-800">Post-booking Journey Agent</h2>
          <p className="mt-0.5 text-[11px] text-ink-500">예약 이후부터 귀국까지 이어지는 동반 에이전트 데모.</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {POST_BOOKING_STAGES.map((s, i) => (
              <button
                key={s.title}
                onClick={() => setActiveStage(i)}
                aria-pressed={activeStage === i}
                className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors cursor-pointer ${
                  activeStage === i ? 'bg-brand-700 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                }`}
              >
                {s.title}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-start gap-3 rounded-lg bg-ink-50 p-4">
            {(() => {
              const Icon = POST_BOOKING_STAGES[activeStage].icon;
              return <Icon size={20} className="mt-0.5 shrink-0 text-brand-700" />;
            })()}
            <div>
              <h3 className="text-sm font-semibold text-ink-800">{POST_BOOKING_STAGES[activeStage].title}</h3>
              <p className="mt-1 text-xs text-ink-600">{POST_BOOKING_STAGES[activeStage].detail}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
