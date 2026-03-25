/**
 * Known models per provider — hardcoded for dropdown selection
 */

export const PROVIDER_MODELS: Record<string, Array<{ id: string; name: string }>> = {
  xai: [
    { id: 'grok-4.20-0309-reasoning', name: 'Grok 4.20 Reasoning' },
    { id: 'grok-4.20-0309-non-reasoning', name: 'Grok 4.20' },
    { id: 'grok-4-1-fast-reasoning', name: 'Grok 4.1 Fast Reasoning' },
    { id: 'grok-4-1-fast-non-reasoning', name: 'Grok 4.1 Fast' },
    { id: 'grok-3', name: 'Grok 3' },
    { id: 'grok-3-fast', name: 'Grok 3 Fast' },
    { id: 'grok-3-mini', name: 'Grok 3 Mini' },
    { id: 'grok-3-mini-fast', name: 'Grok 3 Mini Fast' },
  ],
  anthropic: [
    { id: 'claude-opus-4-6', name: 'Claude Opus 4.6' },
    { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6' },
    { id: 'claude-opus-4-5-20250514', name: 'Claude Opus 4.5' },
    { id: 'claude-sonnet-4-5-20250514', name: 'Claude Sonnet 4.5' },
    { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5' },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' },
  ],
  openai: [
    { id: 'gpt-5.4', name: 'GPT-5.4' },
    { id: 'gpt-5.4-pro', name: 'GPT-5.4 Pro' },
    { id: 'gpt-5.4-mini', name: 'GPT-5.4 Mini' },
    { id: 'gpt-5.4-nano', name: 'GPT-5.4 Nano' },
    { id: 'o3', name: 'o3' },
    { id: 'o4-mini', name: 'o4 Mini' },
    { id: 'o3-mini', name: 'o3 Mini' },
    { id: 'gpt-4.1', name: 'GPT-4.1' },
    { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini' },
    { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano' },
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
  ],
  google: [
    { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro' },
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash' },
    { id: 'gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash-Lite' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite' },
  ],
  openrouter: [
    { id: 'anthropic/claude-opus-4-6', name: 'Claude Opus 4.6' },
    { id: 'anthropic/claude-sonnet-4-6', name: 'Claude Sonnet 4.6' },
    { id: 'openai/gpt-5.4', name: 'GPT-5.4' },
    { id: 'openai/o3', name: 'o3' },
    { id: 'google/gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro' },
    { id: 'x-ai/grok-4.20-0309-non-reasoning', name: 'Grok 4.20' },
    { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1' },
    { id: 'meta-llama/llama-4-maverick', name: 'Llama 4 Maverick' },
  ],
  moonshot: [
    { id: 'kimi-k2.5', name: 'Kimi K2.5' },
    { id: 'moonshot-v1-128k', name: 'Moonshot V1 128K' },
  ],
  siliconflow: [
    { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3' },
    { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1' },
    { id: 'Qwen/Qwen3-235B-A22B', name: 'Qwen3 235B' },
  ],
  ollama: [
    { id: 'qwen3:latest', name: 'Qwen 3' },
    { id: 'llama3.1:latest', name: 'Llama 3.1' },
    { id: 'deepseek-r1:latest', name: 'DeepSeek R1' },
    { id: 'gemma3:latest', name: 'Gemma 3' },
    { id: 'mistral:latest', name: 'Mistral' },
    { id: 'codellama:latest', name: 'Code Llama' },
  ],
};
