import type { AIProvider, IntentField, TripIntent } from '../../types';
import { parseUserInput } from './intentParser';
import { findDestination } from '../../data/destinations';

/**
 * Mock AI Provider — 규칙 기반.
 * 질문은 우선순위 순으로, 한 번에 최대 2개까지만 묻는다.
 */

interface QuestionTemplate {
  field: IntentField;
  question: string;
  quickReplies: string[];
}

const QUESTIONS: QuestionTemplate[] = [
  {
    field: 'dateRange',
    question: '여행 날짜나 기간이 정해져 있으신가요?',
    quickReplies: ['8월 중순 5박 6일', '9월 초 4박', '아직 미정이에요'],
  },
  {
    field: 'origin',
    question: '어디에서 출발하시나요?',
    quickReplies: ['서울(인천공항)', '부산(김해공항)'],
  },
  {
    field: 'travelers',
    question: '몇 분이 함께 가시나요? 동행자 구성도 알려주세요.',
    quickReplies: ['어른 2명', '부모님과 저 3명', '어른 2명 + 아이 1명'],
  },
  {
    field: 'budget',
    question: '전체 예산은 어느 정도로 생각하세요?',
    quickReplies: ['200만 원', '300만 원', '500만 원'],
  },
  {
    field: 'destination',
    question: '가고 싶은 지역이나 나라가 있으신가요?',
    quickReplies: ['일본 온천', '싱가포르', '방콕'],
  },
];

export class MockAIProvider implements AIProvider {
  parseIntent(userInput: string, current: TripIntent): TripIntent {
    return parseUserInput(userInput, current);
  }

  /** 부족한 정보 중 우선순위 상위 최대 2개를 하나의 메시지로 질문 */
  nextQuestion(intent: TripIntent): { content: string; quickReplies: string[] } | null {
    const targets = intent.missingInformation
      .map((f) => QUESTIONS.find((q) => q.field === f))
      .filter((q): q is QuestionTemplate => q !== undefined)
      .slice(0, 2);

    if (targets.length === 0) return null;

    const understood = summarizeUnderstanding(intent);
    const questionText = targets.map((t, i) => `${i + 1}. ${t.question}`).join('\n');
    return {
      content: `${understood}\n\n두 가지만 더 확인할게요.\n${questionText}`,
      quickReplies: targets[0].quickReplies,
    };
  }

  readyToSearch(intent: TripIntent): boolean {
    return (
      intent.possibleDestinations.length > 0 &&
      (intent.dateRange !== undefined || intent.duration !== undefined) &&
      intent.travelers !== undefined &&
      intent.budget !== undefined
    );
  }
}

export function summarizeUnderstanding(intent: TripIntent): string {
  const parts: string[] = [];
  if (intent.possibleDestinations.length > 0) {
    const names = intent.possibleDestinations
      .map((id) => findDestination(id)?.name ?? id)
      .join(', ');
    parts.push(`목적지 후보는 ${names}`);
  }
  if (intent.duration) parts.push(`${intent.duration}박 일정`);
  if (intent.travelers) parts.push(`${intent.travelers}명`);
  if (intent.budget) parts.push(`예산 약 ${(intent.budget / 10_000).toLocaleString()}만 원`);
  if (intent.interests.length > 0) parts.push(`관심사: ${intent.interests.join(', ')}`);
  if (parts.length === 0) return '요청을 확인했습니다.';
  return `지금까지 이해한 내용: ${parts.join(' · ')} 로 보고 있어요.`;
}

export const mockAI = new MockAIProvider();
