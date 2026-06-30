import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parser with a large limit for Blogger templates
  app.use(express.json({ limit: '15mb' }));

  // API Route: Explain template using Gemini API
  app.post("/api/explain-template", async (req, res) => {
    try {
      const { xmlContent } = req.body;
      if (!xmlContent || typeof xmlContent !== "string") {
        return res.status(400).json({ error: "الرجاء إدخال كود القالب بشكل صحيح! | Please provide valid XML content!" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ 
          error: "لم يتم تكوين مفتاح Gemini API في خادم التطبيق! الرجاء إضافته في الإعدادات. | GEMINI_API_KEY is not configured in Server Secrets!" 
        });
      }

      // Initialize Gemini Client
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Truncate template if absolutely huge to keep API calls smooth and within payload limits
      const xmlSnippet = xmlContent.length > 500000 
        ? xmlContent.substring(0, 500000) + "\n\n<!-- [...تكملة الكود تم اختصارها لتجاوز حدود الإدخال المسموح بها...] -->" 
        : xmlContent;

      const prompt = `أنت خبير محترف ومبدع في تطوير وتصميم قوالب بلوجر (Blogger XML Templates).
مهمتك هي شرح كود وقالب بلوجر المرفق بطريقة تفصيلية وسهلة جداً وممتعة ومبسطة للمبتدئين باللغة العربية (الفصحى).

الرجاء تحليل الكود بالكامل وشرح النقاط التالية بوضوح باستخدام تنسيق Markdown منسق وأنيق مع استخدام العناوين والأيقونات التعبيرية (Emoji) لتبسيط المعنى:

1. 📝 **مقدمة ونظرة عامة**: طبيعة هذا القالب (تقني، رياضي، إخباري، إلخ)، انطباعك العام عن جودة الكود، وخصائصه الأساسية المكتشفة.
2. 🧱 **شرح كافة الوجت (Widgets - <b:widget>) المكتشفة**:
   - اذكر معرّف كل وجت (Widget ID) ونوعه (Type) مثل (Header, Blog, AdSense, HTML, PopularPosts, etc.).
   - اشرح وظيفة كل وجت بالتفصيل وكيف يؤثر على مظهر القالب وتجربة الزائر.
3. 🗺️ **شرح الأقسام الرئيسية (Sections - <b:section>)**:
   - اذكر الأقسام الأساسية في القالب (مثل header, main, sidebar, footer, etc.) ودور كل قسم في تنظيم المحتوى وتقسيم الصفحة.
4. ⚙️ **شرح الأكواد البرمجية والسكربتات (Scripts & Javascript)**:
   - حدد السكربتات البرمجية المدمجة أو الخارجية المستدعاة في القالب.
   - وضح وظيفة كل سكربت برمجياً (مثال: توليد القائمة الجانبية، تشغيل سلايدر الصور، أزرار المشاركة، نظام التعليقات، إلخ).
5. 🛡️ **فحص أمني وتحليل الأكواد المعقدة**:
   - وضح باختصار ما إذا كان القالب يحتوي على حمايات لإزالة الحقوق أو إعادة توجيه مشبوهة، وكيف يتعامل معها برمجياً.
6. 💡 **نصائح وتوصيات ذهبية للمبتدئين**:
   - نصائح مخصصة بناءً على كود القالب لتعديله بأمان، تحسين سرعته، أو كيفية إدارته من لوحة تحكم بلوجر (Layout).

هذا هو كود قالب بلوجر المطلوب شرحه:
-------------------------
${xmlSnippet}
-------------------------`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const explanation = response.text;
      return res.json({ explanation });

    } catch (error: any) {
      console.error("Error explaining template with Gemini:", error);
      return res.status(500).json({ 
        error: error.message || "حدث خطأ أثناء معالجة الطلب عبر الذكاء الاصطناعي. | Failed to process AI explanation request." 
      });
    }
  });

  // API Route: Generate Blogger Widgets using Gemini API
  app.post("/api/generate-widget", async (req, res) => {
    try {
      const { widgetType, customPrompt } = req.body;
      if (!widgetType) {
        return res.status(400).json({ error: "الرجاء تحديد نوع الأداة لتوليدها! | Please specify a widget type!" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ 
          error: "لم يتم تكوين مفتاح Gemini API في خادم التطبيق! الرجاء إضافته في الإعدادات. | GEMINI_API_KEY is not configured in Server Secrets!" 
        });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `أنت مصمم ومطور قوالب بلوجر محترف جداً وخبير في واجهات المستخدم الحديثة لعام 2026.
مهمتك هي إنشاء أداة بلوجر (Blogger Widget) متكاملة ومصممة بأحدث صيحات التصميم الحديث لعام 2026.

نوع الأداة المطلوب إنشاؤها: ${widgetType}
تخصيصات أو طلبات إضافية: ${customPrompt || 'لا يوجد طلبات مخصصة.'}

يرجى توليد الكود البرمجي الكامل للأداة (HTML, CSS مدمج بأسلوب أنيق، و JavaScript متطور ذو تأثيرات انسيابية) ليعمل مباشرة داخل مدونة بلوجر كـ HTML/Javascript Widget.
تأكد من التالي:
1. أن يكون التصميم متجاوباً تماماً (Responsive) ويدعم الوضع المظلم (Dark Mode-friendly) تلقائياً.
2. أن تكون الأداة سهلة التخصيص والألوان متناسقة وعصرية (مثال: استخدام تدرجات لطيفة وتأثيرات hover رائعة).
3. استخدام لغات برمجة نظيفة (Vanilla ES6 JavaScript) وتجنب استخدام مكتبات خارجية ثقيلة مثل jQuery ما لم يكن ضرورياً جداً.
4. باللغة العربية والانجليزية معاً ليكون متاحاً لجميع المستخدمين.
5. وفر كود HTML نظيف يمكن نسخه ولصقه مباشرة أو إدراجه تلقائياً.

يرجى إعطاء الشرح المناسب للأداة أولاً، ثم ضع الكود الكامل للأداة داخل كتلة كود واحدة مخصصة لسهولة القراءة والنسخ.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      return res.json({ result: response.text });
    } catch (error: any) {
      console.error("Error generating widget:", error);
      return res.status(500).json({ 
        error: error.message || "حدث خطأ أثناء معالجة توليد الأداة عبر الذكاء الاصطناعي. | Failed to generate widget." 
      });
    }
  });

  // API Route: Convert layouts/Figma to Blogger XML using Gemini API
  app.post("/api/convert-to-blogger", async (req, res) => {
    try {
      const { designCode, designType } = req.body;
      if (!designCode || typeof designCode !== "string") {
        return res.status(400).json({ error: "الرجاء إدخال كود التصميم أو التصدير لتحويله! | Please provide valid design code!" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ 
          error: "لم يتم تكوين مفتاح Gemini API في خادم التطبيق! الرجاء إضافته في الإعدادات. | GEMINI_API_KEY is not configured in Server Secrets!" 
        });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `أنت خبير فائق الذكاء في تصميم وبرمجة قوالب بلوجر (Blogger XML Template Engineer).
تصلك تصاميم على شكل (HTML/CSS أو تصدير Figma أو كود تصميم ZIP) وعليك تحويلها بالكامل إلى قالب بلوجر XML متكامل صالح للرفع والعمل مباشرة على منصة Blogger.

صيغة التصميم المرفق: ${designType}
الكود أو التصميم المرفق:
-------------------------
${designCode.substring(0, 300000)}
-------------------------

المطلوب:
تحليل هذا التصميم وبناء قالب بلوجر XML كامل من الصفر يحتوي على:
1. وسم <b:skin> يحتوي على كافة الأنماط وتنسيقات CSS المستخرجة من التصميم مع تنظيمها وتجانسها.
2. الهيكل الرئيسي القياسي لقوالب بلوجر بما في ذلك وسوم <html...>, <head>, <body>.
3. إنشاء الأقسام الرئيسية <b:section> والوجتات الأساسية <b:widget> مثل (Header, Blog, Sidebar, Footer) بشكل متوافق تماماً مع شروط بلوجر.
4. التأكد من إدراج وسم <b:widget type='Blog' id='Blog1'/> المفرتض لضمان قبول القالب من معالج بلوجر.
5. جعل القالب متجاوباً بالكامل وسريعاً، مع الحفاظ الدقيق على الهوية البصرية والألوان والتصميم الخاص بالمدخلات المرفقة.

يرجى توليد قالب XML متكامل وجاهز، وضعه داخل كتلة كود XML واحدة. واكتب شرحاً موجزاً للخطوات والتعديلات التي تمت لتحويل هذا التصميم بالكامل.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      return res.json({ xml: response.text });
    } catch (error: any) {
      console.error("Error converting design to Blogger:", error);
      return res.status(500).json({ 
        error: error.message || "حدث خطأ أثناء معالجة التحويل إلى قالب بلوجر. | Failed to convert design." 
      });
    }
  });

  // API Route: Smart AI Modernizer (Upgrade template to 2026) using Gemini API
  app.post("/api/modernize-template", async (req, res) => {
    try {
      const { xmlContent } = req.body;
      if (!xmlContent || typeof xmlContent !== "string") {
        return res.status(400).json({ error: "الرجاء إدخال كود القالب للترقية! | Please provide valid XML content!" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ 
          error: "لم يتم تكوين مفتاح Gemini API في خادم التطبيق! الرجاء إضافته في الإعدادات. | GEMINI_API_KEY is not configured in Server Secrets!" 
        });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const xmlSnippet = xmlContent.length > 400000 
        ? xmlContent.substring(0, 400000) + "\n\n<!-- [...تكملة الكود تم اختصارها...] -->" 
        : xmlContent;

      const prompt = `أنت المهندس الأول والعبقري لتطوير وتحديث قوالب بلوجر لعام 2026 (Lead Blogger Modernizer).
لقد تم إعطاؤك قالب بلوجر قديم أو غير محسن، والمطلوب منك ترقيته بالكامل ليكون قالباً عصرياً، فائق السرعة، وممتع بصرياً ومتوافقاً بالكامل مع معايير الويب لعام 2026 (Smart Upgrade to 2026).

الكود البرمجي الحالي للقالب:
-------------------------
${xmlSnippet}
-------------------------

المطلوب منك ترقية القالب وإجراء التحديثات التالية:
1. **تحديث التصميم العام و CSS**: تحسين الأنماط، إضافة هوامش مريحة، استخدام المتغيرات الحديثة للألوان، وتحسين استجابة وتوافق القالب (Responsive Design) مع كافة أحجام الهواتف والشاشات اللوحية.
2. **الوضع المظلم المتكامل (Full Dark Mode Support)**: إدراج وتهيئة نظام الأنماط للوضع الداكن (Dark Mode) في الـ CSS، مع كتابة سكربت Vanilla JS ذكي في أسفل القالب لحفظ تفضيل المستخدم في localStorage وإنشاء زر/أيقونة للتبديل تظهر في رأس الصفحة تلقائياً.
3. **تحسين السرعة الفائقة والأداء (LCP & CLS Optimization)**:
   - إضافة وسوم Preconnect و DNS-Prefetch المناسبة للمطالع والموارد الشهيرة في <head>.
   - تعيين السمة loading="lazy" للصور (img) والآيفريمز (iframe).
   - إدراج هيكل وهيكل مؤقت Skeleton Loading متكامل لمنع تذبذب وتغيير الهيكل أثناء اللود (CLS Improvement).
   - تهيئة font-display: swap في أنماط الخطوط.
4. **تغيير الخطوط وتحديث الأيقونات**: استبدال الخطوط القديمة البالية (مثل Arial, Tahoma) بخطوط Google Font رائعة الجمال ومتطابقة (مثل Cairo للعناوين، و Tajawal للنصوص).
5. **إلغاء وحذف الأكواد القديمة (Clean Legacy Code)**: التخلص من استدعاءات jQuery القديمة غير الضرورية، وإزالة السكربتات البطيئة ومطارد التتبع الزائدة لتحرير القالب.
6. **تحديث الـ Slider والأجزاء الديناميكية**: تحسين سلايدر المقالات أو القوائم المنسدلة لتعمل بلغة جافا سكربت حديثة (ES6 vanilla) بدون أخطاء.
7. **تحسين الـ SEO وسرعة الفتح**: إدراج أحدث وسوم الميتا تاغ والمحركات المساعدة لزيادة التقييم والأرشفة لدى محركات البحث.

يرجى مراجعة وتعديل كود قالب بلوجر XML بالكامل، وموافاتنا بالكود المطور والمحدث الجديد بالكامل داخل كتلة كود XML واحدة. واكتب تقريراً قصيراً باللغة العربية يوضح بالتفصيل كافة الترقيات المدهشة التي قمت بها في هذا القالب.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      return res.json({ xml: response.text });
    } catch (error: any) {
      console.error("Error modernizing template:", error);
      return res.status(500).json({ 
        error: error.message || "حدث خطأ أثناء ترقية وتحديث القالب بالذكاء الاصطناعي. | Failed to modernize template." 
      });
    }
  });

  // Serve static assets or mount Vite server
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
