import type {
  Itinerary,
  ItineraryDay,
  ItineraryItem,
  ValidationIssue,
} from '../../types';
import { uid } from '../../utils/id';

const CHECKIN_HOUR = 15;
const CHECKOUT_HOUR = 11;
const MAX_ACTIVE_MINUTES_PER_DAY = 600;

/**
 * ItineraryValidator — 일정 문제를 결정론적으로 탐지한다.
 * AI 설명이 아니라 규칙 기반 검증이므로 신뢰 가능한 데이터로 취급한다.
 */
export function validateItinerary(itinerary: Itinerary, budgetLimit?: number): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const day of itinerary.days) {
    issues.push(...validateDay(day));
  }
  issues.push(...validateHotelTimes(itinerary));
  if (budgetLimit !== undefined) {
    issues.push(...validateBudget(itinerary, budgetLimit));
  }
  return issues;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function itemEnd(item: ItineraryItem): number {
  return toMinutes(item.startTime) + item.durationMinutes;
}

function validateDay(day: ItineraryDay): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const sorted = [...day.items].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));

  // 예약시간 중복 + 이동시간 부족
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const gap = toMinutes(curr.startTime) - itemEnd(prev);
    if (gap < 0 && prev.requiresBooking && curr.requiresBooking) {
      issues.push({
        id: uid('vi'),
        type: 'booking_time_overlap',
        severity: 'critical',
        message: `Day ${day.dayNumber}: "${prev.title}"와 "${curr.title}"의 예약시간이 겹칩니다.`,
        dayNumber: day.dayNumber,
        itemIds: [prev.id, curr.id],
      });
    } else if (gap >= 0 && gap < curr.travelMinutesFromPrevious) {
      issues.push({
        id: uid('vi'),
        type: 'insufficient_travel_time',
        severity: 'warning',
        message: `Day ${day.dayNumber}: "${curr.title}"까지 이동시간 ${curr.travelMinutesFromPrevious}분이 필요하지만 여유가 ${gap}분뿐입니다.`,
        dayNumber: day.dayNumber,
        itemIds: [prev.id, curr.id],
      });
    }
  }

  // 하루 일정 과다
  const activeMinutes = sorted
    .filter((i) => i.type !== 'rest' && i.type !== 'hotel')
    .reduce((sum, i) => sum + i.durationMinutes + i.travelMinutesFromPrevious, 0);
  if (activeMinutes > MAX_ACTIVE_MINUTES_PER_DAY) {
    issues.push({
      id: uid('vi'),
      type: 'overpacked_day',
      severity: 'warning',
      message: `Day ${day.dayNumber}: 활동시간이 ${Math.round(activeMinutes / 60)}시간으로 과도합니다.`,
      dayNumber: day.dayNumber,
      itemIds: sorted.map((i) => i.id),
    });
  }

  // 휴식시간 부족 (고강도 활동 2개 이상 + 휴식 없음)
  const highLoad = sorted.filter((i) => i.physicalLoad === 'high').length;
  const hasRest = sorted.some((i) => i.type === 'rest');
  if (highLoad >= 2 && !hasRest) {
    issues.push({
      id: uid('vi'),
      type: 'insufficient_rest',
      severity: 'warning',
      message: `Day ${day.dayNumber}: 체력 소모가 큰 일정이 연속되는데 휴식이 없습니다.`,
      dayNumber: day.dayNumber,
      itemIds: sorted.filter((i) => i.physicalLoad === 'high').map((i) => i.id),
    });
  }

  // 아동 연령 제한
  for (const item of sorted) {
    if (item.offer?.kind === 'activity' && item.offer.minAge !== undefined && item.offer.minAge > 6) {
      issues.push({
        id: uid('vi'),
        type: 'child_age_restriction',
        severity: 'warning',
        message: `"${item.title}"은 최소 연령 ${item.offer.minAge}세 제한이 있습니다.`,
        dayNumber: day.dayNumber,
        itemIds: [item.id],
      });
    }
  }

  return issues;
}

function validateHotelTimes(itinerary: Itinerary): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const day of itinerary.days) {
    for (const item of day.items) {
      if (item.type === 'checkin' && toMinutes(item.startTime) < CHECKIN_HOUR * 60) {
        issues.push({
          id: uid('vi'),
          type: 'arrival_before_checkin',
          severity: 'warning',
          message: `Day ${day.dayNumber}: 체크인 시각(15:00) 전에 호텔에 도착합니다. 짐 보관을 요청하세요.`,
          dayNumber: day.dayNumber,
          itemIds: [item.id],
        });
      }
      if (item.type === 'checkout' && itemEnd(item) > CHECKOUT_HOUR * 60 + 60) {
        issues.push({
          id: uid('vi'),
          type: 'room_after_checkout',
          severity: 'warning',
          message: `Day ${day.dayNumber}: 체크아웃(11:00) 이후 객실 이용이 계획되어 있습니다.`,
          dayNumber: day.dayNumber,
          itemIds: [item.id],
        });
      }
      // 항공 도착 vs 교통편 충돌
      if (item.type === 'transport' && item.offer?.kind === 'transport') {
        const flight = day.items.find((i) => i.type === 'flight');
        if (flight && toMinutes(item.startTime) < itemEnd(flight) + 40) {
          issues.push({
            id: uid('vi'),
            type: 'flight_transport_conflict',
            severity: 'critical',
            message: `Day ${day.dayNumber}: 항공 도착 후 입국심사 시간을 고려하면 픽업 시각이 너무 이릅니다.`,
            dayNumber: day.dayNumber,
            itemIds: [flight.id, item.id],
          });
        }
      }
    }
  }
  return issues;
}

function validateBudget(itinerary: Itinerary, budgetLimit: number): ValidationIssue[] {
  let total = 0;
  for (const day of itinerary.days) {
    for (const item of day.items) {
      total += item.price?.amount.amount ?? 0;
    }
  }
  if (total > budgetLimit) {
    return [
      {
        id: uid('vi'),
        type: 'budget_exceeded',
        severity: 'critical',
        message: `총비용이 예산을 ${(total - budgetLimit).toLocaleString('ko-KR')}원 초과합니다.`,
        itemIds: [],
      },
    ];
  }
  return [];
}
