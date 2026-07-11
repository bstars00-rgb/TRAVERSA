let counter = 0;

/** 짧은 고유 ID — 렌더 키와 로그 참조용 */
export function uid(prefix = 'id'): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}`;
}
