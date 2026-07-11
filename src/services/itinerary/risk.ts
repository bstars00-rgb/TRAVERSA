import type { Itinerary, RiskAlert } from '../../types';
import { uid } from '../../utils/id';

/** 일정 기반 리스크 평가 — 날씨 민감도, 가격 만료, 매핑 신뢰도 등 */
export function assessItineraryRisk(itinerary: Itinerary): RiskAlert[] {
  const alerts: RiskAlert[] = [];
  const now = new Date();

  for (const day of itinerary.days) {
    const weatherSensitive = day.items.filter((i) => i.weatherSensitive);
    if (weatherSensitive.length >= 2) {
      alerts.push({
        id: uid('risk'),
        severity: 'info',
        category: 'weather',
        message: `Day ${day.dayNumber}은 야외 일정이 ${weatherSensitive.length}개입니다. 우천 시 대체 일정을 준비하세요.`,
        createdAt: now.toISOString(),
      });
    }
    for (const item of day.items) {
      const offer = item.offer;
      if (!offer) continue;
      if (offer.kind === 'hotel' && offer.roomMappingConfidence < 0.75) {
        alerts.push({
          id: uid('risk'),
          severity: 'warning',
          category: 'room_mapping',
          message: `"${item.title}"의 객실 매핑 신뢰도가 낮습니다 (${Math.round(offer.roomMappingConfidence * 100)}%).`,
          relatedItemId: item.id,
          createdAt: now.toISOString(),
        });
      }
      const expiresIn = new Date(offer.expiresAt).getTime() - now.getTime();
      if (expiresIn > 0 && expiresIn < 20 * 60_000) {
        alerts.push({
          id: uid('risk'),
          severity: 'warning',
          category: 'price_expiring',
          message: `"${item.title}"의 가격 보장이 ${Math.round(expiresIn / 60_000)}분 후 만료됩니다.`,
          relatedItemId: item.id,
          createdAt: now.toISOString(),
        });
      }
      if (offer.availabilityStatus === 'last_room') {
        alerts.push({
          id: uid('risk'),
          severity: 'warning',
          category: 'last_room',
          message: `"${item.title}"은 마지막 객실일 가능성이 있습니다.`,
          relatedItemId: item.id,
          createdAt: now.toISOString(),
        });
      }
    }
  }
  return alerts;
}
