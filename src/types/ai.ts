import type { DataSourceType } from './common';
import type { TripIntent } from './trip';

export type MessageRole = 'user' | 'assistant' | 'system';

export type TaskState = 'pending' | 'running' | 'success' | 'slow' | 'failed';

/** AI 메시지 아래 표시되는 작업 상태 (단순 스피너 금지) */
export interface AITask {
  id: string;
  label: string;
  state: TaskState;
  detail?: string;
}

export interface AIMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  sourceType: DataSourceType;
  tasks?: AITask[];
  /** 이 메시지로 갱신된 여행 의도 */
  intentSnapshot?: TripIntent;
  quickReplies?: string[];
}

export type AgentRole =
  | 'trip_planner'
  | 'hotel_specialist'
  | 'flight_specialist'
  | 'local_experience'
  | 'budget_controller'
  | 'risk_monitor'
  | 'accessibility_planner'
  | 'booking_controller';

export interface AgentActivity {
  id: string;
  role: AgentRole;
  label: string;
  state: TaskState;
  message: string;
  updatedAt: string;
}

export type TripEventType =
  | 'TRIP_CREATED'
  | 'INTENT_UPDATED'
  | 'SEARCH_STARTED'
  | 'SUPPLIER_RESPONDED'
  | 'OFFER_SELECTED'
  | 'ITINERARY_UPDATED'
  | 'PRICE_RECHECKED'
  | 'USER_CONFIRMED'
  | 'BOOKING_PREPARED'
  | 'ERROR_OCCURRED';

export interface TripEvent {
  id: string;
  type: TripEventType;
  /** 민감정보(여행자 실명 등)는 마스킹 후 기록 */
  summary: string;
  tripId?: string;
  createdAt: string;
  meta?: Record<string, string | number | boolean>;
}

/** 실제 LLM으로 교체 가능하도록 하는 추상화 지점 */
export interface AIProvider {
  parseIntent(userInput: string, current: TripIntent): TripIntent;
  nextQuestion(intent: TripIntent): { content: string; quickReplies: string[] } | null;
  readyToSearch(intent: TripIntent): boolean;
}

export interface MonitoringAlert {
  id: string;
  category:
    | 'price_drop'
    | 'better_room'
    | 'flight_change'
    | 'policy_change'
    | 'weather'
    | 'closure'
    | 'strike'
    | 'visa';
  title: string;
  description: string;
  proposedAction: string;
  impact: string;
  status: 'pending_user' | 'approved' | 'dismissed';
  detectedAt: string;
}
