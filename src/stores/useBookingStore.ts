import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AnyOffer,
  BookingItem,
  BookingPreparation,
  BookingStepId,
  ConfirmationKind,
  Itinerary,
  RecheckResult,
  Traveler,
  TripIntent,
  UserConfirmation,
} from '../types';
import { travelGateway } from '../services/mcp/gateway';
import { buildSearchRequest } from '../services/ai/searchOrchestrator';
import { comparePrices } from '../services/itinerary/budget';
import { uid } from '../utils/id';
import { maskName } from '../utils/format';
import { useTripStore } from './useTripStore';
import { persistStorage } from './storage';

export const BOOKING_STEPS: { id: BookingStepId; label: string; implemented: boolean }[] = [
  { id: 'select', label: '상품 선택', implemented: true },
  { id: 'recheck', label: '최신 가격 재조회', implemented: true },
  { id: 'availability', label: '재고 확인', implemented: true },
  { id: 'travelers', label: '여행자 정보 입력', implemented: true },
  { id: 'cancellation', label: '취소조건 확인', implemented: true },
  { id: 'terms', label: '예약조건 동의', implemented: true },
  { id: 'payment_prep', label: '결제 준비', implemented: true },
  { id: 'execute', label: '예약 실행 (예정)', implemented: false },
];

const REQUIRED_CONFIRMATIONS: { kind: ConfirmationKind; label: string }[] = [
  { kind: 'traveler_names', label: '여행자 영문명이 여권과 일치함을 확인했습니다' },
  { kind: 'dates', label: '여행 날짜를 확인했습니다' },
  { kind: 'room_and_beds', label: '객실과 침대 구성을 확인했습니다' },
  { kind: 'fare_rules', label: '항공 운임규정을 확인했습니다' },
  { kind: 'cancellation_terms', label: '각 상품의 취소조건에 동의합니다' },
  { kind: 'booking_execution', label: '예약 실행을 승인합니다' },
];

interface BookingState {
  preparation: BookingPreparation | null;
  isRechecking: boolean;
  startPreparation: (itinerary: Itinerary, intent: TripIntent) => void;
  goToStep: (step: BookingStepId) => void;
  recheckAll: () => Promise<void>;
  resolveRecheck: (bookingItemId: string, action: 'accept' | 'exclude') => void;
  updateTraveler: (traveler: Traveler) => void;
  setSpecialRequest: (bookingItemId: string, text: string) => void;
  toggleConfirmation: (kind: ConfirmationKind, snapshotSummary: string) => void;
  readiness: () => { confirmed: number; total: number; ready: boolean };
  clear: () => void;
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      preparation: null,
      isRechecking: false,

      startPreparation: (itinerary, intent) => {
        const offers: AnyOffer[] = [];
        for (const day of itinerary.days) {
          for (const item of day.items) {
            if (item.offer && !offers.some((o) => o.supplierOfferId === item.offer?.supplierOfferId)) {
              offers.push(item.offer);
            }
          }
        }
        const items: BookingItem[] = offers.map((offer) => ({
          id: uid('bk'),
          offer,
          status: 'selected',
          latestPrice: {
            amount: offer.totalPrice,
            status: 'retrieved',
            capturedAt: offer.retrievedAt,
            expiresAt: offer.expiresAt,
            supplierId: offer.supplierId,
          },
          bookedVia: offer.supplierName,
          refundableAmount: offer.cancellationPolicy.refundable
            ? offer.totalPrice
            : { amount: 0, currency: offer.totalPrice.currency },
          cancellationDeadline: offer.cancellationPolicy.freeCancellationUntil,
        }));

        const travelerCount = intent.travelers ?? 2;
        const travelers: Traveler[] = Array.from({ length: travelerCount }, (_, i) => ({
          id: uid('tv'),
          type: intent.travelerTypes[i] ?? 'adult',
          confirmedByUser: false,
        }));

        const confirmations: UserConfirmation[] = REQUIRED_CONFIRMATIONS.map((c) => ({
          id: uid('cf'),
          kind: c.kind,
          label: c.label,
          confirmed: false,
        }));

        const total = items.reduce((sum, i) => sum + i.latestPrice.amount.amount, 0);

        set({
          preparation: {
            id: uid('prep'),
            tripId: itinerary.tripId,
            currentStep: 'recheck',
            items,
            travelers,
            confirmations,
            recheckResults: [],
            riskAlerts: [],
            totalDue: { amount: total, currency: intent.currency },
            updatedAt: new Date().toISOString(),
          },
        });
        useTripStore.getState().logEvent('BOOKING_PREPARED', `예약 준비 시작 — 상품 ${items.length}개`);
      },

      goToStep: (step) =>
        set((s) =>
          s.preparation
            ? { preparation: { ...s.preparation, currentStep: step, updatedAt: new Date().toISOString() } }
            : s,
        ),

      /** 모든 상품 최신 가격 재조회 — 결과에 따라 사용자 선택지 제공 */
      recheckAll: async () => {
        const prep = get().preparation;
        if (!prep) return;
        set({ isRechecking: true });
        const intent = useTripStore.getState().intent;
        const req = buildSearchRequest(intent, prep.tripId);
        const results: RecheckResult[] = [];
        const updatedItems: BookingItem[] = [];

        for (const item of prep.items) {
          let updated = item;
          if (item.offer.kind === 'hotel' || item.offer.kind === 'flight') {
            const res =
              item.offer.kind === 'hotel'
                ? await travelGateway.recheckHotelRate(req, item.offer)
                : await travelGateway.recheckFlightOffer(req, item.offer);
            if (res.ok && res.data) {
              const fresh = res.data;
              const change = comparePrices(item.latestPrice.amount, fresh.totalPrice);
              const outcome =
                fresh.availabilityStatus === 'sold_out'
                  ? 'sold_out'
                  : change.direction === 'up'
                    ? 'price_increased'
                    : change.direction === 'down'
                      ? 'price_decreased'
                      : 'price_same';
              results.push({
                bookingItemId: item.id,
                outcome,
                previousPrice: item.latestPrice.amount,
                currentPrice: fresh.totalPrice,
                message: recheckMessage(outcome, change.percent),
                recheckedAt: new Date().toISOString(),
              });
              updated = {
                ...item,
                offer: fresh,
                status: outcome === 'sold_out' ? 'failed' : outcome === 'price_same' ? 'ready_to_book' : 'needs_attention',
                latestPrice: {
                  amount: fresh.totalPrice,
                  status: outcome === 'price_same' ? 'rechecked' : 'changed',
                  capturedAt: new Date().toISOString(),
                  expiresAt: fresh.expiresAt,
                  supplierId: fresh.supplierId,
                  previousAmount: item.latestPrice.amount,
                },
              };
            } else {
              results.push({
                bookingItemId: item.id,
                outcome: 'policy_changed',
                previousPrice: item.latestPrice.amount,
                currentPrice: item.latestPrice.amount,
                message: '공급사 재확인 실패 — 잠시 후 다시 시도하세요.',
                recheckedAt: new Date().toISOString(),
              });
              updated = { ...item, status: 'needs_attention' };
            }
          } else {
            updated = {
              ...item,
              status: 'ready_to_book',
              latestPrice: { ...item.latestPrice, status: 'rechecked', capturedAt: new Date().toISOString() },
            };
            results.push({
              bookingItemId: item.id,
              outcome: 'price_same',
              previousPrice: item.latestPrice.amount,
              currentPrice: item.latestPrice.amount,
              message: '가격 동일 — 예약 준비 완료.',
              recheckedAt: new Date().toISOString(),
            });
          }
          updatedItems.push(updated);
        }

        const total = updatedItems
          .filter((i) => i.status !== 'failed')
          .reduce((sum, i) => sum + i.latestPrice.amount.amount, 0);

        set({
          isRechecking: false,
          preparation: {
            ...prep,
            items: updatedItems,
            recheckResults: results,
            totalDue: { amount: total, currency: prep.totalDue.currency },
            currentStep: 'availability',
            updatedAt: new Date().toISOString(),
          },
        });
        useTripStore
          .getState()
          .logEvent('PRICE_RECHECKED', `가격 재확인 완료 — ${results.filter((r) => r.outcome !== 'price_same').length}건 변경`);
      },

      resolveRecheck: (bookingItemId, action) => {
        const prep = get().preparation;
        if (!prep) return;
        const items = prep.items
          .map((i) => {
            if (i.id !== bookingItemId) return i;
            if (action === 'exclude') return null;
            return {
              ...i,
              status: 'ready_to_book' as const,
              latestPrice: { ...i.latestPrice, status: 'rechecked' as const },
            };
          })
          .filter((i): i is BookingItem => i !== null);
        const total = items.reduce((sum, i) => sum + i.latestPrice.amount.amount, 0);
        set({
          preparation: { ...prep, items, totalDue: { amount: total, currency: prep.totalDue.currency }, updatedAt: new Date().toISOString() },
        });
        useTripStore
          .getState()
          .logEvent('USER_CONFIRMED', action === 'accept' ? '변경된 가격으로 계속 진행' : '가격 변경 상품 제외');
      },

      updateTraveler: (traveler) => {
        const prep = get().preparation;
        if (!prep) return;
        set({
          preparation: {
            ...prep,
            travelers: prep.travelers.map((t) => (t.id === traveler.id ? traveler : t)),
            updatedAt: new Date().toISOString(),
          },
        });
        if (traveler.confirmedByUser && traveler.englishGivenName) {
          useTripStore
            .getState()
            .logEvent('USER_CONFIRMED', `여행자 영문명 확정: ${maskName(traveler.englishGivenName)}`);
        }
      },

      setSpecialRequest: (bookingItemId, text) => {
        const prep = get().preparation;
        if (!prep) return;
        set({
          preparation: {
            ...prep,
            items: prep.items.map((i) => (i.id === bookingItemId ? { ...i, specialRequests: text } : i)),
          },
        });
      },

      toggleConfirmation: (kind, snapshotSummary) => {
        const prep = get().preparation;
        if (!prep) return;
        const confirmations = prep.confirmations.map((c) =>
          c.kind === kind
            ? {
                ...c,
                confirmed: !c.confirmed,
                confirmedAt: !c.confirmed ? new Date().toISOString() : undefined,
                snapshotSummary: !c.confirmed ? snapshotSummary : undefined,
              }
            : c,
        );
        set({ preparation: { ...prep, confirmations, updatedAt: new Date().toISOString() } });
        const target = confirmations.find((c) => c.kind === kind);
        if (target?.confirmed) {
          useTripStore.getState().logEvent('USER_CONFIRMED', `사용자 확인: ${target.label}`);
        }
      },

      readiness: () => {
        const prep = get().preparation;
        if (!prep) return { confirmed: 0, total: REQUIRED_CONFIRMATIONS.length, ready: false };
        const confirmed = prep.confirmations.filter((c) => c.confirmed).length;
        const travelersOk = prep.travelers.every((t) => t.confirmedByUser);
        const itemsOk = prep.items.length > 0 && prep.items.every((i) => i.status === 'ready_to_book');
        return {
          confirmed,
          total: prep.confirmations.length,
          ready: confirmed === prep.confirmations.length && travelersOk && itemsOk,
        };
      },

      clear: () => set({ preparation: null, isRechecking: false }),
    }),
    {
      name: 'traversa-booking',
      storage: persistStorage,
      partialize: (s) => ({ preparation: s.preparation, isRechecking: false }),
    },
  ),
);

function recheckMessage(outcome: RecheckResult['outcome'], percent: number): string {
  switch (outcome) {
    case 'price_same':
      return '가격 동일 — 그대로 진행할 수 있습니다.';
    case 'price_decreased':
      return `가격이 ${Math.abs(percent)}% 인하되었습니다.`;
    case 'price_increased':
      return `가격이 ${percent}% 상승했습니다. 진행 방법을 선택해주세요.`;
    case 'sold_out':
      return '재고가 소진되었습니다. 대체 상품 확인이 필요합니다.';
    case 'room_changed':
      return '객실 조건이 변경되었습니다.';
    case 'policy_changed':
      return '취소조건이 변경되었거나 확인에 실패했습니다.';
    case 'alternative_supplier_available':
      return '다른 공급사에서 더 나은 조건을 사용할 수 있습니다.';
  }
}
