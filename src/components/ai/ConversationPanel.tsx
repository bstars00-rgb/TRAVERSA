import { useEffect, useRef, useState } from 'react';
import { Loader2, Mic, Paperclip, Plus, SendHorizonal, Sparkles } from 'lucide-react';
import { useConversationStore } from '../../stores/useConversationStore';
import { useTripStore } from '../../stores/useTripStore';
import { useUIStore } from '../../stores/useUIStore';
import { SourceTag, IconButton, ConfirmDialog } from '../shared';
import { TaskProgress } from './TaskProgress';
import { AgentActivityStrip } from './AgentActivityStrip';

const WELCOME_STARTERS = [
  '부모님과 많이 걷지 않는 일본 온천여행',
  '6세 아이와 싱가포르 4박 가족여행',
  '혼자 조용히 쉬고 오는 방콕 2박',
];

export function ConversationPanel() {
  const { messages, busy, sendUserMessage, startNewTrip } = useConversationStore();
  const confidence = useTripStore((s) => s.intent.confidenceScore);
  const pushToast = useUIStore((s) => s.pushToast);
  const [input, setInput] = useState('');
  const [confirmNewTrip, setConfirmNewTrip] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, busy]);

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput('');
    void sendUserMessage(trimmed);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-ink-100 px-4 py-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-700">여행 상담</h2>
          <button
            onClick={() => setConfirmNewTrip(true)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50 cursor-pointer"
          >
            <Plus size={12} /> 새 여행 시작
          </button>
        </div>
        {messages.length > 0 && confidence < 1 && (
          <div className="mt-1.5 flex items-center gap-2" aria-label="여행 조건 파악 진행도">
            <span className="text-xs text-ink-400">여행 조건 파악</span>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-ink-100">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-500"
                style={{ width: `${Math.round(confidence * 100)}%` }}
              />
            </div>
            <span className="text-xs tabular-nums text-ink-400">{Math.round(confidence * 100)}%</span>
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {messages.length === 0 && (
          <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50/60 p-4 text-center">
            <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-brand-700 text-white">
              <Sparkles size={17} />
            </span>
            <p className="mt-2.5 text-base font-semibold text-ink-800">안녕하세요, 여행 컨설턴트예요 🙂</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-500">
              누구와, 언제쯤, 어떤 여행을 하고 싶은지
              <br />
              편하게 말씀해주세요. 나머지는 제가 찾아드릴게요.
            </p>
            <div className="mt-3 flex flex-col gap-1.5">
              {WELCOME_STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  className="rounded-xl border border-brand-200 bg-white px-3.5 py-2.5 text-sm text-brand-700 transition-colors hover:bg-brand-100 cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        <ul className="space-y-3">
          {messages.map((msg) => (
            <li key={msg.id} className={msg.role === 'user' ? 'flex justify-end' : 'flex items-start gap-2'}>
              {msg.role === 'assistant' && (
                <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white" aria-hidden>
                  <Sparkles size={11} />
                </span>
              )}
              <div
                className={`max-w-[92%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'rounded-br-sm bg-brand-700 text-white'
                    : 'rounded-bl-sm border border-ink-100 bg-white text-ink-700'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="mb-1.5">
                    <SourceTag source={msg.sourceType} />
                  </div>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.tasks && msg.tasks.length > 0 && <TaskProgress tasks={msg.tasks} />}
                {msg.quickReplies && msg.quickReplies.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {msg.quickReplies.map((q) => (
                      <button
                        key={q}
                        onClick={() => submit(q)}
                        className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm text-brand-700 hover:bg-brand-100 cursor-pointer"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
        {busy && (
          <div className="mt-3 flex items-center gap-2 px-1 text-xs text-ink-400" role="status">
            <Loader2 size={13} className="animate-spin" /> AI가 작업 중입니다…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <AgentActivityStrip />

      <form
        className="border-t border-ink-100 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
      >
        <div className="flex items-end gap-1.5 rounded-xl border border-ink-200 bg-white p-1.5 focus-within:border-brand-500">
          <IconButton label="이미지/문서 첨부 (프로토타입에서는 미지원)" onClick={() => pushToast('info', '첨부 기능은 프로토타입에서 지원되지 않습니다')} type="button">
            <Paperclip size={15} />
          </IconButton>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit(input);
              }
            }}
            rows={1}
            placeholder="여행 요청이나 일정 수정을 입력하세요"
            aria-label="메시지 입력"
            className="max-h-28 flex-1 resize-none bg-transparent px-1 py-2 text-[15px] outline-none placeholder:text-ink-400"
          />
          <IconButton label="음성 입력 (프로토타입에서는 미지원)" onClick={() => pushToast('info', '음성 입력은 프로토타입에서 지원되지 않습니다')} type="button">
            <Mic size={15} />
          </IconButton>
          <button
            type="submit"
            disabled={busy || input.trim().length === 0}
            aria-label="메시지 보내기"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-700 text-white transition-colors hover:bg-brand-600 disabled:bg-ink-200 cursor-pointer disabled:cursor-not-allowed"
          >
            <SendHorizonal size={15} />
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmNewTrip}
        title="새 여행 시작"
        message="현재 대화, 검색 결과, 일정이 모두 초기화됩니다. 계속할까요?"
        confirmLabel="새로 시작"
        danger
        onConfirm={() => {
          startNewTrip();
          setConfirmNewTrip(false);
        }}
        onCancel={() => setConfirmNewTrip(false)}
      />
    </div>
  );
}
