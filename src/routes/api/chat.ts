import { createFileRoute } from "@tanstack/react-router";

async function performWikipediaSearch(query: string) {
  try {
    const s = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json`,
    );
    const sData = await s.json();
    if (sData.query?.search?.length > 0) {
      const top = sData.query.search[0];
      const e = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exsentences=10&exlimit=1&titles=${encodeURIComponent(top.title)}&explaintext=1&formatversion=2&format=json`,
      );
      const eData = await e.json();
      if (eData.query?.pages?.[0]?.extract) {
        return `Source: Wikipedia (${top.title})\nContent: ${eData.query.pages[0].extract}`;
      }
    }
    return null;
  } catch (e) {
    return null;
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
                const enqueueMessage = (text: string) => {
                  controller.enqueue(
                    new TextEncoder().encode(
                      `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`,
                    ),
                  );
                };

                enqueueMessage(">*Initiating deep research...*\n\n");

                try {
                  const lastUserMessage = messages[messages.length - 1].content;
                  const userText =
                    typeof lastUserMessage === "string"
                      ? lastUserMessage
                      : JSON.stringify(lastUserMessage);

                  enqueueMessage(">*Generating search strategies...*\n\n");
                  const qResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${apiKey}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      model: "google/gemini-3-flash-preview",
                      messages: [
                        {
                          role: "system",
                          content:
                            "You are a research agent. Generate up to 3 Wikipedia search queries to investigate the user's prompt. Output ONLY a valid JSON array of strings.",
                        },
                        { role: "user", content: userText },
                      ],
                      temperature: 0.1,
                    }),
                  });
                  const qData = await qResp.json();
                  let queries: string[] = [];
                  try {
                    const text = qData.choices?.[0]?.message?.content?.trim() || "";
                    const match = text.match(/\[.*\]/s);
                    queries = JSON.parse(match ? match[0] : text);
                    if (!Array.isArray(queries)) queries = [userText];
                  } catch (e) {
                    queries = [userText];
                  }

                  enqueueMessage(
                    `>*Executing searches for: ${queries.slice(0, 3).join(", ")}...*\n\n`,
                  );
                  const results = [];
                  for (const q of queries.slice(0, 3)) {
                    const res = await performWikipediaSearch(q);
                    if (res) results.push(res);
                  }

                  enqueueMessage(">*Synthesizing findings...*\n\n---\n\n");

                  const researchContext =
                    "DEEP RESEARCH RESULTS:\n\n" +
                    (results.length > 0 ? results.join("\n\n") : "No relevant information found.");
                  finalMessages.splice(finalMessages.length - 1, 0, {
                    role: "system",
                    content: researchContext,
                  });
                } catch (e) {
                  enqueueMessage(
                    ">*Deep research failed, proceeding with general knowledge...*\n\n---\n\n",
                  );
                }

                const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    model: model || "google/gemini-3-flash-preview",
                    stream: true,
                    temperature: typeof temperature === "number" ? temperature : undefined,
                    messages: finalMessages,
                  }),
                });

                if (!upstream.ok || !upstream.body) {
                  enqueueMessage("Error fetching upstream response.");
                  controller.close();
                  return;
                }

                const reader = upstream.body.getReader();
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  controller.enqueue(value);
                }
                controller.close();
              },
            });

            return new Response(stream, {
              headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
              },
            });
          }

          // Normal path
          const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
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
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
            },
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
