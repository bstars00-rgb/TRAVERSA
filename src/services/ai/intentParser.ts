import type { IntentField, TripIntent, TravelerType } from '../../types';

/**
 * 규칙 기반 Mock 의도 파서.
 * 실제 LLM으로 교체할 때는 AIProvider 구현만 바꾸면 된다 — 반환 계약은 동일하다.
 */

export function emptyIntent(): TripIntent {
  return {
    possibleDestinations: [],
    travelerTypes: [],
    currency: 'KRW',
    interests: [],
    accommodationPreferences: [],
    transportationPreferences: [],
    foodPreferences: [],
    accessibilityNeeds: [],
    constraints: [],
    missingInformation: ['dateRange', 'origin', 'travelers', 'budget'],
    confidenceScore: 0,
  };
}

const CURRENT_YEAR = 2026;

export function parseUserInput(input: string, current: TripIntent): TripIntent {
  const next: TripIntent = {
    ...current,
    possibleDestinations: [...current.possibleDestinations],
    travelerTypes: [...current.travelerTypes],
    interests: [...current.interests],
    accommodationPreferences: [...current.accommodationPreferences],
    transportationPreferences: [...current.transportationPreferences],
    foodPreferences: [...current.foodPreferences],
    accessibilityNeeds: [...current.accessibilityNeeds],
    constraints: [...current.constraints],
  };

  parseDestination(input, next);
  parseDates(input, next);
  parseTravelers(input, next);
  parseBudget(input, next);
  parsePreferences(input, next);
  parseOrigin(input, next);

  next.missingInformation = computeMissing(next);
  next.confidenceScore = computeConfidence(next);
  return next;
}

function pushUnique(arr: string[], value: string): void {
  if (!arr.includes(value)) arr.push(value);
}

function parseDestination(input: string, intent: TripIntent): void {
  if (/하코네/.test(input)) pushUnique(intent.possibleDestinations, 'hakone');
  if (/유후인/.test(input)) pushUnique(intent.possibleDestinations, 'yufuin');
  if (/기노사키/.test(input)) pushUnique(intent.possibleDestinations, 'kinosaki');
  if (/싱가포르|싱가폴/.test(input)) pushUnique(intent.possibleDestinations, 'singapore');
  if (/방콕|태국/.test(input)) pushUnique(intent.possibleDestinations, 'bangkok');
  if (/일본/.test(input) && intent.possibleDestinations.length === 0) {
    // 온천 키워드가 있으면 온천 목적지 후보를 제시
    if (/온천/.test(input)) {
      intent.possibleDestinations.push('hakone', 'yufuin', 'kinosaki');
    } else {
      intent.possibleDestinations.push('hakone');
    }
  }
}

function parseDates(input: string, intent: TripIntent): void {
  const nightMatch = input.match(/(\d+)\s*박/);
  if (nightMatch) intent.duration = Number(nightMatch[1]);

  const monthMatch = input.match(/(\d{1,2})\s*월/);
  if (monthMatch) {
    const month = Number(monthMatch[1]);
    const dayMatch = input.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
    const startDay = dayMatch ? Number(dayMatch[2]) : 14;
    const nights = intent.duration ?? 4;
    const start = new Date(Date.UTC(CURRENT_YEAR, month - 1, startDay));
    const end = new Date(start.getTime() + nights * 86_400_000);
    intent.dateRange = {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
      flexible: !dayMatch,
    };
  } else if (intent.duration && !intent.dateRange) {
    // 기간만 알고 날짜는 미정
    intent.dateRange = undefined;
  }
}

function parseTravelers(input: string, intent: TripIntent): void {
  const types: TravelerType[] = [...intent.travelerTypes];
  const add = (t: TravelerType) => {
    types.push(t);
  };

  if (/부모님|어머니|아버지/.test(input) && !types.includes('senior')) {
    add('senior');
    add('senior');
    if (!types.includes('adult')) add('adult');
    pushUnique(intent.constraints, '시니어 동반 — 이동 부담 최소화');
  }
  if (/아이|아들|딸|자녀|(\d+)\s*세/.test(input) && !types.includes('child')) {
    add('child');
    if (!types.filter((t) => t === 'adult').length) {
      add('adult');
      add('adult');
    }
    const ageMatch = input.match(/(\d+)\s*세/);
    if (ageMatch) pushUnique(intent.constraints, `아이 나이 ${ageMatch[1]}세`);
  }
  if (/혼자|나 홀로|솔로/.test(input)) {
    types.length = 0;
    add('adult');
  }
  const countMatch = input.match(/(\d+)\s*명/);
  if (countMatch && types.length === 0) {
    const n = Number(countMatch[1]);
    for (let i = 0; i < n; i++) add('adult');
  }

  if (types.length > 0) {
    intent.travelerTypes = types;
    intent.travelers = types.length;
  }
}

function parseBudget(input: string, intent: TripIntent): void {
  const manMatch = input.match(/(\d+(?:,\d{3})*)\s*만\s*원/);
  if (manMatch) {
    intent.budget = Number(manMatch[1].replace(/,/g, '')) * 10_000;
    intent.currency = 'KRW';
    if (/항공\s*(제외|빼고|별도)/.test(input)) {
      pushUnique(intent.constraints, '예산은 항공 제외 기준');
    }
  }
}

function parsePreferences(input: string, intent: TripIntent): void {
  if (/걷지 않|걷는 걸 싫|무리하지 않|많이 안 걷/.test(input)) {
    pushUnique(intent.accessibilityNeeds, '도보 이동 최소화');
    intent.pace = 'relaxed';
  }
  if (/여유|느긋|쉬고|휴식|쉬기/.test(input)) intent.pace = 'relaxed';
  if (/알차게|빡빡|많이 보고/.test(input)) intent.pace = 'packed';
  if (/온천/.test(input)) {
    pushUnique(intent.interests, '온천');
    pushUnique(intent.accommodationPreferences, '온천 료칸 또는 대욕장 보유');
  }
  if (/음식|미식|맛집|먹/.test(input)) {
    pushUnique(intent.interests, '미식');
    pushUnique(intent.foodPreferences, '현지 음식');
  }
  if (/쇼핑/.test(input)) pushUnique(intent.interests, '쇼핑');
  if (/테마파크|유니버설|놀이공원/.test(input)) pushUnique(intent.interests, '테마파크');
  if (/스파|마사지/.test(input)) pushUnique(intent.interests, '스파/휴식');
  if (/수영장|풀/.test(input)) pushUnique(intent.accommodationPreferences, '수영장');
  if (/조식/.test(input)) pushUnique(intent.accommodationPreferences, '조식 포함');
  if (/역에서 가깝|역 근처|이동 편/.test(input)) {
    pushUnique(intent.accommodationPreferences, '역/교통 인접');
  }
}

function parseOrigin(input: string, intent: TripIntent): void {
  if (/인천|서울/.test(input)) intent.origin = 'ICN 인천';
  if (/부산|김해/.test(input)) intent.origin = 'PUS 김해';
  if (/호찌민|호치민/.test(input)) {
    intent.origin = 'SGN 호찌민';
    if (/출장/.test(input)) pushUnique(intent.constraints, '출장 연계 — 호찌민 출발');
  }
}

const PRIORITY: IntentField[] = ['dateRange', 'origin', 'travelers', 'budget', 'constraints', 'interests'];

export function computeMissing(intent: TripIntent): IntentField[] {
  const missing: IntentField[] = [];
  if (!intent.dateRange && !intent.duration) missing.push('dateRange');
  if (!intent.origin) missing.push('origin');
  if (!intent.travelers) missing.push('travelers');
  if (!intent.budget) missing.push('budget');
  if (intent.possibleDestinations.length === 0) missing.push('destination');
  return missing.sort((a, b) => PRIORITY.indexOf(a) - PRIORITY.indexOf(b));
}

export function computeConfidence(intent: TripIntent): number {
  let score = 0;
  if (intent.possibleDestinations.length > 0) score += 0.2;
  if (intent.dateRange || intent.duration) score += 0.2;
  if (intent.travelers) score += 0.2;
  if (intent.budget) score += 0.2;
  if (intent.interests.length > 0) score += 0.1;
  if (intent.origin) score += 0.1;
  return Math.round(score * 100) / 100;
}
