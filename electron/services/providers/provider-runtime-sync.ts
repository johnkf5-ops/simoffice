import type { GatewayManager } from '../../gateway/manager';
import type { ProviderConfig } from '../../utils/secure-storage';
import { getAllProviders, getApiKey, getDefaultProvider, getProvider } from '../../utils/secure-storage';
import { getProviderConfig, getProviderDefaultModel } from '../../utils/provider-registry';
import {
  removeProviderFromOpenClaw,
  saveProviderKeyToOpenClaw,
  setOpenClawDefaultModel,
  setOpenClawDefaultModelWithOverride,
  syncProviderConfigToOpenClaw,
  updateAgentModelProvider,
} from '../../utils/openclaw-auth';
import { logger } from '../../utils/logger';

export function getOpenClawProviderKey(type: string, providerId: string): string {
  if (type === 'custom' || type === 'ollama') {
    const suffix = providerId.replace(/-/g, '').slice(0, 8);
    return `${type}-${suffix}`;
  }
  if (type === 'minimax-portal-cn') {
    return 'minimax-portal';
  }
  return type;
}

export function getProviderModelRef(config: ProviderConfig): string | undefined {
  const providerKey = getOpenClawProviderKey(config.type, config.id);

  if (config.model) {
    return config.model.startsWith(`${providerKey}/`)
      ? config.model
      : `${providerKey}/${config.model}`;
  }

  return getProviderDefaultModel(config.type);
}

export async function getProviderFallbackModelRefs(config: ProviderConfig): Promise<string[]> {
  const allProviders = await getAllProviders();
  const providerMap = new Map(allProviders.map((provider) => [provider.id, provider]));
  const seen = new Set<string>();
  const results: string[] = [];
  const providerKey = getOpenClawProviderKey(config.type, config.id);

  for (const fallbackModel of config.fallbackModels ?? []) {
    const normalizedModel = fallbackModel.trim();
    if (!normalizedModel) continue;

    const modelRef = normalizedModel.startsWith(`${providerKey}/`)
      ? normalizedModel
      : `${providerKey}/${normalizedModel}`;

    if (seen.has(modelRef)) continue;
    seen.add(modelRef);
    results.push(modelRef);
  }

  for (const fallbackId of config.fallbackProviderIds ?? []) {
    if (!fallbackId || fallbackId === config.id) continue;

    const fallbackProvider = providerMap.get(fallbackId);
    if (!fallbackProvider) continue;

    const modelRef = getProviderModelRef(fallbackProvider);
    if (!modelRef || seen.has(modelRef)) continue;

    seen.add(modelRef);
    results.push(modelRef);
  }

  return results;
}

function scheduleGatewayRestart(
  gatewayManager: GatewayManager | undefined,
  message: string,
  options?: { delayMs?: number; onlyIfRunning?: boolean },
): void {
  if (!gatewayManager) {
    return;
  }

  if (options?.onlyIfRunning && gatewayManager.getStatus().state === 'stopped') {
    return;
  }

  logger.info(message);
  gatewayManager.debouncedRestart(options?.delayMs);
}

export async function syncProviderApiKeyToRuntime(
  providerType: string,
  providerId: string,
  apiKey: string,
): Promise<void> {
  const ock = getOpenClawProviderKey(providerType, providerId);
  await saveProviderKeyToOpenClaw(ock, apiKey);
}

export async function syncSavedProviderToRuntime(
  config: ProviderConfig,
  apiKey: string | undefined,
  gatewayManager?: GatewayManager,
): Promise<void> {
  const ock = getOpenClawProviderKey(config.type, config.id);

  if (apiKey !== undefined) {
    const trimmedKey = apiKey.trim();
    if (trimmedKey) {
      await saveProviderKeyToOpenClaw(ock, trimmedKey);
    }
  }

  const meta = getProviderConfig(config.type);
  const api = config.type === 'custom' || config.type === 'ollama' ? 'openai-completions' : meta?.api;

  if (!api) {
    return;
  }

  await syncProviderConfigToOpenClaw(ock, config.model, {
    baseUrl: config.baseUrl || meta?.baseUrl,
    api,
    apiKeyEnv: meta?.apiKeyEnv,
    headers: meta?.headers,
  });

  if (config.type === 'custom' || config.type === 'ollama') {
    const resolvedKey = apiKey !== undefined ? (apiKey.trim() || null) : await getApiKey(config.id);
    if (resolvedKey && config.baseUrl) {
      const modelId = config.model;
      await updateAgentModelProvider(ock, {
        baseUrl: config.baseUrl,
        api: 'openai-completions',
        models: modelId ? [{ id: modelId, name: modelId }] : [],
        apiKey: resolvedKey,
      });
    }
  }

  scheduleGatewayRestart(
    gatewayManager,
    `Scheduling Gateway restart after saving provider "${ock}" config`,
  );
}

export async function syncUpdatedProviderToRuntime(
  config: ProviderConfig,
  apiKey: string | undefined,
  gatewayManager?: GatewayManager,
): Promise<void> {
  const ock = getOpenClawProviderKey(config.type, config.id);
  const fallbackModels = await getProviderFallbackModelRefs(config);
  const meta = getProviderConfig(config.type);
  const api = config.type === 'custom' || config.type === 'ollama' ? 'openai-completions' : meta?.api;

  if (!api) {
    return;
  }

  await syncProviderConfigToOpenClaw(ock, config.model, {
    baseUrl: config.baseUrl || meta?.baseUrl,
    api,
    apiKeyEnv: meta?.apiKeyEnv,
    headers: meta?.headers,
  });

  if (config.type === 'custom' || config.type === 'ollama') {
    const resolvedKey = apiKey !== undefined ? (apiKey.trim() || null) : await getApiKey(config.id);
    if (resolvedKey && config.baseUrl) {
      const modelId = config.model;
      await updateAgentModelProvider(ock, {
        baseUrl: config.baseUrl,
        api: 'openai-completions',
        models: modelId ? [{ id: modelId, name: modelId }] : [],
        apiKey: resolvedKey,
      });
    }
  }

  const defaultProviderId = await getDefaultProvider();
  if (defaultProviderId === config.id) {
    const modelOverride = config.model ? `${ock}/${config.model}` : undefined;
    if (config.type !== 'custom' && config.type !== 'ollama') {
      await setOpenClawDefaultModel(ock, modelOverride, fallbackModels);
    } else {
      await setOpenClawDefaultModelWithOverride(ock, modelOverride, {
        baseUrl: config.baseUrl,
        api: 'openai-completions',
      }, fallbackModels);
    }
  }

  scheduleGatewayRestart(
    gatewayManager,
    `Scheduling Gateway restart after updating provider "${ock}" config`,
  );
}

export async function syncDeletedProviderToRuntime(
  provider: ProviderConfig | null,
  providerId: string,
  gatewayManager?: GatewayManager,
): Promise<void> {
  if (!provider?.type) {
    return;
  }

  const ock = getOpenClawProviderKey(provider.type, providerId);
  await removeProviderFromOpenClaw(ock);

  scheduleGatewayRestart(
    gatewayManager,
    `Scheduling Gateway restart after deleting provider "${ock}"`,
  );
}

export async function syncDeletedProviderApiKeyToRuntime(
  provider: ProviderConfig | null,
  providerId: string,
): Promise<void> {
  if (!provider?.type) {
    return;
  }

  const ock = getOpenClawProviderKey(provider.type, providerId);
  await removeProviderFromOpenClaw(ock);
}

export async function syncDefaultProviderToRuntime(
  providerId: string,
  gatewayManager?: GatewayManager,
): Promise<void> {
  const provider = await getProvider(providerId);
  if (!provider) {
    return;
  }

  const ock = getOpenClawProviderKey(provider.type, providerId);
  const providerKey = await getApiKey(providerId);
  const fallbackModels = await getProviderFallbackModelRefs(provider);
  const oauthTypes = ['qwen-portal', 'minimax-portal', 'minimax-portal-cn'];
  const isOAuthProvider = oauthTypes.includes(provider.type) && !providerKey;

  if (!isOAuthProvider) {
    const modelOverride = provider.model
      ? (provider.model.startsWith(`${ock}/`) ? provider.model : `${ock}/${provider.model}`)
      : undefined;

    if (provider.type === 'custom' || provider.type === 'ollama') {
      await setOpenClawDefaultModelWithOverride(ock, modelOverride, {
        baseUrl: provider.baseUrl,
        api: 'openai-completions',
      }, fallbackModels);
    } else {
      await setOpenClawDefaultModel(ock, modelOverride, fallbackModels);
    }

    if (providerKey) {
      await saveProviderKeyToOpenClaw(ock, providerKey);
    }
  } else {
    const defaultBaseUrl = provider.type === 'minimax-portal'
      ? 'https://api.minimax.io/anthropic'
      : (provider.type === 'minimax-portal-cn' ? 'https://api.minimaxi.com/anthropic' : 'https://portal.qwen.ai/v1');
    const api: 'anthropic-messages' | 'openai-completions' =
      (provider.type === 'minimax-portal' || provider.type === 'minimax-portal-cn')
        ? 'anthropic-messages'
        : 'openai-completions';

    let baseUrl = provider.baseUrl || defaultBaseUrl;
    if ((provider.type === 'minimax-portal' || provider.type === 'minimax-portal-cn') && baseUrl) {
      baseUrl = baseUrl.replace(/\/v1$/, '').replace(/\/anthropic$/, '').replace(/\/$/, '') + '/anthropic';
    }

    const targetProviderKey = (provider.type === 'minimax-portal' || provider.type === 'minimax-portal-cn')
      ? 'minimax-portal'
      : provider.type;

    await setOpenClawDefaultModelWithOverride(targetProviderKey, getProviderModelRef(provider), {
      baseUrl,
      api,
      authHeader: targetProviderKey === 'minimax-portal' ? true : undefined,
      apiKeyEnv: targetProviderKey === 'minimax-portal' ? 'minimax-oauth' : 'qwen-oauth',
    }, fallbackModels);

    logger.info(`Configured openclaw.json for OAuth provider "${provider.type}"`);

    try {
      const defaultModelId = provider.model?.split('/').pop();
      await updateAgentModelProvider(targetProviderKey, {
        baseUrl,
        api,
        authHeader: targetProviderKey === 'minimax-portal' ? true : undefined,
        apiKey: targetProviderKey === 'minimax-portal' ? 'minimax-oauth' : 'qwen-oauth',
        models: defaultModelId ? [{ id: defaultModelId, name: defaultModelId }] : [],
      });
    } catch (err) {
      logger.warn(`Failed to update models.json for OAuth provider "${targetProviderKey}":`, err);
    }
  }

  if (
    (provider.type === 'custom' || provider.type === 'ollama') &&
    providerKey &&
    provider.baseUrl
  ) {
    const modelId = provider.model;
    await updateAgentModelProvider(ock, {
      baseUrl: provider.baseUrl,
      api: 'openai-completions',
      models: modelId ? [{ id: modelId, name: modelId }] : [],
      apiKey: providerKey,
    });
  }

  scheduleGatewayRestart(
    gatewayManager,
    `Scheduling Gateway restart after provider switch to "${ock}"`,
    { onlyIfRunning: true },
  );
}
