import { format, parseISO, differenceInMinutes } from 'date-fns';
import { ko } from 'date-fns/locale';

export function formatDate(iso: string): string {
  return format(parseISO(iso), 'M월 d일 (EEE)', { locale: ko });
}

export function formatDateTime(iso: string): string {
  return format(parseISO(iso), 'M월 d일 HH:mm', { locale: ko });
}

export function formatTimeAgo(iso: string): string {
  const mins = differenceInMinutes(new Date(), parseISO(iso));
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return formatDateTime(iso);
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

/** 여행자 실명 마스킹 — 이벤트 로그에 원문 기록 금지 */
export function maskName(name: string): string {
  if (name.length <= 1) return '*';
  return name[0] + '*'.repeat(Math.max(1, name.length - 1));
}
