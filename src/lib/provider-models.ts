/**
 * Known models per provider — hardcoded for dropdown selection
 */

export const PROVIDER_MODELS: Record<string, Array<{ id: string; name: string }>> = {
  xai: [
    { id: 'grok-3', name: 'Grok 3' },
    { id: 'grok-3-mini', name: 'Grok 3 Mini' },
    { id: 'grok-3-fast', name: 'Grok 3 Fast' },
    { id: 'grok-3-mini-fast', name: 'Grok 3 Mini Fast' },
    { id: 'grok-2', name: 'Grok 2' },
    { id: 'grok-2-mini', name: 'Grok 2 Mini' },
  ],
  anthropic: [
    { id: 'claude-opus-4-6', name: 'Claude Opus 4.6' },
    { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6' },
    { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5' },
    { id: 'claude-sonnet-4-5-20250514', name: 'Claude Sonnet 4.5' },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' },
  ],
  openai: [
    { id: 'gpt-4.1', name: 'GPT-4.1' },
    { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini' },
    { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano' },
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
    { id: 'o3', name: 'o3' },
    { id: 'o3-mini', name: 'o3 Mini' },
    { id: 'o4-mini', name: 'o4 Mini' },
  ],
  google: [
    { id: 'gemini-2.5-pro-preview-06-05', name: 'Gemini 2.5 Pro' },
    { id: 'gemini-2.5-flash-preview-05-20', name: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
    { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite' },
  ],
  openrouter: [
    { id: 'anthropic/claude-opus-4-6', name: 'Claude Opus 4.6' },
    { id: 'anthropic/claude-sonnet-4-6', name: 'Claude Sonnet 4.6' },
    { id: 'openai/gpt-4.1', name: 'GPT-4.1' },
    { id: 'google/gemini-2.5-pro-preview', name: 'Gemini 2.5 Pro' },
    { id: 'x-ai/grok-3', name: 'Grok 3' },
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
