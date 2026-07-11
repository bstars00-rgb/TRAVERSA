import { describe, expect, it } from 'vitest';
import { emptyIntent, parseUserInput } from './intentParser';

describe('TripIntent 업데이트 (규칙 기반 Mock 파서)', () => {
  it('시나리오 A: 부모님 일본 온천여행 요청을 파싱한다', () => {
    const intent = parseUserInput(
      '8월에 부모님과 일본에 5박 6일로 가고 싶어. 많이 걷지 않고 온천과 좋은 음식을 즐기고 싶어. 전체 예산은 항공 제외 300만 원 정도야.',
      emptyIntent(),
    );
    expect(intent.duration).toBe(5);
    expect(intent.dateRange?.start).toMatch(/^2026-08/);
    expect(intent.travelers).toBe(3);
    expect(intent.travelerTypes).toContain('senior');
    expect(intent.budget).toBe(3_000_000);
    expect(intent.possibleDestinations).toContain('hakone');
    expect(intent.interests).toContain('온천');
    expect(intent.accessibilityNeeds).toContain('도보 이동 최소화');
    expect(intent.constraints).toContain('예산은 항공 제외 기준');
    expect(intent.pace).toBe('relaxed');
  });

  it('시나리오 B: 아이 동반 싱가포르 여행을 파싱한다', () => {
    const intent = parseUserInput('7월 말에 6세 아이와 싱가포르로 4박 가족여행을 가려고 해.', emptyIntent());
    expect(intent.possibleDestinations).toContain('singapore');
    expect(intent.travelerTypes).toContain('child');
    expect(intent.travelers).toBe(3);
    expect(intent.duration).toBe(4);
    expect(intent.constraints.some((c) => c.includes('6세'))).toBe(true);
  });

  it('시나리오 C: 출장 연계 방콕 휴식여행을 파싱한다', () => {
    const intent = parseUserInput(
      '호찌민 출장이 끝나고 방콕에서 2박 정도 혼자 쉬다 가고 싶어. 스파랑 좋은 음식이면 충분해.',
      emptyIntent(),
    );
    expect(intent.origin).toBe('SGN 호찌민');
    expect(intent.possibleDestinations).toContain('bangkok');
    expect(intent.duration).toBe(2);
    expect(intent.travelers).toBe(1);
    expect(intent.interests).toContain('스파/휴식');
  });

  it('대화가 이어지면 기존 조건 위에 누적 갱신한다', () => {
    let intent = parseUserInput('부모님과 일본 온천 5박', emptyIntent());
    expect(intent.budget).toBeUndefined();
    intent = parseUserInput('예산은 300만 원이고 인천에서 출발해', intent);
    expect(intent.budget).toBe(3_000_000);
    expect(intent.origin).toBe('ICN 인천');
    // 기존 정보 유지
    expect(intent.duration).toBe(5);
    expect(intent.travelerTypes).toContain('senior');
  });

  it('부족한 정보는 우선순위 순으로 missingInformation에 나열한다', () => {
    const intent = parseUserInput('일본 온천 가고 싶어', emptyIntent());
    expect(intent.missingInformation[0]).toBe('dateRange');
    expect(intent.missingInformation).toContain('budget');
    expect(intent.missingInformation).toContain('travelers');
  });

  it('정보가 쌓일수록 confidenceScore가 올라간다', () => {
    const partial = parseUserInput('일본 온천', emptyIntent());
    const full = parseUserInput(
      '8월에 부모님과 일본 온천 5박, 예산 300만 원, 인천 출발',
      emptyIntent(),
    );
    expect(full.confidenceScore).toBeGreaterThan(partial.confidenceScore);
  });
});
