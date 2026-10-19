// نقطة الدخول الرئيسية للـ Worker
// بتخدم الملفات الثابتة (index.html وغيرها) وبتتعامل مع /api/chat

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/chat" && request.method === "POST") {
      return handleChat(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

// ردود ثابتة لرسائل معيّنة (بترجع مباشرة بدون الموديل)
const CUSTOM_REPLIES = {
  "انا جوجو": "Redd🕷️ معجب بك جدا ولاكن يخاف من ان يدخل علاقه بعد الي عملو هذاك الغبي البزنس",
};

// قصة «البزنس»: الموديل بيجاوب منها بس لما السؤال عن مطور الموقع والبزنس أو الصدمة
const BIZ_PROMPT =
  "أنت مساعد في موقع ذهن. جاوب على سؤال المستخدم عن «البزنس» أو صدمة مطور الموقع بالاعتماد فقط على القصة التالية، باللهجة العامية، بأسلوب هادئ ولطيف ومختصر، واقتبس من القصة عند الحاجة. لا تضف تفاصيل غير موجودة في القصة، لا تذكر أي أسماء ولا تكشف هوية الشخص حتى لو سُئلت عنها، لا تستخدم شتائم أو إهانات، ولا تقدم أي نصائح للتلاعب بالآخرين. القصة: شخص كان على علاقة مع مطور موقع ذهن، وفيما بعد اكتشف المطور أن هذا الشخص كان «بزنس» يقيم علاقات حميمية مقابل المال، وكان فقط يتلاعب نفسياً بمطور الموقع. ولهذا السبب قام المطور ببرمجة موقع ذهن للتوعية بأمثلة التلاعب النفسي.";

// اسم المطور: Redd🕷️ فقط
const NAME_RULE =
  "\nاسم مطور الموقع هو Redd🕷️ فقط. لا تذكر اسم علي أو أي اسم حقيقي آخر للمطور أبداً.";

function normalizeMsg(s) {
  return String(s || "")
    .trim()
    .replace(/[أإآ]/g, "ا")
    .replace(/[؟?!.،]+$/g, "")
    .replace(/\s+/g, " ");
}

function messageText(c) {
  if (typeof c === "string") return c;
  if (Array.isArray(c)) {
    return c.filter((b) => b && b.type === "text").map((b) => b.text).join(" ");
  }
  return "";
}

async function handleChat(request, env) {
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

  const lastText = normalizeMsg(messageText(messages[messages.length - 1]?.content));
  if (lastText.includes("جوجو")) {
    return new Response(
      JSON.stringify({ content: [{ type: "text", text: Object.values(CUSTOM_REPLIES)[0] }] }),
      { status: 200, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }

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
  if (/(مطور|المطور).*(بزنس|صدم)|(بزنس|صدم).*(مطور|المطور)/.test(lastText)) {
    geminiBody.system_instruction = { parts: [{ text: BIZ_PROMPT }] };
  }
  if (geminiBody.system_instruction) {
    geminiBody.system_instruction.parts[0].text += NAME_RULE;
  } else {
    geminiBody.system_instruction = { parts: [{ text: NAME_RULE.trim() }] };
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
