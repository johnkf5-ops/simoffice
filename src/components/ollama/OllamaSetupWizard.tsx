/**
 * OllamaSetupWizard — 5-step guided setup for local AI.
 * Inline styles matching Lobby pages (Path A).
 *
 * Steps:
 *  1. "Checking your computer..." — auto hardware detect
 *  2. "Here's what we recommend" — model recommendation
 *  3. "Setting up Ollama" — install / start
 *  4. "Downloading your AI" — pull model with progress
 *  5. "You're all set!" — done
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, CheckCircle2, Download, Cpu, Brain, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { invokeIpc } from '@/lib/api-client';
import { subscribeHostEvent } from '@/lib/host-events';
import { OllamaModelPicker } from './OllamaModelPicker';

// ---------------------------------------------------------------------------
// Types (mirrors backend)
// ---------------------------------------------------------------------------

interface HardwareInfo {
  totalRamGB: number;
  availableRamGB: number;
  cpuModel: string;
  chip: { generation: string; variant: string } | null;
  coreCount: number;
  arch: string;
  memoryBandwidthGBs: number;
  freeDiskGB: number;
  isAppleSilicon: boolean;
}

interface ModelRecommendation {
  model: {
    ollamaTag: string;
    name: string;
    params: string;
    downloadGB: number;
    bestFor: string[];
    description: string;
    hasVision: boolean;
    hasThinking: boolean;
  };
  speed: {
    tokensPerSecond: [number, number];
    humanSpeed: string;
    ttftCold: string;
    ttftWarm: string;
  };
  capabilityTier: string;
  capabilityDescription: string;
  speedDescription: string;
  capabilities: { label: string; supported: boolean }[];
  recommendedNumCtx: number;
}

interface RecommendationResult {
  recommended: ModelRecommendation | null;
  advancedModels: ModelRecommendation[];
  hardwareWarning: string | null;
}

interface PullProgress {
  model: string;
  status: string;
  percent: number;
}

interface IpcResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface OllamaSetupWizardProps {
  onComplete: (modelTag: string, baseUrl: string) => void;
  onCancel: () => void;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 1000,
  background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const card: React.CSSProperties = {
  width: 520, maxHeight: '85vh', overflow: 'auto',
  borderRadius: 16, background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))', padding: '32px',
  boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
};

const heading: React.CSSProperties = {
  fontSize: 22, fontWeight: 700, color: 'hsl(var(--foreground))',
  fontFamily: "'Space Grotesk', sans-serif", marginBottom: 8,
};

const subtext: React.CSSProperties = {
  fontSize: 14, color: 'hsl(var(--muted-foreground))', lineHeight: 1.5, marginBottom: 20,
};

const pill: React.CSSProperties = {
  display: 'inline-block', padding: '3px 10px', borderRadius: 20,
  fontSize: 11, fontWeight: 600, marginRight: 6, marginBottom: 4,
};

const pillColors: Record<string, string> = {
  'all-rounder': '#3b82f6',
  'coding': '#8b5cf6',
  'reasoning': '#f59e0b',
  'math': '#ef4444',
  'vision': '#10b981',
  'assistant': '#6366f1',
  'conversation': '#06b6d4',
  'writing': '#ec4899',
  'data': '#14b8a6',
};

const primaryBtn: React.CSSProperties = {
  width: '100%', padding: '14px', borderRadius: 12, border: 'none',
  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
  color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer',
  transition: 'opacity 0.15s',
};

const secondaryBtn: React.CSSProperties = {
  width: '100%', padding: '12px', borderRadius: 12, marginTop: 10,
  border: '1px solid hsl(var(--border))', background: 'transparent',
  color: 'hsl(var(--muted-foreground))', fontSize: 14, fontWeight: 600, cursor: 'pointer',
};

const infoBox: React.CSSProperties = {
  padding: '14px 16px', borderRadius: 12,
  background: 'hsl(var(--muted))', marginBottom: 16, lineHeight: 1.5,
};

const progressTrack: React.CSSProperties = {
  width: '100%', height: 8, borderRadius: 4,
  background: 'hsl(var(--muted))', overflow: 'hidden', marginBottom: 8,
};

const checkRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 13,
  color: 'hsl(var(--foreground))',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type WizardStep = 'detecting' | 'recommending' | 'installing' | 'pulling' | 'done';

export function OllamaSetupWizard({ onComplete, onCancel }: OllamaSetupWizardProps) {
  const [step, setStep] = useState<WizardStep>('detecting');
  const [hardware, setHardware] = useState<HardwareInfo | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [ollamaStatus, setOllamaStatus] = useState<string>('checking');
  const [pullPercent, setPullPercent] = useState(0);
  const [pullStatus, setPullStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerOverride, setPickerOverride] = useState<ModelRecommendation | null>(null);
  const [installedModels, setInstalledModels] = useState<Set<string>>(new Set());
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  // --- Step 1: Auto-detect hardware + recommend in single IPC call ---
  useEffect(() => {
    if (step !== 'detecting') return;
    let cancelled = false;

    (async () => {
      try {
        const result = await invokeIpc<IpcResult<{ hardware: HardwareInfo; recommendation: RecommendationResult }>>(
          'ollama:get-recommendation'
        );
        if (cancelled) return;
        if (!result.success || !result.data) {
          setError(result.error ?? 'Hardware detection failed');
          return;
        }

        setHardware(result.data.hardware);
        setRecommendation(result.data.recommendation);
        if (result.data.recommendation.recommended) {
          setSelectedModel(result.data.recommendation.recommended.model.ollamaTag);
        }

        // Fetch installed models to show "Downloaded" badges
        const modelsResult = await invokeIpc<IpcResult<{ name: string }[]>>('ollama:list-models').catch(() => null);
        if (!cancelled && modelsResult?.success && modelsResult.data) {
          const names = new Set<string>();
          for (const m of modelsResult.data) {
            names.add(m.name);
            names.add(m.name.replace(/:latest$/, ''));
          }
          setInstalledModels(names);
        }

        setStep('recommending');
      } catch (err) {
        if (!cancelled) setError(String(err));
      }
    })();

    return () => { cancelled = true; };
  }, [step]);

  // --- Step 4: Pull model ---
  // Defined before steps 3 so it can be referenced by startInstallStep/handleInstallClick
  const selectedModelRef = useRef(selectedModel);
  selectedModelRef.current = selectedModel;

  const beginPull = useCallback(async () => {
    const model = selectedModelRef.current;
    if (!model) return;

    // Check if model is already installed — skip pull if so
    const installedResult = await invokeIpc<IpcResult<{ name: string }[]>>('ollama:list-models').catch(() => null);
    const alreadyInstalled = installedResult?.success && installedResult.data?.some(
      m => m.name === model || m.name === model.replace(/:latest$/, '')
    );

    if (alreadyInstalled) {
      setPullPercent(100);
      setPullStatus('Already downloaded!');
      setStep('pulling');
      await invokeIpc('ollama:configure', model).catch(() => {});
      await new Promise(r => setTimeout(r, 800));
      setStep('done');
      return;
    }

    setStep('pulling');
    setPullPercent(0);
    setPullStatus('Waiting for Ollama to be ready...');

    // Give Ollama a few seconds to stabilize after fresh install
    await new Promise(r => setTimeout(r, 3000));

    // Retry pull up to 2 times (Ollama can drop connections right after install)
    for (let attempt = 1; attempt <= 2; attempt++) {
      if (!mountedRef.current) return;
      setPullStatus(attempt > 1 ? 'Retrying download...' : 'Starting download...');
      setPullPercent(0);

      const pullResult = await invokeIpc<IpcResult>('ollama:pull-model', model);
      if (pullResult.success) {
        if (mountedRef.current) {
          setPullPercent(100);
          setPullStatus('Complete!');
          await invokeIpc('ollama:configure', model);
          setStep('done');
        }
        return;
      }

      // Last attempt failed — show error
      if (attempt === 2) {
        setError(pullResult.error ?? 'Download failed. Ollama may still be starting up — try again in a moment.');
        return;
      }

      // Wait before retry
      setPullStatus('Connection lost — retrying in a moment...');
      await new Promise(r => setTimeout(r, 3000));
    }
  }, []);

  // --- Step 3: Check/install Ollama ---
  const startInstallStep = useCallback(async () => {
    setStep('installing');
    setOllamaStatus('checking');

    const health = await invokeIpc<IpcResult<{ status: string }>>('ollama:check-status');
    if (!health.success) { setError(health.error ?? 'Health check failed'); return; }

    const status = health.data?.status;
    if (status === 'running') {
      setOllamaStatus('running');
      void beginPull();
      return;
    }

    if (status === 'installed-not-running') {
      setOllamaStatus('starting');
      const startResult = await invokeIpc<IpcResult>('ollama:start');
      if (startResult.success) {
        setOllamaStatus('running');
        void beginPull();
      } else {
        setError('Could not start Ollama. Try opening Ollama manually.');
      }
      return;
    }

    // not-installed
    setOllamaStatus('not-installed');
  }, [beginPull]);

  const handleInstallClick = useCallback(async () => {
    setOllamaStatus('downloading');

    // Auto-download, install, remove quarantine, and launch
    const installResult = await invokeIpc<IpcResult<{ binaryPath: string | null; auto: boolean }>>('ollama:install');

    if (installResult.success && installResult.data?.auto && installResult.data.binaryPath) {
      // Auto-install succeeded — verify Ollama is actually running before pulling
      setOllamaStatus('starting');

      // Double-check the service is responding
      const health = await invokeIpc<IpcResult<{ status: string }>>('ollama:check-status');
      if (health.success && health.data?.status === 'running') {
        setOllamaStatus('running');
        void beginPull();
        return;
      }

      // Service not running yet — try starting it explicitly
      const startResult = await invokeIpc<IpcResult>('ollama:start');
      if (startResult.success) {
        setOllamaStatus('running');
        void beginPull();
      } else {
        setError('Ollama installed but not responding yet. Try clicking "Install Ollama" again in a moment.');
        setOllamaStatus('not-installed');
      }
      return;
    }

    // Auto-install failed, browser was opened — wait for manual install
    setOllamaStatus('waiting-install');
    const waitResult = await invokeIpc<IpcResult<{ binaryPath: string | null }>>('ollama:wait-for-install');
    if (waitResult.success && waitResult.data?.binaryPath) {
      setOllamaStatus('starting');
      const startResult = await invokeIpc<IpcResult>('ollama:start');
      if (startResult.success) {
        setOllamaStatus('running');
        void beginPull();
      } else {
        setError('Ollama installed but could not start. Try opening it manually.');
      }
    } else {
      setOllamaStatus('not-installed');
      setError('Installation timed out. You can try again or install Ollama manually from ollama.com.');
    }
  }, [beginPull]);

  // Subscribe to pull progress events (once on mount)
  useEffect(() => {
    return subscribeHostEvent<PullProgress>('ollama:pull-progress', (data) => {
      if (!mountedRef.current) return;
      setPullPercent(data.percent);
      setPullStatus(data.status);
    });
  }, []);

  // --- Select from advanced picker ---
  // Fetches the full recommendation data for the selected model so the wizard
  // can display its capabilities, speed, etc. even if it's not in the rec/advanced arrays.
  const handleModelSelect = useCallback(async (tag: string) => {
    setSelectedModel(tag);
    setShowPicker(false);

    // Check if this model is already in our recommendation lists
    const allRecs = [recommendation?.recommended, ...(recommendation?.advancedModels ?? [])];
    const found = allRecs.find(r => r?.model.ollamaTag === tag);
    if (found) {
      setPickerOverride(null); // no override needed, it's already in the list
      return;
    }

    // Fetch compatible models to get full data for this model
    const result = await invokeIpc<IpcResult<ModelRecommendation[]>>('ollama:get-compatible-models');
    if (result.success && result.data) {
      const match = result.data.find(m => m.model.ollamaTag === tag);
      if (match) setPickerOverride(match);
    }
  }, [recommendation]);

  // --- Render by step ---
  const chipLabel = hardware?.chip
    ? `${hardware.chip.generation}${hardware.chip.variant !== 'base' ? ` ${hardware.chip.variant}` : ''}`
    : hardware?.cpuModel ?? '';

  const rec = recommendation?.recommended;
  const selectedRec = pickerOverride
    ?? (recommendation
      ? [rec, ...(recommendation.advancedModels ?? [])].find(r => r?.model.ollamaTag === selectedModel) ?? rec
      : null);

  return (
    <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div style={card}>

        {/* ════ STEP 1: DETECTING ════ */}
        {step === 'detecting' && !error && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Cpu size={40} style={{ color: '#3b82f6', marginBottom: 16 }} />
            <div style={heading}>Checking your computer...</div>
            <div style={subtext}>Detecting hardware to find the best AI brain for you.</div>
            <Loader2 size={24} style={{ color: '#3b82f6', animation: 'spin 1s linear infinite' }} />
          </div>
        )}

        {/* ════ STEP 2: RECOMMENDING ════ */}
        {step === 'recommending' && hardware && selectedRec && (
          <>
            <div style={heading}>Here's what we recommend</div>
            <div style={subtext}>
              You have a Mac with <strong>{chipLabel}</strong> and <strong>{hardware.totalRamGB} GB</strong> of memory.
            </div>

            {recommendation?.hardwareWarning && (
              <div style={{ ...infoBox, background: 'hsl(var(--muted))', fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>
                {recommendation.hardwareWarning}
              </div>
            )}

            {hardware && hardware.totalRamGB <= 16 && (
              <div style={{ ...infoBox, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 12, lineHeight: 1.5 }}>
                <div style={{ fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                  Good for chat, limited for complex tasks
                </div>
                <div style={{ color: 'hsl(var(--muted-foreground))' }}>
                  With 16GB of memory, local AI works well for conversations, quick questions, and simple tasks.
                  For advanced reasoning, long documents, and multi-step work, we recommend also connecting a cloud AI (like Claude or GPT) from the Brain page.
                </div>
              </div>
            )}

            {/* Recommended model card */}
            <div style={{
              borderRadius: 14, border: '2px solid #3b82f6',
              padding: '20px', marginBottom: 16, background: 'hsl(var(--background))',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                    {selectedRec.model.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
                    {selectedRec.capabilityTier}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {installedModels.has(selectedRec.model.ollamaTag) && (
                    <div style={{
                      padding: '4px 10px', borderRadius: 20,
                      background: 'rgba(34,197,94,0.15)', color: '#22c55e',
                      fontSize: 11, fontWeight: 700,
                    }}>
                      Downloaded
                    </div>
                  )}
                  <div style={{
                    padding: '4px 12px', borderRadius: 20,
                    background: 'rgba(59,130,246,0.15)', color: '#3b82f6',
                    fontSize: 12, fontWeight: 700,
                  }}>
                    Recommended
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginBottom: 12, lineHeight: 1.4 }}>
                {selectedRec.model.description}
              </div>

              {/* Best-for tags */}
              <div style={{ marginBottom: 12 }}>
                {selectedRec.model.bestFor.map(tag => (
                  <span key={tag} style={{ ...pill, background: `${pillColors[tag] ?? '#6b7280'}22`, color: pillColors[tag] ?? '#6b7280' }}>
                    {tag}
                  </span>
                ))}
                {selectedRec.model.hasVision && (
                  <span style={{ ...pill, background: '#10b98122', color: '#10b981' }}>sees images</span>
                )}
              </div>

              {/* Speed & download */}
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
                <div>
                  <Download size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                  {selectedRec.model.downloadGB} GB download
                </div>
                <div>{selectedRec.speed.humanSpeed}</div>
              </div>
            </div>

            {/* Capability checklist */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 8 }}>
                What this brain can do
              </div>
              {selectedRec.capabilities.map((cap, i) => (
                <div key={i} style={checkRow}>
                  {cap.supported
                    ? <CheckCircle2 size={14} style={{ color: '#22c55e', flexShrink: 0 }} />
                    : <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid hsl(var(--border))', flexShrink: 0 }} />}
                  <span style={{ color: cap.supported ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}>
                    {cap.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Memory warning */}
            <div style={{ ...infoBox, fontSize: 12 }}>
              <strong>Heads up:</strong> Running a local AI brain uses a lot of your computer's memory.
              If you have other apps open (browsers, Photoshop, etc.), your AI and those apps may slow down.
              For the best experience, close heavy apps while your AI team is working.
            </div>

            {/* Advanced models toggle */}
            {(recommendation?.advancedModels?.length ?? 0) > 0 && (
              <div style={{ marginBottom: 16 }}>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, width: '100%',
                    background: 'none', border: 'none', padding: '8px 0',
                    color: 'hsl(var(--muted-foreground))', fontSize: 13, cursor: 'pointer',
                  }}
                >
                  {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {showAdvanced ? 'Hide' : 'Show'} advanced options ({recommendation!.advancedModels.length} more)
                </button>
                {showAdvanced && (
                  <div style={{ paddingLeft: 8, borderLeft: '2px solid hsl(var(--border))', marginTop: 8 }}>
                    <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginBottom: 8 }}>
                      These brains are bigger than recommended for your computer. They'll work but may be slower, especially with other apps open.
                    </div>
                    {recommendation!.advancedModels.map(adv => (
                      <button
                        key={adv.model.ollamaTag}
                        onClick={() => { setSelectedModel(adv.model.ollamaTag); setPickerOverride(null); }}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          width: '100%', padding: '10px 12px', borderRadius: 10, marginBottom: 6,
                          border: selectedModel === adv.model.ollamaTag
                            ? '2px solid #3b82f6'
                            : '1px solid hsl(var(--border))',
                          background: selectedModel === adv.model.ollamaTag
                            ? 'rgba(59,130,246,0.08)'
                            : 'transparent',
                          cursor: 'pointer', textAlign: 'left',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                            {adv.model.name}
                          </div>
                          <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
                            {adv.model.description}
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', whiteSpace: 'nowrap', marginLeft: 12 }}>
                          {adv.model.downloadGB} GB
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Pick different model */}
            <button
              onClick={() => setShowPicker(!showPicker)}
              style={{ ...secondaryBtn, marginTop: 0, marginBottom: 12, fontSize: 12 }}
            >
              Pick a different brain
            </button>

            {showPicker && (
              <OllamaModelPicker
                selectedTag={selectedModel}
                onSelect={handleModelSelect}
                onClose={() => setShowPicker(false)}
                preloadedInstalled={installedModels}
              />
            )}

            <button onClick={startInstallStep} style={primaryBtn}>
              {selectedModel && installedModels.has(selectedModel)
                ? 'Use this brain'
                : 'Set up this brain'}
            </button>
            <button onClick={onCancel} style={secondaryBtn}>Cancel</button>
          </>
        )}

        {/* No recommendation possible */}
        {step === 'recommending' && !selectedRec && (
          <>
            <div style={heading}>Limited hardware detected</div>
            <div style={subtext}>
              Your computer doesn't have enough memory to run a local AI brain comfortably.
              You can still connect to cloud AI providers for a great experience.
            </div>
            <button onClick={onCancel} style={primaryBtn}>Choose a cloud provider</button>
          </>
        )}

        {/* ════ STEP 3: INSTALLING ════ */}
        {step === 'installing' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <Brain size={40} style={{ color: '#3b82f6', marginBottom: 16 }} />
            <div style={heading}>Setting up Ollama</div>

            {ollamaStatus === 'checking' && (
              <>
                <div style={subtext}>Checking if Ollama is installed...</div>
                <Loader2 size={24} style={{ color: '#3b82f6', animation: 'spin 1s linear infinite' }} />
              </>
            )}

            {ollamaStatus === 'starting' && (
              <>
                <div style={subtext}>Starting Ollama...</div>
                <Loader2 size={24} style={{ color: '#3b82f6', animation: 'spin 1s linear infinite' }} />
              </>
            )}

            {ollamaStatus === 'not-installed' && (
              <>
                <div style={subtext}>
                  Ollama isn't installed yet. Click below and we'll download and install it automatically — it's free and takes about a minute.
                </div>
                <button onClick={handleInstallClick} style={primaryBtn}>
                  <Download size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                  Install Ollama
                </button>
                <button onClick={onCancel} style={secondaryBtn}>Cancel</button>
              </>
            )}

            {ollamaStatus === 'downloading' && (
              <>
                <div style={subtext}>Downloading and installing Ollama...</div>
                <Loader2 size={24} style={{ color: '#3b82f6', animation: 'spin 1s linear infinite' }} />
              </>
            )}

            {ollamaStatus === 'waiting-install' && (
              <>
                <div style={subtext}>
                  Waiting for you to install Ollama... Once you've dragged it into Applications and opened it, we'll continue automatically.
                </div>
                <Loader2 size={24} style={{ color: '#3b82f6', animation: 'spin 1s linear infinite' }} />
              </>
            )}
          </div>
        )}

        {/* ════ STEP 4: PULLING ════ */}
        {step === 'pulling' && (
          <div style={{ padding: '24px 0' }}>
            <div style={heading}>Downloading your AI brain</div>
            <div style={subtext}>
              Downloading {selectedRec?.model.name ?? selectedModel}. You can keep using your computer while it downloads.
            </div>

            <div style={progressTrack}>
              <div style={{
                height: '100%', borderRadius: 4, transition: 'width 0.3s ease',
                background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
                width: `${pullPercent}%`,
              }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
              <span>{pullStatus}</span>
              <span>{pullPercent}%</span>
            </div>

            <button
              onClick={() => { setError(null); setStep('recommending'); }}
              style={secondaryBtn}
            >
              Cancel
            </button>
          </div>
        )}

        {/* ════ STEP 5: DONE ════ */}
        {step === 'done' && selectedRec && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <CheckCircle2 size={48} style={{ color: '#22c55e', marginBottom: 16 }} />
            <div style={heading}>You're all set!</div>
            <div style={subtext}>
              <strong>{selectedRec.model.name}</strong> is ready and running on your computer.
            </div>

            <div style={{ ...infoBox, textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Shield size={16} style={{ color: '#22c55e' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                  Your data stays on this machine
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
                Everything runs on your computer. Your conversations, your data, and your AI brain never leave this machine.
              </div>
            </div>

            <button
              onClick={() => onComplete(selectedModel!, 'http://localhost:11434/v1')}
              style={primaryBtn}
            >
              Go to your office
            </button>
          </div>
        )}

        {/* ════ ERROR ════ */}
        {error && (
          <div style={{ marginTop: 16 }}>
            <div style={{ ...infoBox, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <div style={{ fontSize: 13, color: '#ef4444', fontWeight: 600, marginBottom: 4 }}>
                Something went wrong
              </div>
              <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{error}</div>
            </div>
            <button
              onClick={() => { setError(null); setStep('detecting'); }}
              style={primaryBtn}
            >
              Try again
            </button>
            <button onClick={onCancel} style={secondaryBtn}>Cancel</button>
          </div>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
