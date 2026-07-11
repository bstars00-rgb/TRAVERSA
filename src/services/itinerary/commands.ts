import type {
  DiffChange,
  Itinerary,
  ItineraryDiff,
  ItineraryItem,
} from '../../types';
import { calculateItineraryBudget } from './budget';
import { uid } from '../../utils/id';

/**
 * 자연어 일정 수정 명령 해석기 (Mock AI).
 * 변경안은 Diff로만 반환하며, 사용자가 "변경 적용"을 눌러야 실제 반영된다.
 */
export function interpretItineraryCommand(
  command: string,
  itinerary: Itinerary,
): ItineraryDiff | null {
  const clone: Itinerary = structuredClone(itinerary);
  const changes: DiffChange[] = [];
  let summary = '';

  const dayMatch = command.match(/(첫|둘|셋|넷|다섯|마지막|(\d+))\s*(째|번째)?\s*날/);
  const targetDayNumber = resolveDayNumber(dayMatch, clone.days.length);

  if (/여유롭게|느긋하게|여유 있게/.test(command)) {
    const day = clone.days.find((d) => d.dayNumber === (targetDayNumber ?? 2));
    if (!day) return null;
    const removable = day.items.filter((i) => i.type === 'sightseeing' || i.type === 'activity');
    const removed = removable.length > 1 ? removable[removable.length - 1] : undefined;
    if (removed) {
      day.items = day.items.filter((i) => i.id !== removed.id);
      changes.push({ kind: 'remove', label: `${removed.title} 제거`, before: removed.title, impact: '활동시간 감소' });
    }
    for (const item of day.items) {
      if (item.type === 'rest') {
        changes.push({ kind: 'modify', label: '휴식시간 연장', before: `${item.durationMinutes}분`, after: `${item.durationMinutes + 60}분` });
        item.durationMinutes += 60;
      }
    }
    if (!day.items.some((i) => i.type === 'rest')) {
      const rest: ItineraryItem = {
        id: uid('item'),
        type: 'rest',
        title: '휴식 (온천/객실)',
        startTime: '15:00',
        durationMinutes: 120,
        location: '숙소',
        travelMinutesFromPrevious: 15,
        requiresBooking: false,
        bookingStatus: 'idea',
        weatherSensitive: false,
        physicalLoad: 'low',
        aiNote: '여유로운 일정을 위해 추가된 휴식입니다.',
      };
      day.items.splice(Math.min(2, day.items.length), 0, rest);
      changes.push({ kind: 'add', label: '휴식 시간 추가', after: '휴식 2시간' });
    }
    summary = `Day ${day.dayNumber} 일정을 여유롭게 조정했습니다.`;
  } else if (/걷지 않|도보.*(줄|최소)/.test(command)) {
    for (const day of clone.days) {
      for (const item of day.items) {
        if (item.physicalLoad === 'high' || (item.physicalLoad === 'medium' && item.travelMinutesFromPrevious > 20)) {
          changes.push({
            kind: 'modify',
            label: `${item.title} — 차량 이동으로 전환`,
            before: `도보 포함 이동 ${item.travelMinutesFromPrevious}분`,
            after: `차량 이동 ${Math.max(10, item.travelMinutesFromPrevious - 10)}분`,
            impact: '체력 소모도 하향',
          });
          item.travelMinutesFromPrevious = Math.max(10, item.travelMinutesFromPrevious - 10);
          item.physicalLoad = 'low';
          item.accessibilityNotes = '차량 이동으로 도보 구간 최소화';
        }
      }
    }
    if (changes.length === 0) return null;
    summary = '도보 부담이 큰 구간을 차량 이동으로 전환했습니다.';
  } else if (/비용.*(낮춰|줄여|절약)|저렴하게/.test(command)) {
    const amountMatch = command.match(/(\d+)\s*만\s*원/);
    const target = amountMatch ? Number(amountMatch[1]) * 10_000 : 200_000;
    let saved = 0;
    for (const day of clone.days) {
      for (const item of day.items) {
        if (saved >= target) break;
        if (item.price?.status === 'estimated' && item.price.amount.amount > 50_000) {
          const cut = Math.min(item.price.amount.amount - 30_000, target - saved);
          if (cut <= 0) continue;
          changes.push({
            kind: 'modify',
            label: `${item.title} — 합리적 대안으로 변경`,
            before: `${item.price.amount.amount.toLocaleString('ko-KR')}원`,
            after: `${(item.price.amount.amount - cut).toLocaleString('ko-KR')}원`,
          });
          item.price = { ...item.price, amount: { ...item.price.amount, amount: item.price.amount.amount - cut } };
          saved += cut;
        }
      }
    }
    if (changes.length === 0) return null;
    summary = `식사·활동 항목을 조정해 약 ${saved.toLocaleString('ko-KR')}원을 절감했습니다. 호텔/항공 변경은 별도로 요청해주세요.`;
  } else if (/쇼핑.*(늘려|추가)/.test(command)) {
    const day = clone.days[clone.days.length - 1];
    const shopping = day.items.find((i) => i.type === 'shopping');
    if (shopping) {
      changes.push({ kind: 'modify', label: '쇼핑시간 연장', before: `${shopping.durationMinutes}분`, after: `${shopping.durationMinutes + 60}분` });
      shopping.durationMinutes += 60;
    } else {
      day.items.splice(1, 0, {
        id: uid('item'),
        type: 'shopping',
        title: '쇼핑 시간',
        startTime: '10:00',
        durationMinutes: 120,
        location: '시내 쇼핑가',
        travelMinutesFromPrevious: 20,
        requiresBooking: false,
        bookingStatus: 'idea',
        weatherSensitive: false,
        physicalLoad: 'medium',
      });
      changes.push({ kind: 'add', label: '마지막 날 쇼핑 추가', after: '쇼핑 2시간' });
    }
    summary = '마지막 날 쇼핑시간을 조정했습니다.';
  } else if (/아이가 좋아할|아이.*추가/.test(command)) {
    const day = clone.days.find((d) => d.dayNumber === 2) ?? clone.days[1];
    if (!day) return null;
    const kidItem: ItineraryItem = {
      id: uid('item'),
      type: 'activity',
      title: '키즈 프렌들리 체험 (AI 추천)',
      startTime: '14:00',
      durationMinutes: 120,
      location: '시내',
      travelMinutesFromPrevious: 20,
      requiresBooking: true,
      bookingStatus: 'idea',
      price: { amount: { amount: 60000, currency: 'KRW' }, status: 'estimated', capturedAt: new Date().toISOString() },
      weatherSensitive: false,
      physicalLoad: 'low',
      aiNote: '실제 예약 전 LocalXperience에서 재검색이 필요합니다.',
    };
    day.items.push(kidItem);
    changes.push({ kind: 'add', label: '아이 대상 액티비티 추가', after: kidItem.title, impact: '+60,000원 (예상)' });
    summary = `Day ${day.dayNumber}에 아이가 좋아할 일정을 추가했습니다.`;
  } else if (/비가 올|우천|비 오면/.test(command)) {
    for (const day of clone.days) {
      for (const item of day.items) {
        if (item.weatherSensitive) {
          changes.push({
            kind: 'add',
            label: `"${item.title}" 우천 대체안`,
            after: '실내 미술관/아쿠아리움 대체 일정',
            impact: '우천 시 자동 제안',
          });
          item.alternativeOf = '실내 대체 일정: 미술관 또는 아쿠아리움';
        }
      }
    }
    if (changes.length === 0) return null;
    summary = '야외 일정마다 우천 대체안을 연결했습니다.';
  } else if (/역에서 가까|호텔.*바꿔|호텔.*변경/.test(command)) {
    // 호텔 교체는 재검색이 필요 — Diff에는 안내만 담는다
    changes.push({
      kind: 'replace',
      label: '호텔 재검색 필요',
      before: '현재 선택된 호텔',
      after: '역 인접 호텔 후보 재검색',
      impact: '검색 패널에서 새 후보를 확인하세요',
    });
    summary = '역에서 더 가까운 호텔을 찾으려면 호텔 검색을 다시 실행해야 합니다. 검색 결과에서 "역 인접" 조건이 반영됩니다.';
  } else {
    return null;
  }

  const before = calculateItineraryBudget(itinerary, 'KRW');
  const after = calculateItineraryBudget(clone, 'KRW');
  clone.version = itinerary.version + 1;
  clone.updatedAt = new Date().toISOString();

  const travelBefore = totalTravelMinutes(itinerary);
  const travelAfter = totalTravelMinutes(clone);

  return {
    id: uid('diff'),
    command,
    summary,
    changes,
    costDelta: { amount: after.amount - before.amount, currency: 'KRW' },
    travelTimeDeltaMinutes: travelAfter - travelBefore,
    proposedItinerary: clone,
    createdAt: new Date().toISOString(),
  };
}

function totalTravelMinutes(itinerary: Itinerary): number {
  return itinerary.days.reduce(
    (sum, d) => sum + d.items.reduce((s, i) => s + i.travelMinutesFromPrevious, 0),
    0,
  );
}

const DAY_WORDS: Record<string, number> = { 첫: 1, 둘: 2, 셋: 3, 넷: 4, 다섯: 5 };

function resolveDayNumber(match: RegExpMatchArray | null, totalDays: number): number | null {
  if (!match) return null;
  if (match[1] === '마지막') return totalDays;
  if (match[2]) return Number(match[2]);
  return DAY_WORDS[match[1]] ?? null;
}
