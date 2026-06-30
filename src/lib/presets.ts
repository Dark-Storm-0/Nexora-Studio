// Prebuilt professional Blogger XML templates for the Free Library (مكتبة القوالب المجانية)
// Formatted with proper Blogger structural skeletons and fully responsive layouts.

export interface PresetTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  xml: string;
}

export const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: 'magazine',
    name: 'قالب المجلة الذكي (Magazine-Style)',
    category: 'Magazine',
    description: 'قالب عصري متعدد الأعمدة مخصص للمقالات والمنشورات الإبداعية مع تخطيط شبكي (Grid) وجاذبية بصرية فريدة.',
    icon: 'Layers',
    xml: `<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE html>
<html b:css='false' b:defaultmessages='true' b:responsive='true' b:version='2' class='v2' expr:dir='data:blog.languageDirection' xmlns='http://www.w3.org/1999/xhtml' xmlns:b='http://www.google.com/2005/gml/b' xmlns:data='http://www.google.com/2005/gml/data' xmlns:expr='http://www.google.com/2005/gml/expr'>
<head>
  <meta content='width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1' name='viewport'/>
  <title><data:view.title.escaped/></title>
  <b:skin><![CDATA[
    /* 
    * Name: Smart Magazine 2026
    * Designed for: Bloggers & Creators
    * Fully Responsive & SEO Optimized
    */
    body {
      background-color: #0f172a;
      color: #f1f5f9;
      font-family: 'Cairo', sans-serif;
      margin: 0;
      padding: 0;
    }
    .header-magazine {
      background: linear-gradient(135deg, #4f46e5, #6366f1);
      padding: 30px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    .magazine-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 25px;
      padding: 40px 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .post-card {
      background-color: #1e293b;
      border: 1px border #334155;
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.3s ease;
    }
    .post-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 25px rgba(99,102,241,0.2);
    }
    .post-img {
      height: 200px;
      background: #334155;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
    }
    .post-content {
      padding: 20px;
    }
    .post-title {
      font-size: 18px;
      margin-top: 0;
      color: #ffffff;
    }
    .footer {
      background-color: #020617;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #1e293b;
      font-size: 12px;
    }
  ]]></b:skin>
</head>
<body>
  <header class='header-magazine'>
    <h1>بوابة المجلة العصرية | Magazine Portal</h1>
    <p>تصميم مميز وتفاعلي متعدد الاستخدامات</p>
  </header>
  
  <b:section class='main' id='main' showaddelement='yes'>
    <b:widget id='Blog1' locked='false' title='مشاركات المدونة' type='Blog'>
      <b:includable id='main'>
        <div class='magazine-grid'>
          <div class='post-card'>
            <div class='post-img'>[صورة افتراضية للمقالة 1]</div>
            <div class='post-content'>
              <h3 class='post-title'>أحدث التقنيات لعام 2026 وتطوير واجهات المستخدم</h3>
              <p>كيف تساهم التقنيات الحديثة في تسريع وتحسين تجربة التصفح للمستخدمين.</p>
            </div>
          </div>
          <div class='post-card'>
            <div class='post-img'>[صورة افتراضية للمقالة 2]</div>
            <div class='post-content'>
              <h3 class='post-title'>استراتيجيات زيادة سرعة الأرشفة في محرك جوجل</h3>
              <p>نصائح متكاملة لتحسين الـ SEO الداخلي لمدونتك وجلب آلاف الزيارات المجانية.</p>
            </div>
          </div>
        </div>
      </b:includable>
    </b:widget>
  </b:section>

  <footer class='footer'>
    <p>© جميع الحقوق محفوظة لمدونتي - تم التطوير والتعريب بواسطة أداة Smart Blogger Suite</p>
  </footer>
</body>
</html>`
  },
  {
    id: 'movie',
    name: 'قالب سينما للمشاهدة والأفلام (Movie Cinema)',
    category: 'Movie',
    description: 'واجهة سينمائية داكنة كلياً ومبهرة، مع تأثيرات سلايدر للأفلام، وتقييم بالنجوم، وأزرار مشاهدة وتحميل سريعة.',
    icon: 'MonitorPlay',
    xml: `<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE html>
<html b:css='false' b:defaultmessages='true' b:responsive='true' b:version='2' class='v2' expr:dir='data:blog.languageDirection' xmlns='http://www.w3.org/1999/xhtml' xmlns:b='http://www.google.com/2005/gml/b' xmlns:data='http://www.google.com/2005/gml/data' xmlns:expr='http://www.google.com/2005/gml/expr'>
<head>
  <meta content='width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1' name='viewport'/>
  <title><data:view.title.escaped/></title>
  <b:skin><![CDATA[
    body {
      background-color: #060608;
      color: #e4e4e7;
      font-family: 'Tajawal', sans-serif;
      margin: 0;
      padding: 0;
    }
    .movie-header {
      background-color: #09090b;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #e11d48;
    }
    .movie-logo {
      color: #e11d48;
      font-size: 24px;
      font-weight: 900;
    }
    .hero-slider {
      background: linear-gradient(rgba(6,6,8,0.5), #060608), url('https://placehold.co/1200x500/09090b/e11d48') no-repeat center/cover;
      height: 400px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 40px;
    }
    .movie-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 20px;
      padding: 30px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .movie-card {
      background: #18181b;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #27272a;
      transition: all 0.2s ease;
      position: relative;
    }
    .movie-card:hover {
      transform: scale(1.05);
      border-color: #e11d48;
    }
    .movie-rating {
      position: absolute;
      top: 10px;
      left: 10px;
      background: rgba(225,29,72,0.9);
      color: white;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: bold;
    }
    .movie-thumbnail {
      height: 280px;
      background: #27272a;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #71717a;
    }
    .btn-watch {
      background-color: #e11d48;
      color: white;
      border: none;
      padding: 10px;
      width: 100%;
      font-weight: bold;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-watch:hover {
      background-color: #be123c;
    }
  ]]></b:skin>
</head>
<body>
  <header class='movie-header'>
    <div class='movie-logo'>CINEMA PRO</div>
    <p>مدونة الأفلام والمسلسلات الحصرية</p>
  </header>

  <div class='hero-slider'>
    <h2 style='color:#fff; font-size:32px; margin-bottom:5px;'>فيلم الإثارة والمغامرة القادم (2026)</h2>
    <p style='color:#a1a1aa; max-width:600px;'>شاهد العرض الترويجي الحصري والتحليل المتكامل للقصة والأبطال قبل الجميع مجاناً.</p>
  </div>

  <b:section class='main' id='main' showaddelement='yes'>
    <b:widget id='Blog1' locked='false' title='أحدث الأفلام' type='Blog'>
      <b:includable id='main'>
        <div class='movie-grid'>
          <div class='movie-card'>
            <span class='movie-rating'>★ 8.9</span>
            <div class='movie-thumbnail'>[بوستر الفيلم 1]</div>
            <div style='padding: 12px;'>
              <h4 style='margin:0 0 8px 0;'>Interstellar Odyssey</h4>
              <button class='btn-watch'>مشاهدة الآن</button>
            </div>
          </div>
          <div class='movie-card'>
            <span class='movie-rating'>★ 7.5</span>
            <div class='movie-thumbnail'>[بوستر الفيلم 2]</div>
            <div style='padding: 12px;'>
              <h4 style='margin:0 0 8px 0;'>Shadow Warriors 3</h4>
              <button class='btn-watch'>مشاهدة الآن</button>
            </div>
          </div>
        </div>
      </b:includable>
    </b:widget>
  </b:section>
</body>
</html>`
  },
  {
    id: 'anime',
    name: 'قالب أوتاكو والأنمي (Anime & Otaku)',
    category: 'Anime',
    description: 'تصميم جريء ومميز مستوحى من ثقافة الأنمي اليابانية، يعتمد على الألوان الفاقعة والتنسيق المتجاوب السريع والمريح.',
    icon: 'Sparkles',
    xml: `<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE html>
<html b:css='false' b:defaultmessages='true' b:responsive='true' b:version='2' class='v2' expr:dir='data:blog.languageDirection' xmlns='http://www.w3.org/1999/xhtml' xmlns:b='http://www.google.com/2005/gml/b' xmlns:data='http://www.google.com/2005/gml/data' xmlns:expr='http://www.google.com/2005/gml/expr'>
<head>
  <meta content='width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1' name='viewport'/>
  <title><data:view.title.escaped/></title>
  <b:skin><![CDATA[
    body {
      background-color: #0b0f19;
      color: #94a3b8;
      font-family: 'Cairo', sans-serif;
      margin: 0;
      padding: 0;
    }
    .anime-banner {
      background: linear-gradient(45deg, #a855f7, #ec4899);
      padding: 40px;
      text-align: center;
      color: white;
    }
    .anime-container {
      max-width: 1100px;
      margin: 40px auto;
      padding: 0 20px;
    }
    .anime-news-block {
      background: #1e1b4b;
      border-radius: 16px;
      padding: 25px;
      border: 2px solid #a855f7;
      box-shadow: 0 0 20px rgba(168,85,247,0.3);
    }
    .episode-item {
      display: flex;
      gap: 15px;
      background: rgba(15,23,42,0.6);
      padding: 15px;
      border-radius: 10px;
      margin-top: 15px;
      align-items: center;
      border: 1px solid rgba(168,85,247,0.1);
      transition: all 0.2s;
    }
    .episode-item:hover {
      border-color: #ec4899;
      transform: translateX(-5px);
    }
    .badge {
      background: #ec4899;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: bold;
    }
  ]]></b:skin>
</head>
<body>
  <div class='anime-banner'>
    <h1 style='margin:0;'>بوابة الأنمي الذكية | Otaku World</h1>
    <p>أحدث أخبار وتقارير ومواعيد حلقات الأنمي والمانجا أولاً بأول</p>
  </div>

  <div class='anime-container'>
    <b:section class='main' id='main' showaddelement='yes'>
      <b:widget id='Blog1' locked='false' title='آخر الأخبار والحلقات' type='Blog'>
        <b:includable id='main'>
          <div class='anime-news-block'>
            <h2 style='color: white; margin-top:0;'>حلقات اليوم الصادرة حديثاً:</h2>
            <div class='episode-item'>
              <span class='badge'>الحلقة 12</span>
              <div style='flex:1;'>
                <h4 style='margin:0; color:#fff;'>الموسم الجديد من أنمي الفانتازيا الأسطوري</h4>
                <p style='margin:5px 0 0 0; font-size:12px;'>مترجم بجودة عالية مع خوادم مشاهدة متعددة وسريعة.</p>
              </div>
            </div>
            <div class='episode-item'>
              <span class='badge'>الحلقة 25 والأخيرة</span>
              <div style='flex:1;'>
                <h4 style='margin:0; color:#fff;'>ملحمة صراع الممالك - ختام أسطوري للموسم الثاني</h4>
                <p style='margin:5px 0 0 0; font-size:12px;'>تابع معنا تفاصيل وتحليل الحلقة الختامية المثيرة.</p>
              </div>
            </div>
          </div>
        </b:includable>
      </b:widget>
    </b:section>
  </div>
</body>
</html>`
  },
  {
    id: 'news',
    name: 'القالب الإخباري والتدويني (News Portal)',
    category: 'News',
    description: 'قالب إخباري متكامل وسريع، يحتوي على شريط أخبار عاجلة متحرك، وسلايدر مميز، وتصميم تقليدي ومنظم وموثوق للصحافة الإلكترونية.',
    icon: 'FileText',
    xml: `<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE html>
<html b:css='false' b:defaultmessages='true' b:responsive='true' b:version='2' class='v2' expr:dir='data:blog.languageDirection' xmlns='http://www.w3.org/1999/xhtml' xmlns:b='http://www.google.com/2005/gml/b' xmlns:data='http://www.google.com/2005/gml/data' xmlns:expr='http://www.google.com/2005/gml/expr'>
<head>
  <meta content='width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1' name='viewport'/>
  <title><data:view.title.escaped/></title>
  <b:skin><![CDATA[
    body {
      background-color: #f8fafc;
      color: #334155;
      font-family: 'Cairo', Arial, sans-serif;
      margin: 0;
      padding: 0;
    }
    .ticker-container {
      background: #dc2626;
      color: white;
      padding: 10px;
      font-weight: bold;
      display: flex;
      align-items: center;
      gap: 15px;
      font-size: 13px;
    }
    .news-header {
      background: white;
      border-bottom: 3px solid #1e293b;
      padding: 25px;
      text-align: center;
    }
    .news-layout {
      max-width: 1200px;
      margin: 30px auto;
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 30px;
      padding: 0 20px;
    }
    @media (max-width: 768px) {
      .news-layout { grid-template-columns: 1fr; }
    }
    .news-box {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .sidebar-widget {
      background: #f1f5f9;
      border-radius: 8px;
      padding: 20px;
      border: 1px solid #cbd5e1;
    }
  ]]></b:skin>
</head>
<body>
  <div class='ticker-container'>
    <span style='background:#fff; color:#dc2626; padding:2px 8px; border-radius:3px;'>عاجل</span>
    <marquee>انطلاق الإصدار الأحدث من منصة الذكاء الاصطناعي لتعديل قوالب بلوجر وتوليد الإضافات التفاعلية</marquee>
  </div>

  <header class='news-header'>
    <h1 style='margin:0; color:#1e293b; font-size:36px;'>جريدة اليوم الإلكترونية | Daily News</h1>
    <p style='color:#64748b; margin:5px 0 0 0;'>مصداقية في الخبر، تميز في التغطية</p>
  </header>

  <div class='news-layout'>
    <div>
      <b:section class='main' id='main' showaddelement='yes'>
        <b:widget id='Blog1' locked='false' title='الأخبار الرئيسية' type='Blog'>
          <b:includable id='main'>
            <div class='news-box'>
              <h2 style='color:#1e293b; margin-top:0;'>الذكاء الاصطناعي يعيد تعريف تدوين الويب في عام 2026</h2>
              <p style='color:#64748b; font-size:12px;'>الصحافة الرقمية • منذ ساعة واحدة</p>
              <p>نشهد اليوم نقلة نوعية كبرى في أساليب تعديل القوالب وتطوير منصات النشر الرقمي باستخدام الخوارزميات الذكية لمساعدة أصحاب المدونات والمواقع الإلكترونية.</p>
            </div>
          </b:includable>
        </b:widget>
      </b:section>
    </div>

    <div>
      <b:section class='sidebar' id='sidebar' showaddelement='yes'>
        <b:widget id='HTML1' locked='false' title='روابط تهمك' type='HTML'>
          <b:includable id='main'>
            <div class='sidebar-widget'>
              <h4 style='margin-top:0;'>الأكثر قراءة هذا الأسبوع:</h4>
              <ul style='padding-right:20px; line-height:1.8;'>
                <li>كيف تحمي مدونتك من الهجمات وتؤمن حسابك؟</li>
                <li>طرق تفعيل ميزة الربح وجلب الإعلانات بأمان</li>
              </ul>
            </div>
          </b:includable>
        </b:widget>
      </b:section>
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'shop',
    name: 'قالب المتجر الإلكتروني المبسط (Blogger Store)',
    category: 'Shop',
    description: 'حوّل مدونتك إلى متجر سلة متكامل لعرض المنتجات مع سعر، وصور تفاعلية، وسلة مشتريات، وزر الطلب عبر واتساب وتليجرام.',
    icon: 'Layers',
    xml: `<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE html>
<html b:css='false' b:defaultmessages='true' b:responsive='true' b:version='2' class='v2' expr:dir='data:blog.languageDirection' xmlns='http://www.w3.org/1999/xhtml' xmlns:b='http://www.google.com/2005/gml/b' xmlns:data='http://www.google.com/2005/gml/data' xmlns:expr='http://www.google.com/2005/gml/expr'>
<head>
  <meta content='width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1' name='viewport'/>
  <title><data:view.title.escaped/></title>
  <b:skin><![CDATA[
    body {
      background-color: #fafafa;
      color: #27272a;
      font-family: 'Cairo', sans-serif;
      margin: 0;
      padding: 0;
    }
    .shop-header {
      background-color: white;
      border-bottom: 1px solid #e4e4e7;
      padding: 15px 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .shop-title {
      color: #16a34a;
      font-weight: bold;
      font-size: 22px;
    }
    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 30px;
      padding: 40px 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .product-card {
      background: white;
      border-radius: 12px;
      border: 1px solid #e4e4e7;
      overflow: hidden;
      transition: box-shadow 0.2s;
    }
    .product-card:hover {
      box-shadow: 0 10px 25px rgba(0,0,0,0.05);
    }
    .product-img {
      height: 220px;
      background-color: #f4f4f5;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #a1a1aa;
    }
    .price {
      color: #16a34a;
      font-size: 20px;
      font-weight: 850;
      margin-top: 10px;
    }
    .btn-buy-whatsapp {
      background-color: #25d366;
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 6px;
      font-weight: bold;
      width: 100%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
  ]]></b:skin>
</head>
<body>
  <header class='shop-header'>
    <div class='shop-title'>🛒 متجري الذكي | EasyShop</div>
    <div style='background: #f4f4f5; padding: 5px 15px; border-radius: 20px; font-size:12px;'>السلة (0) منتج</div>
  </header>

  <b:section class='main' id='main' showaddelement='yes'>
    <b:widget id='Blog1' locked='false' title='المنتجات المميزة' type='Blog'>
      <b:includable id='main'>
        <div class='product-grid'>
          <div class='product-card'>
            <div class='product-img'>[صورة المنتج 1]</div>
            <div style='padding:20px;'>
              <h3 style='margin:0 0 5px 0;'>سماعة لاسلكية عازلة للضوضاء برو</h3>
              <p style='color:#71717a; font-size:12px; margin:0;'>سماعة تفاعلية مريحة للأذن ذات بطارية خارقة.</p>
              <div class='price'>199 ريال</div>
              <button class='btn-buy-whatsapp' style='margin-top:15px;'>اطلب الآن عبر واتساب 💬</button>
            </div>
          </div>
          <div class='product-card'>
            <div class='product-img'>[صورة المنتج 2]</div>
            <div style='padding:20px;'>
              <h3 style='margin:0 0 5px 0;'>ساعة ذكية رياضية بلس 2026</h3>
              <p style='color:#71717a; font-size:12px; margin:0;'>شاشة أموليد كاملة، ومقاومة للماء، وتتبع نبضات القلب.</p>
              <div class='price'>299 ريال</div>
              <button class='btn-buy-whatsapp' style='margin-top:15px;'>اطلب الآن عبر واتساب 💬</button>
            </div>
          </div>
        </div>
      </b:includable>
    </b:widget>
  </b:section>
</body>
</html>`
  },
  {
    id: 'landing',
    name: 'قالب صفحة هبوط ترويجية (Landing Page)',
    category: 'Landing Page',
    description: 'صفحة تسويق وهبوط أحادية التركيز، أنيقة وسلسة وجذابة، مصممة لتحويل الزوار إلى عملاء بأقصر وقت.',
    icon: 'Sparkles',
    xml: `<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE html>
<html b:css='false' b:defaultmessages='true' b:responsive='true' b:version='2' class='v2' expr:dir='data:blog.languageDirection' xmlns='http://www.w3.org/1999/xhtml' xmlns:b='http://www.google.com/2005/gml/b' xmlns:data='http://www.google.com/2005/gml/data' xmlns:expr='http://www.google.com/2005/gml/expr'>
<head>
  <meta content='width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1' name='viewport'/>
  <title><data:view.title.escaped/></title>
  <b:skin><![CDATA[
    body {
      background-color: #fafaf9;
      color: #44403c;
      font-family: 'Cairo', sans-serif;
      margin: 0;
      padding: 0;
    }
    .hero-landing {
      background-color: #0c0a09;
      color: #f5f5f4;
      padding: 100px 20px;
      text-align: center;
    }
    .cta-button {
      background: linear-gradient(135deg, #ea580c, #f97316);
      color: white;
      padding: 15px 40px;
      border-radius: 50px;
      text-decoration: none;
      font-weight: bold;
      font-size: 18px;
      box-shadow: 0 10px 20px rgba(234,88,12,0.3);
      display: inline-block;
      margin-top: 25px;
      transition: transform 0.2s;
    }
    .cta-button:hover {
      transform: scale(1.05);
    }
    .features-section {
      max-width: 1000px;
      margin: 80px auto;
      padding: 0 20px;
      text-align: center;
    }
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 35px;
      margin-top: 50px;
    }
    .feature-item {
      background: white;
      padding: 30px;
      border-radius: 16px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.02);
      border: 1px solid #e7e5e4;
    }
  ]]></b:skin>
</head>
<body>
  <div class='hero-landing'>
    <h1 style='font-size: 48px; margin:0; line-height:1.2;'>احصل على كورس احتراف التدوين الذكي لعام 2026 🚀</h1>
    <p style='color:#a8a29e; font-size:18px; max-width:700px; margin:20px auto 0 auto;'>الدليل المتكامل خطوة بخطوة للوصول لـ 100,000 زائر شهرياً لمدونتك من خلال السيو وصناعة المحتوى.</p>
    <a href='#order' class='cta-button'>ابدأ رحلة النجاح الآن</a>
  </div>

  <div class='features-section'>
    <h2>لماذا تختار دورتنا التعليمية؟</h2>
    <div class='features-grid'>
      <div class='feature-item'>
        <h3 style='color:#ea580c; margin-top:0;'>سيو محدث لعام 2026</h3>
        <p>محتوى يعتمد على أحدث خوارزميات الذكاء الاصطناعي وجوجل الحديثة.</p>
      </div>
      <div class='feature-item'>
        <h3 style='color:#ea580c; margin-top:0;'>تطبيقات عملية ونماذج</h3>
        <p>نوفر لك قوالب وإضافات وملفات سيو جاهزة لتطبيقها فوراً بلمح البصر.</p>
      </div>
    </div>
  </div>

  <b:section class='main' id='main' showaddelement='no'>
    <b:widget id='Blog1' locked='true' title='معلومات إضافية' type='Blog'>
      <b:includable id='main'>
        <!-- لا يوجد مقالات هنا في صفحة الهبوط أحادية الهدف -->
      </b:includable>
    </b:widget>
  </b:section>
</body>
</html>`
  }
];
