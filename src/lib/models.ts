export interface ModelOption {
  id: string;
  label: string;
  provider: string;
  family: "frontier" | "fast" | "reasoning";
  description: string;
  badge?: string;
  vision?: boolean;
}

// Only models actually available through Lovable AI Gateway.
export const MODELS: ModelOption[] = [
  {
    id: "google/gemini-3-flash-preview",
    label: "Gemini 3 Flash",
    provider: "Google",
    family: "fast",
    description: "Fast, balanced. Great default.",
    badge: "Default",
    vision: true,
  },
  {
    id: "google/gemini-3.1-pro-preview",
    label: "Gemini 3.1 Pro",
    provider: "Google",
    family: "frontier",
    description: "Next-gen reasoning, large context.",
    vision: true,
  },
  {
    id: "google/gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    provider: "Google",
    family: "frontier",
    description: "Deep reasoning for complex tasks.",
    vision: true,
  },
  {
    id: "google/gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    provider: "Google",
    family: "fast",
    description: "Quick replies, low latency.",
    vision: true,
  },
  {
    id: "google/gemini-2.5-flash-lite",
    label: "Gemini 2.5 Flash Lite",
    provider: "Google",
    family: "fast",
    description: "Cheapest & fastest Gemini.",
    vision: true,
  },
  {
    id: "openai/gpt-5",
    label: "GPT-5",
    provider: "OpenAI",
    family: "frontier",
    description: "Top-tier reasoning and writing.",
    vision: true,
  },
  {
    id: "openai/gpt-5-mini",
    label: "GPT-5 Mini",
    provider: "OpenAI",
    family: "fast",
    description: "Affordable, capable, fast.",
    vision: true,
  },
  {
    id: "openai/gpt-5-nano",
    label: "GPT-5 Nano",
    provider: "OpenAI",
    family: "fast",
    description: "Highest throughput, lowest cost.",
    vision: true,
  },
  {
    id: "openai/gpt-5.2",
    label: "GPT-5.2",
    provider: "OpenAI",
    family: "reasoning",
    description: "Enhanced reasoning model.",
    vision: true,
  },
  {
    id: "openai/gpt-5.4",
    label: "GPT-5.4",
    provider: "OpenAI",
    family: "reasoning",
    description: "Advanced multi-step reasoning.",
    badge: "Reasoning",
    vision: true,
  },
];

export function getModel(id: string): ModelOption {
  return MODELS.find((m) => m.id === id) ?? MODELS[0];
}
