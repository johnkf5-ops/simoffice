/**
 * SimOffice Analytics — Usage, spending, and agent metrics.
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BuddyPanel } from '@/components/common/BuddyPanel';
import { useAgentsStore } from '@/stores/agents';
import { useGatewayStore } from '@/stores/gateway';
import { createGatewayClient } from '@/lib/gateway/GatewayClient';
import { createStudioSettingsCoordinator } from '@/lib/studio/coordinator';
import { useOfficeUsageAnalyticsViewModel } from '@/features/office/hooks/useOfficeUsageAnalyticsViewModel';
import {
  formatCurrency,
  formatNumber,
  toDateInputValue,
} from '@/lib/office/usageAnalyticsPresentation';
import type { AgentState } from '@/features/agents/state/store';

function toAgentState(agent: { id: string; name: string; mainSessionKey: string }): AgentState {
  return {
    agentId: agent.id,
    name: agent.name || 'Unknown',
    sessionKey: agent.mainSessionKey || `agent:${agent.id}:main`,
    status: 'idle',
    runId: null,
    runStartedAt: null,
    lastUserMessage: null,
    lastActivityAt: null,
    lastAssistantMessageAt: null,
    thinkingTrace: null,
    streamText: null,
    latestPreview: null,
    outputLines: [],
    transcriptEntries: [],
    sessionCreated: true,
    awaitingUserInput: false,
    hasUnseenActivity: false,
    lastResult: null,
    lastDiff: null,
    latestOverride: null,
    latestOverrideKind: null,
    draft: '',
  };
}

const [gatewayClient] = [createGatewayClient()];
const [settingsCoordinator] = [createStudioSettingsCoordinator()];

export function LobbyAnalytics() {
  const navigate = useNavigate();
  const agents = useAgentsStore((s) => s.agents);
  const gatewayStatus = useGatewayStore((s) => s.status);
  const isOnline = gatewayStatus.state === 'running';

  const agentStates = useMemo(
    () => (agents ?? []).map(a => toAgentState(a)),
    [agents],
  );

  const { usage, startDate, endDate, setStartDate, setEndDate, budgets, updateBudget } =
    useOfficeUsageAnalyticsViewModel({
      client: gatewayClient,
      status: isOnline ? 'connected' : 'disconnected',
      agents: agentStates,
      gatewayUrl: '',
      settingsCoordinator,
    });

  const recentCostDaily = useMemo(() => usage.costDaily.slice(-14), [usage.costDaily]);
  const chartMax = useMemo(
    () => recentCostDaily.reduce((max, e) => Math.max(max, e.totalCost), 0),
    [recentCostDaily],
  );

  const selectedRangeLabel = useMemo(() => {
    const now = new Date();
    const end = toDateInputValue(now);
    const lastWeek = new Date(now); lastWeek.setDate(lastWeek.getDate() - 6);
    const lastMonth = new Date(now); lastMonth.setDate(lastMonth.getDate() - 29);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    if (startDate === toDateInputValue(lastWeek) && endDate === end) return '7D';
    if (startDate === toDateInputValue(lastMonth) && endDate === end) return '30D';
    if (startDate === toDateInputValue(monthStart) && endDate === end) return 'MTD';
    return 'Custom';
  }, [endDate, startDate]);

  const setQuickRange = (days: number | 'mtd') => {
    const end = new Date();
    const start = new Date(end);
    if (days === 'mtd') { start.setDate(1); } else { start.setDate(start.getDate() - (days - 1)); }
    setStartDate(toDateInputValue(start));
    setEndDate(toDateInputValue(end));
  };

  return (
    <div style={{ display: 'flex', height: '100%' }}>

      <BuddyPanel currentPage="/analytics" />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'hsl(var(--background))' }}>

        {/* Section Header */}
        <div style={{
          padding: '32px 40px 24px 40px',
          background: 'linear-gradient(135deg, #ea580c 0%, #fb923c 50%, #fed7aa 100%)',
        }}>
          <button onClick={() => navigate('/')}
            style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 12, fontFamily: 'Inter, sans-serif' }}>
            &larr; Back to Lobby
          </button>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: 'white', fontFamily: 'Space Grotesk, sans-serif', margin: 0 }}>
            Analytics
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', marginTop: 6, fontFamily: 'Inter, sans-serif' }}>
            Usage, spending, and agent metrics
          </p>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 40px 40px 40px' }}>

          {!isOnline && (
            <div style={{
              padding: 20, borderRadius: 12, marginBottom: 24,
              background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))',
              fontSize: 14, textAlign: 'center',
            }}>
              Start the engine to view analytics
            </div>
          )}

          {/* Date Range + Quick Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            {(['7D', '30D', 'MTD'] as const).map((label) => (
              <button
                key={label}
                onClick={() => setQuickRange(label === '7D' ? 7 : label === '30D' ? 30 : 'mtd')}
                style={{
                  padding: '6px 16px', borderRadius: 8, border: '1px solid',
                  borderColor: selectedRangeLabel === label ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                  background: selectedRangeLabel === label ? 'hsl(var(--accent))' : 'transparent',
                  color: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'Space Grotesk, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                {label}
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', fontSize: 12 }} />
            <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: 12 }}>to</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', fontSize: 12 }} />
            <button onClick={() => void usage.refresh()}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
              {usage.loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {usage.error && (
            <div style={{
              padding: 16, borderRadius: 12, marginBottom: 24,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#f87171', fontSize: 13,
            }}>
              {usage.error}
            </div>
          )}

          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
            {[
              { label: 'Total Spend', value: formatCurrency(usage.totals.totalCost) },
              { label: 'Total Tokens', value: formatNumber(usage.totals.totalTokens) },
              { label: 'Sessions', value: formatNumber(usage.sessions.length) },
              { label: 'Messages', value: formatNumber(usage.aggregates.messages.total) },
              { label: 'Tool Calls', value: formatNumber(usage.aggregates.tools.totalCalls) },
              { label: 'Errors', value: formatNumber(usage.aggregates.messages.errors) },
            ].map((card) => (
              <div key={card.label} style={{
                background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
                borderRadius: 12, padding: 20,
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {card.label}
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'hsl(var(--foreground))', fontFamily: 'Space Grotesk, sans-serif', marginTop: 8 }}>
                  {card.value}
                </div>
              </div>
            ))}
          </div>

          {/* Daily Cost Chart */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(var(--foreground))', marginBottom: 16 }}>
              Daily Spend
            </h2>
            {recentCostDaily.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: 13 }}>
                {usage.loading ? 'Loading...' : 'No spend data for this date range'}
              </div>
            ) : (
              <div style={{
                background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
                borderRadius: 12, padding: 24,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 140 }}>
                  {recentCostDaily.map((entry) => {
                    const heightPct = chartMax > 0 ? (entry.totalCost / chartMax) * 100 : 0;
                    return (
                      <div key={entry.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ fontSize: 9, color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>
                          {formatCurrency(entry.totalCost)}
                        </div>
                        <div style={{
                          width: '100%', maxWidth: 40, borderRadius: 4,
                          height: `${Math.max(heightPct, 2)}%`,
                          background: 'linear-gradient(to top, #ea580c, #fb923c)',
                          transition: 'height 0.3s ease',
                        }} />
                        <div style={{ fontSize: 9, color: 'hsl(var(--muted-foreground))' }}>
                          {entry.date.slice(5)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Input', value: formatCurrency(usage.totals.inputCost) },
                    { label: 'Output', value: formatCurrency(usage.totals.outputCost) },
                    { label: 'Cache Read', value: formatCurrency(usage.totals.cacheReadCost) },
                    { label: 'Cache Write', value: formatCurrency(usage.totals.cacheWriteCost) },
                  ].map((item) => (
                    <div key={item.label} style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
                      <span style={{ fontWeight: 600 }}>{item.label}:</span> {item.value}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Top Agents + Model Breakdown side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 32 }}>

            {/* Top Agents */}
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(var(--foreground))', marginBottom: 16 }}>
                Top Agents by Spend
              </h2>
              <div style={{
                background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
                borderRadius: 12, overflow: 'hidden',
              }}>
                {usage.aggregates.byAgent.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: 13 }}>No agent data</div>
                ) : (
                  usage.aggregates.byAgent.slice(0, 8).map((agent, i) => (
                    <div key={agent.agentId} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px 20px',
                      borderBottom: i < Math.min(usage.aggregates.byAgent.length, 8) - 1 ? '1px solid hsl(var(--border))' : 'none',
                    }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                        {agent.agentName || agent.agentId}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#ea580c', fontFamily: 'Space Grotesk, sans-serif' }}>
                        {formatCurrency(agent.totals.totalCost)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Model Breakdown */}
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(var(--foreground))', marginBottom: 16 }}>
                Models Used
              </h2>
              <div style={{
                background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
                borderRadius: 12, overflow: 'hidden',
              }}>
                {usage.aggregates.byModel.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: 13 }}>No model data</div>
                ) : (
                  usage.aggregates.byModel.slice(0, 8).map((model, i) => (
                    <div key={`${model.provider}-${model.model}`} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px 20px',
                      borderBottom: i < Math.min(usage.aggregates.byModel.length, 8) - 1 ? '1px solid hsl(var(--border))' : 'none',
                    }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                          {model.model || 'Unknown'}
                        </div>
                        {model.provider && (
                          <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>{model.provider}</div>
                        )}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#ea580c', fontFamily: 'Space Grotesk, sans-serif' }}>
                        {formatCurrency(model.totals.totalCost)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Budget Limits */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(var(--foreground))', marginBottom: 16 }}>
              Budget Limits
            </h2>
            <div style={{
              background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
              borderRadius: 12, padding: 24,
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {[
                  { label: 'Daily Limit (USD)', key: 'dailySpendLimitUsd' as const, value: budgets.dailySpendLimitUsd },
                  { label: 'Monthly Limit (USD)', key: 'monthlySpendLimitUsd' as const, value: budgets.monthlySpendLimitUsd },
                  { label: 'Per-Agent Limit (USD)', key: 'perAgentSoftLimitUsd' as const, value: budgets.perAgentSoftLimitUsd },
                  { label: 'Alert Threshold (%)', key: 'alertThresholdPct' as const, value: budgets.alertThresholdPct },
                ].map((field) => (
                  <div key={field.key}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                      {field.label}
                    </label>
                    <input
                      type="number"
                      value={field.value ?? ''}
                      placeholder={field.key === 'alertThresholdPct' ? '80' : 'No limit'}
                      onChange={(e) => {
                        const v = e.target.value.trim();
                        updateBudget(field.key, v === '' ? null : Number(v));
                      }}
                      style={{
                        width: '100%', padding: '8px 12px', borderRadius: 8,
                        border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))',
                        color: 'hsl(var(--foreground))', fontSize: 14,
                      }}
                    />
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', marginTop: 12 }}>
                Budget limits are stored locally. Alerts appear when spending approaches the threshold.
              </p>
            </div>
          </div>

          {/* Budget Alerts */}
          {usage.budgetAlerts.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              {usage.budgetAlerts.map((alert, i) => (
                <div key={i} style={{
                  padding: 16, borderRadius: 12, marginBottom: 8,
                  background: alert.severity === 'danger' ? 'rgba(239,68,68,0.1)' : 'rgba(234,179,8,0.1)',
                  border: `1px solid ${alert.severity === 'danger' ? 'rgba(239,68,68,0.2)' : 'rgba(234,179,8,0.2)'}`,
                  color: alert.severity === 'danger' ? '#f87171' : '#fbbf24',
                  fontSize: 13, fontWeight: 600,
                }}>
                  {alert.label}: {formatCurrency(alert.currentUsd)} / {formatCurrency(alert.limitUsd)}
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
