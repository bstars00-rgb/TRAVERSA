import { create } from 'zustand';
import type { MCPToolCall, MCPToolResult, SupplierHealth } from '../types';
import { travelGateway } from '../services/mcp/gateway';
import { uid } from '../utils/id';

interface SupplierState {
  health: SupplierHealth[];
  recentCalls: MCPToolCall[];
  recentResults: MCPToolResult<unknown>[];
  refreshHealth: () => void;
}

export const useSupplierStore = create<SupplierState>()((set) => ({
  health: travelGateway.getSupplierHealth(),
  recentCalls: [],
  recentResults: [],
  refreshHealth: () => set({ health: travelGateway.getSupplierHealth() }),
}));

// 게이트웨이 이벤트를 스토어에 연결 — /mcp-monitor 가 실시간으로 본다
travelGateway.subscribe({
  onToolCall: (toolName, supplierId, requestId) => {
    const call: MCPToolCall = {
      id: uid('mcpcall'),
      toolName,
      supplierId,
      requestId,
      startedAt: new Date().toISOString(),
      inputSummary: `${toolName} 호출`,
    };
    useSupplierStore.setState((s) => ({ recentCalls: [call, ...s.recentCalls].slice(0, 100) }));
  },
  onToolResult: (result) => {
    useSupplierStore.setState((s) => ({
      recentResults: [result, ...s.recentResults].slice(0, 100),
      health: travelGateway.getSupplierHealth(),
    }));
  },
});
