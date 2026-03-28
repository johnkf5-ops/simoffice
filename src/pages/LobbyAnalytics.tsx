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

  const hasSpendData = usage.totals.totalCost > 0;

  return (
    <div style={{ display: 'flex', height: '100%' }}>

      <BuddyPanel currentPage="/analytics" />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'hsl(var(--background))' }}>

        {/* Header */}
        <div style={{ padding: '24px 40px 20px 40px', borderBottom: '1px solid hsl(var(--border))' }}>
          <button onClick={() => navigate('/')}
            style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 8, fontFamily: 'Inter, sans-serif', padding: 0 }}>
            &larr; Back to Lobby
          </button>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'hsl(var(--foreground))', fontFamily: 'Space Grotesk, sans-serif', margin: 0 }}>
            Analytics
          </h1>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 40px 40px 40px' }}>

          {!isOnline && (
            <div style={{
              padding: 16, borderRadius: 10, marginBottom: 20,
              background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))',
              fontSize: 13, textAlign: 'center',
            }}>
              Start the engine to view analytics
            </div>
          )}

          {/* Date Range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {(['7D', '30D', 'MTD'] as const).map((label) => (
              <button
                key={label}
                onClick={() => setQuickRange(label === '7D' ? 7 : label === '30D' ? 30 : 'mtd')}
                style={{
                  padding: '5px 14px', borderRadius: 6, border: '1px solid',
                  borderColor: selectedRangeLabel === label ? 'hsl(var(--foreground))' : 'hsl(var(--border))',
                  background: selectedRangeLabel === label ? 'hsl(var(--foreground))' : 'transparent',
                  color: selectedRangeLabel === label ? 'hsl(var(--background))' : 'hsl(var(--muted-foreground))',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'Space Grotesk, sans-serif',
                }}>
                {label}
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', fontSize: 11 }} />
            <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: 11 }}>to</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', fontSize: 11 }} />
            <button onClick={() => void usage.refresh()}
              style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
              {usage.loading ? '...' : 'Refresh'}
            </button>
          </div>

          {usage.error && (
            <div style={{
              padding: 12, borderRadius: 8, marginBottom: 20,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#f87171', fontSize: 12,
            }}>
              {usage.error}
            </div>
          )}

          {/* KPI Cards — 4 columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Total Spend', value: formatCurrency(usage.totals.totalCost), accent: true },
              { label: 'Tokens', value: formatNumber(usage.totals.totalTokens) },
              { label: 'Sessions', value: formatNumber(usage.sessions.length) },
              { label: 'Messages', value: formatNumber(usage.aggregates.messages.total) },
            ].map((card) => (
              <div key={card.label} style={{
                background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
                borderRadius: 10, padding: '16px 18px',
              }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {card.label}
                </div>
                <div style={{
                  fontSize: 22, fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', marginTop: 6,
                  color: card.accent ? 'hsl(var(--foreground))' : 'hsl(var(--foreground))',
                }}>
                  {card.value}
                </div>
              </div>
            ))}
          </div>

          {/* Daily Spend Chart */}
          <div style={{ marginBottom: 24 }}>
            <div style={{
              background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
              borderRadius: 10, padding: '18px 20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(var(--foreground))' }}>
                  Daily Spend
                </span>
                <div style={{ display: 'flex', gap: 14 }}>
                  {[
                    { label: 'Input', value: formatCurrency(usage.totals.inputCost) },
                    { label: 'Output', value: formatCurrency(usage.totals.outputCost) },
                    { label: 'Cache', value: formatCurrency(usage.totals.cacheReadCost + usage.totals.cacheWriteCost) },
                  ].map((item) => (
                    <span key={item.label} style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
                      {item.label} <span style={{ fontWeight: 600 }}>{item.value}</span>
                    </span>
                  ))}
                </div>
              </div>
              {recentCostDaily.length === 0 ? (
                <div style={{ padding: '30px 0', textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: 12 }}>
                  {usage.loading ? 'Loading...' : 'No data for this period'}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: hasSpendData ? 120 : 60 }}>
                  {recentCostDaily.map((entry) => {
                    const heightPct = chartMax > 0 ? (entry.totalCost / chartMax) * 100 : 0;
                    return (
                      <div key={entry.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        {hasSpendData && (
                          <div style={{ fontSize: 8, color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>
                            {entry.totalCost > 0 ? formatCurrency(entry.totalCost) : ''}
                          </div>
                        )}
                        <div style={{
                          width: '100%', maxWidth: 32, borderRadius: 3,
                          height: hasSpendData ? `${Math.max(heightPct, 3)}%` : 3,
                          background: hasSpendData
                            ? 'linear-gradient(to top, hsl(var(--primary)), hsl(var(--primary) / 0.6))'
                            : 'hsl(var(--border))',
                          transition: 'height 0.3s ease',
                        }} />
                        <div style={{ fontSize: 8, color: 'hsl(var(--muted-foreground))' }}>
                          {entry.date.slice(5)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Agents + Models side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>

            {/* Top Agents */}
            <div style={{
              background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
              borderRadius: 10, overflow: 'hidden',
            }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid hsl(var(--border))' }}>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(var(--foreground))' }}>
                  Top Agents
                </span>
              </div>
              {usage.aggregates.byAgent.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: 12 }}>No agent data</div>
              ) : (
                usage.aggregates.byAgent.slice(0, 6).map((agent, i) => (
                  <div key={agent.agentId} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 18px',
                    borderBottom: i < Math.min(usage.aggregates.byAgent.length, 6) - 1 ? '1px solid hsl(var(--border))' : 'none',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--foreground))' }}>
                      {agent.agentName || agent.agentId}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--foreground))', fontFamily: 'Space Grotesk, sans-serif' }}>
                      {formatCurrency(agent.totals.totalCost)}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Models Used */}
            <div style={{
              background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
              borderRadius: 10, overflow: 'hidden',
            }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid hsl(var(--border))' }}>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(var(--foreground))' }}>
                  Models Used
                </span>
              </div>
              {usage.aggregates.byModel.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: 12 }}>No model data</div>
              ) : (
                usage.aggregates.byModel.slice(0, 6).map((model, i) => (
                  <div key={`${model.provider}-${model.model}`} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 18px',
                    borderBottom: i < Math.min(usage.aggregates.byModel.length, 6) - 1 ? '1px solid hsl(var(--border))' : 'none',
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--foreground))' }}>
                        {model.model || 'Unknown'}
                      </div>
                      {model.provider && (
                        <div style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))' }}>{model.provider}</div>
                      )}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--foreground))', fontFamily: 'Space Grotesk, sans-serif' }}>
                      {formatCurrency(model.totals.totalCost)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Budget Limits */}
          <div style={{
            background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
            borderRadius: 10, padding: '18px 20px', marginBottom: 24,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(var(--foreground))', marginBottom: 14 }}>
              Budget Limits
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'Daily (USD)', key: 'dailySpendLimitUsd' as const, value: budgets.dailySpendLimitUsd },
                { label: 'Monthly (USD)', key: 'monthlySpendLimitUsd' as const, value: budgets.monthlySpendLimitUsd },
                { label: 'Per-Agent (USD)', key: 'perAgentSoftLimitUsd' as const, value: budgets.perAgentSoftLimitUsd },
                { label: 'Alert at (%)', key: 'alertThresholdPct' as const, value: budgets.alertThresholdPct },
              ].map((field) => (
                <div key={field.key}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>
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
                      width: '100%', padding: '7px 10px', borderRadius: 6,
                      border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))',
                      color: 'hsl(var(--foreground))', fontSize: 13,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Budget Alerts */}
          {usage.budgetAlerts.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              {usage.budgetAlerts.map((alert, i) => (
                <div key={i} style={{
                  padding: 12, borderRadius: 8, marginBottom: 6,
                  background: alert.severity === 'danger' ? 'rgba(239,68,68,0.1)' : 'rgba(234,179,8,0.1)',
                  border: `1px solid ${alert.severity === 'danger' ? 'rgba(239,68,68,0.2)' : 'rgba(234,179,8,0.2)'}`,
                  color: alert.severity === 'danger' ? '#f87171' : '#fbbf24',
                  fontSize: 12, fontWeight: 600,
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
