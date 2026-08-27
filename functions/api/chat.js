// دالة Cloudflare Pages — بتستقبل الطلب من الموقع بصيغة Anthropic،
// وبتحوّله لصيغة Google Gemini المجانية، وبترجع الجواب موحّد.

export async function onRequestPost(context) {
  const { request, env } = context;

  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: {
          message:
            "مفتاح Gemini غير مضبوط. أضفه من إعدادات المشروع على Cloudflare باسم GEMINI_API_KEY.",
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let payload;
  try {
    payload = await request.json();
  } catch (e) {
    return new Response(
      JSON.stringify({ error: { message: "طلب غير صالح" } }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { system, messages = [], max_tokens = 2048, tools = [] } = payload || {};

  const contents = messages.map((m) => {
    const role = m.role === "assistant" ? "model" : "user";
    let parts = [];
    if (typeof m.content === "string") {
      parts = [{ text: m.content }];
    } else if (Array.isArray(m.content)) {
      parts = m.content.map((block) => {
        if (block.type === "text") return { text: block.text || "" };
        if (block.type === "image" && block.source) {
          return {
            inline_data: {
              mime_type: block.source.media_type,
              data: block.source.data,
            },
          };
        }
        return { text: "" };
      });
    }
    return { role, parts };
  });

  const geminiBody = {
    contents,
    generationConfig: { maxOutputTokens: max_tokens },
  };
  if (system) {
    geminiBody.system_instruction = { parts: [{ text: system }] };
  }
  if (Array.isArray(tools) && tools.length > 0) {
    geminiBody.tools = [{ google_search: {} }];
  }

  const model = "gemini-flash-latest";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
    });
    const data = await response.json();

    if (!response.ok) {
      const msg =
        data.error && data.error.message
          ? data.error.message
          : "HTTP " + response.status;
      return new Response(JSON.stringify({ error: { message: msg } }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const candidate = data.candidates && data.candidates[0];
    const text =
      candidate && candidate.content && candidate.content.parts
        ? candidate.content.parts.map((p) => p.text || "").join("\n")
        : "";

    return new Response(
      JSON.stringify({ content: [{ type: "text", text }] }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: { message: err.message } }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
