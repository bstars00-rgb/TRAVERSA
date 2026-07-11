import { describe, expect, it } from 'vitest';
import { interpretItineraryCommand } from './commands';
import { generateItinerary } from './generator';
import { emptyIntent, parseUserInput } from '../ai/intentParser';

function sampleItinerary() {
  const intent = parseUserInput('8월에 부모님과 일본 온천 5박, 예산 300만 원, 인천 출발', emptyIntent());
  return generateItinerary('trip1', intent, { activities: [] });
}

describe('자연어 일정 변경 (Mock AI 명령 해석)', () => {
  it('"둘째 날 일정을 여유롭게 바꿔줘" — 휴식이 늘어난 Diff를 만든다', () => {
    const diff = interpretItineraryCommand('둘째 날 일정을 여유롭게 바꿔줘', sampleItinerary());
    expect(diff).not.toBeNull();
    expect(diff?.changes.length).toBeGreaterThan(0);
    expect(diff?.proposedItinerary.version).toBe(2);
  });

  it('"전체 비용을 20만 원 낮춰줘" — 비용이 감소한 Diff를 만든다', () => {
    const diff = interpretItineraryCommand('전체 비용을 20만 원 낮춰줘', sampleItinerary());
    expect(diff).not.toBeNull();
    expect(diff!.costDelta.amount).toBeLessThan(0);
  });

  it('"비가 올 경우 대체 일정을 만들어줘" — 야외 일정에 대체안을 연결한다', () => {
    const diff = interpretItineraryCommand('비가 올 경우 대체 일정을 만들어줘', sampleItinerary());
    expect(diff).not.toBeNull();
    expect(
      diff!.proposedItinerary.days.some((d) => d.items.some((i) => i.alternativeOf !== undefined)),
    ).toBe(true);
  });

  it('"마지막 날 쇼핑시간을 늘려줘" — 마지막 날 쇼핑 시간을 연장한다', () => {
    const itin = sampleItinerary();
    const before = itin.days[itin.days.length - 1].items.find((i) => i.type === 'shopping');
    const diff = interpretItineraryCommand('마지막 날 쇼핑시간을 늘려줘', itin);
    const after = diff?.proposedItinerary.days[itin.days.length - 1].items.find((i) => i.type === 'shopping');
    expect(after!.durationMinutes).toBeGreaterThan(before!.durationMinutes);
  });

  it('해석할 수 없는 명령은 null을 반환한다 (일반 대화로 처리)', () => {
    expect(interpretItineraryCommand('오늘 날씨 어때?', sampleItinerary())).toBeNull();
  });

  it('원본 일정은 변경하지 않는다 (사용자 승인 전 미반영)', () => {
    const itin = sampleItinerary();
    const originalVersion = itin.version;
    const originalItemCount = itin.days[1].items.length;
    interpretItineraryCommand('둘째 날 일정을 여유롭게 바꿔줘', itin);
    expect(itin.version).toBe(originalVersion);
    expect(itin.days[1].items.length).toBe(originalItemCount);
  });
});
