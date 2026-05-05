export interface ModelOption {
  id: string;
  label: string;
  provider: string;
  family: "frontier" | "fast" | "open";
  description: string;
  badge?: string;
}

export const MODELS: ModelOption[] = [
  // Frontier (Lovable AI Gateway)
  {
    id: "google/gemini-3-flash-preview",
    label: "Gemini 3 Flash",
    provider: "Google",
    family: "fast",
    description: "Fast, balanced reasoning. Great default.",
    badge: "Default",
  },
  {
    id: "google/gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    provider: "Google",
    family: "frontier",
    description: "Deep reasoning for complex tasks.",
  },
  {
    id: "google/gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    provider: "Google",
    family: "fast",
    description: "Quick replies, low latency.",
  },
  {
    id: "openai/gpt-5",
    label: "GPT-5",
    provider: "OpenAI",
    family: "frontier",
    description: "Top-tier reasoning and writing.",
  },
  {
    id: "openai/gpt-5-mini",
    label: "GPT-5 Mini",
    provider: "OpenAI",
    family: "fast",
    description: "Affordable, capable, fast.",
  },

  // Open-source via OpenRouter
  {
    id: "openrouter/meta-llama/llama-3.3-70b-instruct",
    label: "Llama 3.3 70B",
    provider: "Meta · OpenRouter",
    family: "open",
    description: "Open-weight flagship. Strong general use.",
    badge: "Open",
  },
  {
    id: "openrouter/meta-llama/llama-3.1-405b-instruct",
    label: "Llama 3.1 405B",
    provider: "Meta · OpenRouter",
    family: "open",
    description: "Largest open Llama. Slower, very capable.",
    badge: "Open",
  },
  {
    id: "openrouter/mistralai/mixtral-8x22b-instruct",
    label: "Mixtral 8x22B",
    provider: "Mistral · OpenRouter",
    family: "open",
    description: "Sparse MoE. Fast & versatile.",
    badge: "Open",
  },
  {
    id: "openrouter/qwen/qwen-2.5-72b-instruct",
    label: "Qwen 2.5 72B",
    provider: "Qwen · OpenRouter",
    family: "open",
    description: "Excellent multilingual & coding.",
    badge: "Open",
  },
  {
    id: "openrouter/deepseek/deepseek-r1",
    label: "DeepSeek R1",
    provider: "DeepSeek · OpenRouter",
    family: "open",
    description: "Open reasoning model.",
    badge: "Open",
  },
  {
    id: "openrouter/nousresearch/hermes-3-llama-3.1-70b",
    label: "Hermes 3 70B",
    provider: "Nous · OpenRouter",
    family: "open",
    description: "Steerable open assistant.",
    badge: "Open",
  },
];

export function getModel(id: string): ModelOption {
  return MODELS.find((m) => m.id === id) ?? MODELS[0];
}
