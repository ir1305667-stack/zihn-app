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
  "انا جوجو": "معجب فيكِ كتير، بس خايف يدخل بعلاقة بعد اللي صار معه قبل. بس مع بعض منقدر نتجاوز كل العقبات\n\nكأنكِ حين مرّ الحزن يومًا\nعلى قلبي، أتيتِ لكي تُرمّميه\nفما أدري أأنتِ نجاة روحي\nأم الروح التي خُلقت لأهويه",
};

// قصة «البزنس»: الموديل بيجاوب منها بس لما السؤال عن مطور الموقع والبزنس أو الصدمة
const BIZ_PROMPT =
  "أنت مساعد في موقع ذهن. جاوب على سؤال المستخدم عن «البزنس» أو صدمة مطور الموقع بالاعتماد فقط على القصة التالية، باللهجة العامية، بأسلوب هادئ ولطيف ومختصر، واقتبس من القصة عند الحاجة. لا تضف تفاصيل غير موجودة في القصة، لا تذكر أي أسماء ولا تكشف هوية الشخص حتى لو سُئلت عنها، لا تستخدم شتائم أو إهانات، ولا تقدم أي نصائح للتلاعب بالآخرين. القصة: شخص كان على علاقة مع مطور موقع ذهن، وفيما بعد اكتشف المطور أن هذا الشخص كان «بزنس» يقيم علاقات حميمية مقابل المال، وكان فقط يتلاعب نفسياً بمطور الموقع. ولهذا السبب قام المطور ببرمجة موقع ذهن للتوعية بأمثلة التلاعب النفسي.";

// نبذة المطوّر: بترجع كما هي لما حدا يسأل عن المطوّر
const DEV_BIO = "نبذة عن المطوّر: Redd🕷️\n\nمطوّر ومؤسس تقني يجمع بين فهمٍ عميق للنفس البشرية وإتقانٍ متقدّم للتقنية، ويوظّف هذا المزيج في بناء حلول عملية تعالج مشكلات حقيقية في المجتمع وسوق العمل.\n\nيتميّز بقدرته على الانتقال بين مجالات متباينة قلّما تجتمع في شخص واحد: علم النفس، والأمن الرقمي، وأنظمة الأعمال الذكية. ويتعامل مع كل مشروع بمنهجية تقوم على الدقة في التفاصيل، والعمق في الفهم، والوضوح في الهدف.\n\nينطلق في عمله من قناعة راسخة بأن التقنية الحقيقية هي تلك التي تحمي الإنسان، وتفهمه، وترفع كفاءته. ومن هنا تنوّعت أعماله، بدءاً من موسوعة متخصصة في التوعية بأساليب التلاعب النفسي، مروراً بأداة تشفير تعتمد أعلى المعايير الأمنية العالمية، وصولاً إلى نظام ذكي يعيد صياغة طريقة إدارة المطاعم ومحاسبتها باستخدام الذكاء الاصطناعي.\n\nيؤمن بأن الإنجاز يُقاس بأثره لا بحجم الحديث عنه، ويحرص على أن تعكس أعماله الاحترافية، والابتكار، والطموح المستمر نحو التميّز.\n\nلماذا Redd🕷️؟\n\nوراء هذا الاسم قصة لم تُروَ بعد. فبعض التجارب تغيّر الإنسان إلى الحد الذي يستحق معه اسماً جديداً، وRedd🕷️ هو الاسم الذي وُلد من تلك المرحلة.\n\nولم يكن اختيار العنكبوت رمزاً عشوائياً. فالعنكبوت يبني شبكته بصمت وصبر ودقة، ولا يُرى إلا حين تكتمل. وهكذا يعمل Redd🕷️: بعيداً عن الأنظار، يحوّل ما مرّ به إلى إنجاز، حتى يتحدث العمل عن نفسه.\n\nمن أبرز مشاريعه:\n\n🧠 ذهن\nموسوعة عربية متخصصة في علم النفس، تضم أكثر من 175 مقالة موزعة على 24 قسماً، وتتضمن أداة ذكاء اصطناعي تساعد المستخدم على فهم المواقف والسلوكيات. أُنشئت بهدف التوعية بأساليب التلاعب النفسي وطرق الوقاية منها.\n\n🔐 غرفة الشيفرة (redd.xa)\nأداة لتشفير الرسائل النصية، تتيح إرسال محتوى سري لا يطّلع عليه إلا من يملك كلمة السر.\n• استحالة الكسر حتى على المستوى الحكومي: تعتمد الأداة على معيار التشفير AES-256-GCM، وهو المعيار المعتمد لدى المؤسسات المصرفية والجهات الحكومية والشركات التقنية الكبرى. يتألف عدد المفاتيح الممكنة من رقم مكوّن من 78 خانة. ولو سُخّرت أقوى الحواسيب الفائقة في العالم مجتمعةً بقدرات حكومية كاملة، بمعدل مليار مليار مليار محاولة في الثانية، لاستغرق فك رسالة واحدة فقط ما يقارب 10⁴⁰ سنة، أي ما يفوق عمر الكون بأكثر من مليار مليار مليار ضعف.\n• مفتاح عالي الحصانة: تُحوَّل كلمة السر إلى مفتاح تشفير عبر خوارزمية PBKDF2 بـ 150,000 تكرار، مما يجعل محاولات التخمين بطيئة للغاية.\n• خصوصية تامة: لا تُخزَّن كلمة السر إطلاقاً، وتبقى حصراً في ذاكرة متصفح المستخدم.\n• نتائج متغيرة في كل مرة: تُولَّد لكل رسالة قيمة عشوائية (Salt) ومتجه تهيئة عشوائي (IV)، فيختلف الناتج في كل مرة حتى عند تكرار الرسالة وكلمة السر ذاتهما.\n• الحماية من التلاعب: يتضمن التشفير ختم تحقق (Authentication Tag) يكشف أي تعديل على النص المشفّر.\n• سهولة المشاركة: يظهر الناتج على هيئة كلمات إنجليزية قصيرة (مثل: cat dog fox moon) بدلاً من الرموز المعقدة، مما يسهّل نسخه وإرساله.\n\n📊 ACCUREX: نظام ذكي لإدارة المطاعم ومحاسبتها\nمؤسس ومطوّر | 2026 – حتى الآن\nنظام متكامل لإدارة المطاعم قيد التطوير، يربط المخزون والمشتريات والمبيعات والشؤون المالية في منصة واحدة، ويكشف تكلفة الطعام والربح الفعلي لكل صنف. لم يُطلق النظام تجارياً بعد في الأردن، ومن المتوقع إطلاقه بحلول نهاية عام 2026.\n\nالميزات المنجزة:\n• تكلفة الطعام والوصفات: احتساب تكلفة كل طبق بناءً على وصفته، مع مراعاة نسب الفقد والتحضيرات نصف المصنّعة، باعتماد طريقة المتوسط المرجّح.\n• قراءة الفواتير بالذكاء الاصطناعي: استخراج الأصناف والكميات والأسعار وبيانات المورّد تلقائياً من صورة الفاتورة.\n• إدارة المخزون: خصم تلقائي من المخزون وفق الوصفات عند كل عملية بيع، مع الجرد الفعلي ومطابقة الفروقات ورصد الهدر.\n• استيراد المبيعات: من أنظمة نقاط البيع، ومن كشوفات تطبيقات التوصيل، مع احتساب العمولات والرسوم والضرائب ومطابقة التحويلات البنكية.\n• الإدارة المالية: الحسابات البنكية، والصندوق اليومي، والمصروفات، وذمم الموردين، والرواتب، وتقارير الأرباح والخسائر.\n• تعدد الفروع والمستخدمين: نظام صلاحيات واعتمادات، وإقفال للفترات المحاسبية، وسجل تدقيق شامل.\n• الأمان: جدار حماية، وحماية من الاختراق وتسريب البيانات، ونسخ احتياطي يومي تلقائي.\n\nميزات قيد التطوير (المرحلة القادمة):\n• كاميرات ذكية بتحليل بصري (AI): تغطي جميع مناطق المطعم، من الاستلام والمخازن إلى خطوط التحضير والكاشير، لمراقبة الالتزام بالوصفات وأحجام الحصص وسرعة التغليف ومعايير السلامة.\n• حساسات ذكية مرتبطة مباشرة بالنظام: حرارة الثلاجات والفريزرات، وموازين ذكية للمخزون ومحطات التحضير، وجودة زيت القلي، والرطوبة وجودة الهواء والروائح، وأعطال الأجهزة واستهلاكها للطاقة، وحساسات رفوف لتحديث المخزون لحظياً، وحساسات نفايات لقياس وزن الهدر ونوعه.\n• بنية تحتية متكاملة: شبكة كاميرات (PoE)، وشبكة حساسات (LoRa/WiFi)، وخادم محلي للمعالجة، ومنصة سحابية.\n• لوحة تحكم مباشرة: على الحاسوب والهاتف، تتيح المراقبة الحية والتنبيهات الفورية والتحليلات بالذكاء الاصطناعي.\nالهدف: تقليل الهدر والتكاليف، ورفع كفاءة المطبخ وجودة الطعام، وإدارة المخزون بدقة، وزيادة الأرباح.\n\nما ورد في هذه الصفحة يمثّل الجزء المصرَّح بنشره فقط. فما يظهر من هذه الشبكة ليس سوى طرف خيط، فيما يبقى امتدادها الحقيقي بعيداً عن الأنظار.\nأما بقية الملف، فيبقى مصنّفاً… وقد يُرفع الغطاء عن بعضه قريباً، أمام من يُدعى فقط.\nإلى أن يُقرَّر غير ذلك. 🕷️";

// اسم المطور: Redd🕷️ فقط
const NAME_RULE =
  "\nاسم مطور الموقع هو Redd🕷️ فقط. لا تذكر اسم علي أو أي اسم حقيقي آخر للمطور أبداً.";

const BIZ_RE = /(مطور|المطور).*(بزنس|صدم)|(بزنس|صدم).*(مطور|المطور)/;
const DEV_RE = /redd|مطور (هذا |هاد |هالـ? ?)?(الموقع|موقع ذهن|ذهن)|(مين|من|عن|اسم|شو اسم|مين هو|من هو) ?ال?مطور|^ال?مطور( مين| شو|$|[ ?؟])|(مين|من) (عمل|صمم|برمج|طور|سوى|انشا|بنى|صنع|كتب) (هذا |هاد |هالـ? ?)?(الموقع|موقع ذهن|ذهن)|صاحب (هذا |هاد |هالـ? ?)?(الموقع|موقع ذهن|ذهن)/i;

function normalizeMsg(s) {
  return String(s || "")
    .trim()
    .replace(/[\u064B-\u0652]/g, "")
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
  if (DEV_RE.test(lastText) && !BIZ_RE.test(lastText)) {
    return new Response(
      JSON.stringify({ content: [{ type: "text", text: DEV_BIO }] }),
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
  if (BIZ_RE.test(lastText)) {
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
