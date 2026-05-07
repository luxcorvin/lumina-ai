import { createFileRoute } from "@tanstack/react-router";

interface SearchHit {
  title: string;
  url: string;
  snippet: string;
}

const enc = new TextEncoder();
const sse = (controller: ReadableStreamDefaultController, text: string) =>
  controller.enqueue(
    enc.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`),
  );

async function ddgSearch(query: string, n = 4): Promise<SearchHit[]> {
  try {
    const r = await fetch(
      `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
      { headers: { "User-Agent": "Mozilla/5.0 AetherResearch/1.0" } },
    );
    const html = await r.text();
    const hits: SearchHit[] = [];
    const re =
      /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    let m;
    while ((m = re.exec(html)) && hits.length < n) {
      let url = m[1];
      const u = url.match(/uddg=([^&]+)/);
      if (u) url = decodeURIComponent(u[1]);
      const title = m[2].replace(/<[^>]+>/g, "").trim();
      const snippet = m[3].replace(/<[^>]+>/g, "").trim();
      if (url.startsWith("http") && title) hits.push({ url, title, snippet });
    }
    return hits;
  } catch {
    return [];
  }
}

async function wikiSearch(query: string): Promise<SearchHit | null> {
  try {
    const s = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&srlimit=1`,
    ).then((r) => r.json());
    const top = s.query?.search?.[0];
    if (!top) return null;
    const e = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exsentences=8&exlimit=1&titles=${encodeURIComponent(top.title)}&explaintext=1&formatversion=2&format=json`,
    ).then((r) => r.json());
    const extract = e.query?.pages?.[0]?.extract ?? "";
    return {
      title: `Wikipedia — ${top.title}`,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(top.title.replace(/ /g, "_"))}`,
      snippet: extract.slice(0, 1200),
    };
  } catch {
    return null;
  }
}

async function planQueries(userText: string, apiKey: string): Promise<string[]> {
  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You are a research planner. Given a user prompt, output 3-4 distinct, highly targeted web search queries to investigate it from multiple angles. Output ONLY a JSON array of strings, no prose.",
          },
          { role: "user", content: userText },
        ],
      }),
    });
    const data = await r.json();
    const text: string = data.choices?.[0]?.message?.content?.trim() ?? "";
    const m = text.match(/\[[\s\S]*\]/);
    const arr = JSON.parse(m ? m[0] : text);
    return Array.isArray(arr) ? arr.slice(0, 4).map(String) : [userText];
  } catch {
    return [userText];
  }
}

export const Route = createFileRoute("/api/chat")({
  // @ts-expect-error server handlers not yet typed
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const { messages, model, systemPrompt, temperature, tool } = await request.json();
          const apiKey = process.env.LOVABLE_API_KEY;
          if (!apiKey) {
            return new Response(JSON.stringify({ error: "AI not configured" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          const sys =
            (systemPrompt && String(systemPrompt).trim()) ||
            "You are Aether, a thoughtful, fast, and elegant AI assistant. Be concise but rich. Format with markdown when helpful. Use code blocks for code.";

          const finalMessages = [{ role: "system", content: sys }, ...messages];

          if (tool === "deep_research") {
            const stream = new ReadableStream({
              async start(controller) {
                try {
                  const last = messages[messages.length - 1].content;
                  const userText = typeof last === "string" ? last : JSON.stringify(last);

                  sse(controller, "> 🔬 **Deep Research**\n\n");
                  sse(controller, "> _Step 1 — Planning search strategy…_\n\n");
                  const queries = await planQueries(userText, apiKey);
                  sse(
                    controller,
                    queries.map((q, i) => `> ${i + 1}. \`${q}\``).join("\n") + "\n\n",
                  );

                  sse(controller, `> _Step 2 — Searching the web (${queries.length} queries)…_\n\n`);
                  const allHits: SearchHit[] = [];
                  for (const q of queries) {
                    const [web, wiki] = await Promise.all([ddgSearch(q, 3), wikiSearch(q)]);
                    if (wiki) allHits.push(wiki);
                    allHits.push(...web);
                  }
                  // dedupe by url
                  const seen = new Set<string>();
                  const sources = allHits.filter((h) => {
                    if (seen.has(h.url)) return false;
                    seen.add(h.url);
                    return true;
                  }).slice(0, 12);

                  sse(controller, `> _Found ${sources.length} sources._\n\n`);
                  sse(controller, "> _Step 3 — Synthesizing report with citations…_\n\n---\n\n");

                  const sourceBlock = sources
                    .map(
                      (s, i) =>
                        `[${i + 1}] ${s.title}\nURL: ${s.url}\nExcerpt: ${s.snippet}`,
                    )
                    .join("\n\n");

                  finalMessages.splice(finalMessages.length - 1, 0, {
                    role: "system",
                    content:
                      "You are now synthesizing a DEEP RESEARCH report. Use ONLY the provided sources. " +
                      "Cite claims inline using bracketed numbers like [1], [3]. " +
                      "Structure: ## Executive Summary, ## Key Findings (bulleted), ## Analysis, ## Open Questions. " +
                      "Do NOT include a sources list at the end — the app appends it.\n\nSOURCES:\n\n" +
                      sourceBlock,
                  });

                  const upstream = await fetch(
                    "https://ai.gateway.lovable.dev/v1/chat/completions",
                    {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        model: model || "google/gemini-3-flash-preview",
                        stream: true,
                        temperature: typeof temperature === "number" ? temperature : 0.4,
                        messages: finalMessages,
                      }),
                    },
                  );

                  if (!upstream.ok || !upstream.body) {
                    sse(controller, "_Synthesis failed._");
                    controller.close();
                    return;
                  }

                  // pipe upstream SSE through, stripping trailing [DONE]
                  const reader = upstream.body.getReader();
                  const dec = new TextDecoder();
                  let buf = "";
                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buf += dec.decode(value, { stream: true });
                    let nl: number;
                    while ((nl = buf.indexOf("\n")) !== -1) {
                      const line = buf.slice(0, nl);
                      buf = buf.slice(nl + 1);
                      if (line.startsWith("data: ") && line.includes("[DONE]")) continue;
                      controller.enqueue(enc.encode(line + "\n"));
                    }
                  }

                  // append sources section
                  if (sources.length) {
                    let md = "\n\n---\n\n## Sources\n\n";
                    sources.forEach((s, i) => {
                      md += `${i + 1}. [${s.title}](${s.url})\n`;
                    });
                    sse(controller, md);
                  }
                  controller.enqueue(enc.encode("data: [DONE]\n\n"));
                } catch (e) {
                  console.error("deep_research error", e);
                  sse(controller, "\n\n_Deep research encountered an error._");
                } finally {
                  controller.close();
                }
              },
            });

            return new Response(stream, {
              headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
            });
          }

          if (tool === "web_search") {
            // lightweight grounding: one search round, inject as system context
            const last = messages[messages.length - 1].content;
            const userText = typeof last === "string" ? last : JSON.stringify(last);
            const [web, wiki] = await Promise.all([ddgSearch(userText, 4), wikiSearch(userText)]);
            const hits = [wiki, ...web].filter(Boolean) as SearchHit[];
            if (hits.length) {
              const block = hits
                .map((s, i) => `[${i + 1}] ${s.title} — ${s.url}\n${s.snippet}`)
                .join("\n\n");
              finalMessages.splice(finalMessages.length - 1, 0, {
                role: "system",
                content:
                  "WEB SEARCH RESULTS — cite using [n] inline and end with a short '## Sources' list with markdown links.\n\n" +
                  block,
              });
            }
          }

          const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: model || "google/gemini-3-flash-preview",
              stream: true,
              temperature: typeof temperature === "number" ? temperature : undefined,
              messages: finalMessages,
            }),
          });

          if (!upstream.ok) {
            const status = upstream.status;
            const msg =
              status === 429
                ? "Rate limit reached. Please slow down and try again."
                : status === 402
                  ? "AI credits exhausted. Add funds in Settings → Workspace → Usage."
                  : "AI gateway error.";
            return new Response(JSON.stringify({ error: msg }), {
              status,
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(upstream.body, {
            headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
          });
        } catch (err) {
          console.error("chat route error", err);
          return new Response(JSON.stringify({ error: "Unexpected error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
