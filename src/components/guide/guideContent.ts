export type GuideLanguage = 'ar' | 'en' | 'fr';

export interface GuideSection {
  id: string;
  iconName: string;
  title: string;
  badge?: string;
  summary: string;
  steps: {
    title: string;
    description: string;
    tips?: string;
  }[];
  keyPoints: string[];
  faq?: {
    q: string;
    a: string;
  }[];
}

export interface RoleQuickGuide {
  roleTitle: string;
  badge: string;
  mission: string;
  steps: string[];
}

export interface GuideContent {
  appTitle: string;
  appSubtitle: string;
  langName: string;
  searchPlaceholder: string;
  quickStartTitle: string;
  quickStartDesc: string;
  roleGuidesTitle: string;
  roleGuidesDesc: string;
  sectionsTitle: string;
  cheatSheetTitle: string;
  cheatSheetDesc: string;
  copyCheatSheet: string;
  copied: string;
  printGuide: string;
  roles: RoleQuickGuide[];
  sections: GuideSection[];
  quickFaq: { q: string; a: string }[];
}

export const GUIDE_TRANSLATIONS: Record<GuideLanguage, GuideContent> = {
  ar: {
    appTitle: 'دليل استخدام تطبيق عمليات المناولة الأرضية (AeroTurn)',
    appSubtitle: 'مرجع شامل لإدارة زمن دوران الطائرات (Turnaround)، وتتبع المعالم التشغيلية بالوقت العالمي الموحد (UTC) والإحداثيات (GPS)، والمزامنة دون اتصال.',
    langName: 'العربية',
    searchPlaceholder: 'ابحث في الدليل (مثال: ختم المهبط، الوقود، الأمتعة، التأخير، دون اتصال)...',
    quickStartTitle: 'البدء السريع: 4 خطوات لإدارة رحلة دوران كاملة',
    quickStartDesc: 'دليل عملي سريع لكيفية متابعة رحلة من لحظة وصولها حتى إقلاعها في الوقت المحدد.',
    roleGuidesTitle: 'إرشادات سريعة حسب الدور التشغيلي',
    roleGuidesDesc: 'اختر دورك الوظيفي للاطلاع على الإجراءات اليومية والمسؤوليات المباشرة.',
    sectionsTitle: 'أقسام النظام والوحدات التشغيلية',
    cheatSheetTitle: 'بطاقة الإجراءات السريعة في المهبط (Ramp Pocket Card)',
    cheatSheetDesc: 'ملخص للإجراءات والأوامر السريعة الميدانية للطباعة أو الحفظ في الجيب.',
    copyCheatSheet: 'نسخ ملخص المهبط',
    copied: 'تم النسخ بنجاح!',
    printGuide: 'طباعة الدليل',
    roles: [
      {
        roleTitle: 'وكيل المهبط (Ramp Agent)',
        badge: 'الميدان والمهبط',
        mission: 'تسجيل وتوثيق المعالم التشغيلية فور وقوعها بختم UTC و GPS بنقرة واحدة.',
        steps: [
          'افتح تبويب "وضع عميل المهبط (Ramp Quick Agent)" المصمم للعمل الميداني والقفازات.',
          'اختر الطائرة / الرحلة الحالية من القائمة العلوية.',
          'عند تثبيت الكتل (Chocks) أو فتح الأبواب أو بدء/إنهاء الخدمات، اضغط على الزر المقابل (1-TAP STAMP).',
          'في حال وجود عائق أو خطر، اضغط "REPORT RAMP PROBLEM" والتقط صورة فورية للإثبات.',
        ],
      },
      {
        roleTitle: 'مشرف النوبة (Ramp Supervisor)',
        badge: 'الإشراف والتدقيق',
        mission: 'متابعة مسار الدوران بالكامل، والتدقيق الإداري غير القابل للحذف، واعتماد بطاقة الحمولة.',
        steps: [
          'راقب لوحة التحكم الرئيسية لمتابعة مؤشر زمن الدوران (Turnaround Target Bar) والعد التنازلي.',
          'قم بمراجعة جدول المواعيد الزمنية (Timeline) في صفحة تفاصيل الرحلة للتأكد من تسلسل العمليات.',
          'في حال إدخال وقت غير دقيق، استخدم خاصية التعديل الإشرافي (Supervisory Correction) مع ذكر السبب (Append-Only Audit).',
          'اعتمد التوقيع النهائي لبطاقة الحمولة والتوازن (Loadsheet) قبل إغلاق الأبواب.',
        ],
      },
      {
        roleTitle: 'مدير العمليات ومرحل الطيران (Ops Manager & Dispatcher)',
        badge: 'مركز التحكم والتحليل',
        mission: 'إدارة مؤشرات الأداء (OTP)، تحليل أسباب التأخير وفق رموز IATA، واستخدام المستشار الذكي.',
        steps: [
          'استخدم خريطة المهبط (Apron Map) لمعاينة توزيع المواقف (Stands) والبوابات وحالة الطائرات.',
          'في حال تأخر الرحلة، وثّق رمز التأخير الدقيق (IATA Delay Code) وحدد القسم المسؤول.',
          'استشر مساعد الذكاء الاصطناعي (AI Turnaround Advisor) لتحليل الاختناقات وتقدير موعد الإقلاع المتوقع (ETD).',
          'قم بتصدير تقارير الدوران الرسمية بصيغ PDF أو JSON لسجلات هيئة الطيران وشركات الطيران.',
        ],
      },
    ],
    sections: [
      {
        id: 'timeline',
        iconName: 'Clock',
        title: 'الجدول الزمني للرحلة والختم الفوري (Turnaround Timeline & Stamping)',
        badge: 'العمود الفقري',
        summary: 'تسجيل تسلسلي معتمد وغير قابل للحذف لكل حدث تشغيلي مع طابع زمني دقيق وإحداثيات الموقع.',
        steps: [
          {
            title: '1. اختيار الرحلة ومتابعة التسلسل',
            description: 'انقر على أي بطاقة رحلة من لوحة التحكم للانتقال إلى الجدول الزمني الخاص بها (Turnaround Timeline). ستظهر لك قائمة المعالم الـ 14 القياسية بالترتيب المعتمد عالمياً.',
            tips: 'المعالم باللون الأخضر تعني اكتمال الإجراء، وبالأصفر جاري العمل، والرمادي في الانتظار.',
          },
          {
            title: '2. الختم بنقرة واحدة (1-Tap Stamp)',
            description: 'اضغط على زر "1-TAP STAMP" المقابل للحدث. يقوم التطبيق تلقائياً بقراءة الوقت العالمي (UTC)، والوقت المحلي للمطار، وإحداثيات الـ GPS الميدانية وتضمينها في السجل.',
            tips: 'يتم تشفير السجل وإرساله فوراً للسيرفر أو حفظه في الذاكرة المحلية إذا كان الاتصال مقطوعاً.',
          },
          {
            title: '3. التصحيح الإشرافي والتدقيق (Supervisory Correction)',
            description: 'يحق للمشرفين والمدراء تصحيح الأوقات مع كتابة الملاحظة التبريرية. لا يتم حذف السجل الأصلي مطلقاً بل يُضاف سجل تدقيقي تكميلي (Append-Only Audit) لضمان الشفافية.',
          },
        ],
        keyPoints: [
          'التوقيت العالمي الموحد (UTC) هو الأساس المرجعي القانوني المعتمد في الطيران.',
          'يتم تسجيل هوية الموظف ورقمه الوظيفي مع كل حدث لتحديد المسؤوليات بدقة.',
          'حساب نسبة الإنجاز والوقت المتبقي تلقائياً وفق وقت الدوران المستهدف (Target Turnaround).',
        ],
        faq: [
          {
            q: 'ماذا أفعل إذا تم الضغط على زر حدث بالخطأ؟',
            a: 'يمكن للمشرف النقر على أيقونة القلم بجانب الحدث لتصحيح الحالة أو كتابة ملاحظة تبريرية توضح التعديل في سجل التدقيق.',
          },
        ],
      },
      {
        id: 'ramp-mode',
        iconName: 'Smartphone',
        title: 'وضع عميل المهبط الميداني (Ramp Agent Field Mode)',
        badge: 'مخصص للميدان',
        summary: 'واجهة استخدام مبسطة ذات أزرار ضخمة عالية التباين، مهيأة للاستخدام تحت أشعة الشمس الشديدة ومع قفازات العمل.',
        steps: [
          {
            title: '1. التبديل إلى وضع المهبط السريع',
            description: 'اختر "Ramp Quick Agent" من القائمة الجانبية أو من الشريط العلوي. ستظهر لك شاشة مخصصة للهواتف والأجهزة اللوحية الميدانية.',
          },
          {
            title: '2. تحديد الرحلة النشطة على الموقف',
            description: 'اختر رقم الرحلة أو البوابة الحالية من القائمة المنسدلة بالأعلى لعرض بيانات الطائرة والموقف فوراً.',
          },
          {
            title: '3. تسجيل الأحداث المتتالية',
            description: 'اضغط بلمسة واحدة على المعلم الجاري (مثل: بدء تفريغ الحقائب، وصل خرطوم الوقود، إغلاق الأبواب). ستتغير حالة الزر إلى اللون الأخضر مع علامة صح وتأكيد صوتي/مرئي.',
          },
        ],
        keyPoints: [
          'أزرار كبيرة تمنع الضغط الخاطئ أثناء ارتداء قفازات الأمان (Glove-Friendly).',
          'زر أحمر بارز للإبلاغ الفوري عن أي عائق في المهبط (Ramp Problem).',
          'يعمل بالكامل دون إنترنت مع حفظ الإجراءات فوراً في ذاكرة المتصفح.',
        ],
      },
      {
        id: 'ground-services',
        iconName: 'Fuel',
        title: 'إدارة الخدمات الأرضية: الوقود، التموين، التنظيف، والصيانة',
        badge: 'التنسيق المتكامل',
        summary: 'تتبع كافة مقاولي الخدمات الأرضية في وقت واحد لضمان عدم حدوث تعارض وتأخير على الطائرة.',
        steps: [
          {
            title: '1. التزود بالوقود (Refueling)',
            description: 'سجل وقت وصول شاحنة الوقود، وبدء الضخ، والكمية المطلوبة والمحقونة بالكيلوجرام أو اللتر، ورقم شاحنة الوقود واسم الفني.',
          },
          {
            title: '2. التموين (Catering)',
            description: 'توثيق وصول سيارات الرفع الهيدروليكي للتموين، وعدد العربات المحملة (Trolleys) واعتماد نموذج استلام الوجبات واللوازم.',
          },
          {
            title: '3. تنظيف المقصورة (Cabin Cleaning)',
            description: 'تسجيل بدء صعود فريق النظافة، وتأكيد فحص الأمن للمقصورة (Security Search) واكتمال النظافة قبل بدء صعود الركاب.',
          },
          {
            title: '4. خدمات المياه والمراحيض والصيانة الفنية',
            description: 'توثيق تعبئة المياه الصالحة للشرب، وتفريغ خزانات الصرف الصحي، وفحص مهندسي الصيانة الفنية والتوقيع على السجل الفني للطائرة (Tech Log).',
          },
        ],
        keyPoints: [
          'إمكانية إرفاق صور للمخلفات أو الأضرار أو مستندات الاستلام.',
          'حساب التوقيت المتوازي للخدمات لمنع تعارض شاحنات الخدمة حول الطائرة.',
        ],
      },
      {
        id: 'baggage',
        iconName: 'Luggage',
        title: 'إدارة الأمتعة والشحن (Baggage & Cargo Handling)',
        badge: 'الحمولة والمطابقة',
        summary: 'مراقبة وتوثيق تفريغ وتحميل الحقائب والشحن الجوي، والمطابقة الدقيقة لمنع تخلف الحقائب.',
        steps: [
          {
            title: '1. تفريغ أمتعة الرحلة القادمة (Inbound Offload)',
            description: 'سجل وقت فتح عنبر الأمتعة، وبدء التفريغ، ونقل آخر حقيبة إلى صالة استلام الأمتعة (First Bag / Last Bag Track).',
          },
          {
            title: '2. تحميل أمتعة الرحلة المغادرة (Outbound Loading)',
            description: 'تتبع عداد الحقائب المحملة مقارنة بالعدد المقبول على الكاونترات، وتوثيق عدد حاويات الـ ULD وتوزيعها في العنابر الأمامية والخلفية.',
          },
          {
            title: '3. معالجة الحقائب غير المطابقة وحقائب الترانزيت',
            description: 'تسجيل أي حقائب متأخرة (Rush Bags) أو حقائب ذات أولوية وركاب الترانزيت ذوي الرحلات القصيرة (Hot Connections).',
          },
        ],
        keyPoints: [
          'مطابقة تامة لمتطلبات أمن الطيران ومطابقة الركاب للحقائب (BRS Reconciliation).',
          'تسجيل أوزان الشحنات الخاصة والحمولة الخطرة (DGR - Dangerous Goods).',
        ],
      },
      {
        id: 'passengers',
        iconName: 'Users',
        title: 'صعود الركاب وخدمات ذوي الاحتياجات الخاصة (Boarding & PRM)',
        badge: 'خدمة الركاب',
        summary: 'تتبع مراحل الصعود، وإحصائيات الركاب، ورعاية ذوي الإعاقة، وإغلاق بوابات الصعود.',
        steps: [
          {
            title: '1. بدء صعود الركاب (Boarding Sequencing)',
            description: 'سجل فتح البوابة، وبدء صعود ركاب الدرجات الممتازة والأولوية، ثم الصعود العام عبر جسر الركاب أو الحافلات.',
          },
          {
            title: '2. تتبع رعاية ذوي الاحتياجات الخاصة (PRM Support)',
            description: 'توثيق وصول سيارة الرفع الخاصة (Ambulift) والكراسي المتحركة ومرافقة الركاب حتى مقاعدهم في الطائرة بأمان.',
          },
          {
            title: '3. مطابقة الركاب الأخيرة وإغلاق البوابة',
            description: 'مقارنة عدد الركاب الصاعدين بالعدد النهائي (Final Headcount)، واستخراج الركاب الغائبين وأمتعتهم في حال عدم الحضور.',
          },
        ],
        keyPoints: [
          'عداد مباشر يوضح النسبة المئوية للركاب الذين صعدوا للطائرة.',
          'تأكيد استلام كابتن الطائرة لبيان الركاب (Passenger Manifest).',
        ],
      },
      {
        id: 'delays-incidents',
        iconName: 'AlertOctagon',
        title: 'إدارة التأخير والحوادث وفق معايير IATA (Delays & Incident Logging)',
        badge: 'السلامة والجودة',
        summary: 'تسجيل أسباب التأخير بدقة وفق رموز الاتحاد الدولي للنقل الجوي (IATA Delay Codes) وتوثيق الحوادث بالصور.',
        steps: [
          {
            title: '1. توثيق سبب التأخير برمز IATA',
            description: 'في حال تجاوز موعد الإقلاع المجدول (STD)، اختر رمز التأخير المعتمد (مثل: 89 للرحلات القادمة، 41 للأمتعة، 51 للوقود، 32 لركاب متأخرين).',
          },
          {
            title: '2. تسجيل بلاغ عن عطل أو حادث أرضي',
            description: 'انقر على "Report Incident" وحدد فئة المشكلة (أمتعة، معدات أرضية، تسرب، عطل فني، أمان).',
          },
          {
            title: '3. إرفاق الصور والأدلة الميدانية',
            description: 'استخدم كاميرا الجهاز لالتقاط صورة مباشرة للضرر أو العائق، ويتم ضغط الصورة وتخزينها بأمان مع الإحداثيات الجغرافية.',
          },
        ],
        keyPoints: [
          'توثيق دقيق يحمي حقوق المطار وشركة المناولة الأرضية في مطالبات التأخير القانونية.',
          'تصنيف درجات الخطورة (منخفضة، متوسطة، عالية، حرجة) مع إشعارات فورية.',
        ],
      },
      {
        id: 'offline-sync',
        iconName: 'RefreshCw',
        title: 'العمل دون اتصال بالإنترنت والمزامنة التلقائية (Offline-First Sync)',
        badge: 'موثوقية تامة',
        summary: 'يعمل التطبيق في أقسى ظروف المهبط وانقطاع شبكة الواي فاي والخلوي بفضل تقنية IndexedDB المحلية.',
        steps: [
          {
            title: '1. التسجيل الفوري دون اتصال',
            description: 'عند انقطاع الشبكة، يظهر مؤشر أحمر (OFFLINE). يمكنك متابعة عملك وختم الأحداث وتسجيل الملاحظات دون أي توقف أو بطء.',
          },
          {
            title: '2. تخزين العمليات محلياً برقم فريد (UUID)',
            description: 'تُحفظ جميع الأحداث في قاعدة بيانات المتصفح (IndexedDB) مع طابع زمني غير قابل للتلاعب ورقم تعريف فريد يمنع تكرار البيانات.',
          },
          {
            title: '3. المزامنة التلقائية عند عودة الاتصال',
            description: 'بمجرد دخولك نطاق التغطية، يقوم محرك المزامنة الخلفي بإرسال قائمة الانتظار بترتيب زمني سليم وحل أي تعارضات تلقائياً.',
          },
          {
            title: '4. التصدير اليدوي للنسخة الاحتياطية',
            description: 'يمكنك في أي وقت الذهاب لصفحة "Offline Sync Hub" والضغط على "EXPORT LOCAL DB" لتنزيل ملف JSON كامل ببياناتك.',
          },
        ],
        keyPoints: [
          'عدم فقدان أي بيانات تشغيلية حتى لو أغلقت المتصفح أو أعدت تشغيل الجهاز.',
          'زر "Force Full Resync" للمزامنة اليدوية الفورية متى شئت.',
        ],
      },
      {
        id: 'ai-assistant',
        iconName: 'Sparkles',
        title: 'المستشار الذكي لعمليات المهبط (AI Turnaround Advisor)',
        badge: 'الذكاء الاصطناعي',
        summary: 'مساعد ذكي يحلل مسار الدوران، يكتشف الاختناقات المحتملة، ويقترح حلولاً استباقية لمنع تأخر الطائرة.',
        steps: [
          {
            title: '1. فتح مستشار الذكاء الاصطناعي',
            description: 'انقر على "AI Turnaround Advisor" من القائمة الجانبية.',
          },
          {
            title: '2. طرح استفسارات تشغيلية حية',
            description: 'اطرح أي سؤال مثل: "ما هي الرحلات المهددة بالتأخير حالياً؟" أو "ما سبب تأخر الرحلة QR102؟" أو "اقترح خطة لتسريع صعود الركاب".',
          },
          {
            title: '3. تلقي تحليلات تنبؤية دقيقة',
            description: 'يقوم الذكاء الاصطناعي بقراءة بيانات جميع الرحلات والأحداث الحالية وتقديم خطة عمل وتوصيات لفرق المهبط.',
          },
        ],
        keyPoints: [
          'توليد تقارير أداء فورية (Shift Handover Reports) لتسليم الورديات بنقرة واحدة.',
          'اقتراح رموز IATA المناسبة بناءً على الملاحظات المسجلة.',
        ],
      },
    ],
    quickFaq: [
      {
        q: 'هل يمكن تشغيل التطبيق على هواتف أندرويد وآيفون والأجهزة اللوحية؟',
        a: 'نعم، التطبيق مبني بتصميم متجاوب بالكامل ويعمل بسلاسة على أي متصفح هاتف أو تابلت صناعي (Rugged Tablet) أو كمبيوتر مكتبي.',
      },
      {
        q: 'كيف نضمن أن الوقت المسجل لم يتم تزويره من قبل المستخدم؟',
        a: 'يتم احتساب الوقت عبر السيرفر المركزي والـ UTC ومقارنته بساعة الجهاز، مع توثيق الـ GPS الميداني وتخزين السجلات في مسار تدقيقي ثابت (Audit Trail).',
      },
      {
        q: 'هل يمكن تصدير تقرير الرحلة لتقديمه لشركة الطيران؟',
        a: 'نعم، من تبويب "Turnaround Reports" يمكنك طباعة أو تصدير تقرير كامل يشمل جميع المعالم بالأوقات، أسماء الفنيين، الصور، وأسباب التأخير.',
      },
    ],
  },
  en: {
    appTitle: 'Airport Ground Operations & Turnaround User Guide (AeroTurn)',
    appSubtitle: 'Comprehensive operational manual for aircraft turnaround milestone tracking, UTC/GPS stamping, offline-first synchronization, and ramp dispatch.',
    langName: 'English',
    searchPlaceholder: 'Search guide (e.g. 1-tap stamp, fuel, baggage, IATA delays, offline sync)...',
    quickStartTitle: 'Quick Start: 4 Steps to Master a Turnaround Movement',
    quickStartDesc: 'A fast visual guide on tracking an aircraft from touchdown to on-time departure.',
    roleGuidesTitle: 'Role-Specific Quick Operations Cards',
    roleGuidesDesc: 'Choose your operational role for tailored workflows and daily responsibilities.',
    sectionsTitle: 'Operational Systems & Modules Breakdown',
    cheatSheetTitle: 'Ramp Pocket Reference Card',
    cheatSheetDesc: 'Compact on-ramp cheat sheet for quick reference or printing.',
    copyCheatSheet: 'Copy Ramp Summary',
    copied: 'Copied to Clipboard!',
    printGuide: 'Print Guide',
    roles: [
      {
        roleTitle: 'Ramp Operations Agent',
        badge: 'Ramp Field',
        mission: 'Record and timestamp all ground milestones with authoritative UTC and GPS with 1-tap ease.',
        steps: [
          'Open the "Ramp Quick Agent" module, optimized with large glove-friendly touch targets.',
          'Select your assigned flight and gate from the top aircraft selector.',
          'As milestones occur (Chocks on, Doors open, Offload start, Fueling, Doors closed), press the corresponding "1-TAP STAMP" button.',
          'If bottlenecks or hazards occur, tap "REPORT RAMP PROBLEM" and capture immediate photo evidence.',
        ],
      },
      {
        roleTitle: 'Turnaround Ramp Supervisor',
        badge: 'Supervision & Audit',
        mission: 'Monitor the critical turnaround path, perform supervisory audit corrections, and sign off the final loadsheet.',
        steps: [
          'Monitor the live Turnaround Target Bar and time variance on the Operations Dashboard.',
          'Check the sequential milestone timeline in the Flight Detail view to ensure parallel services proceed on track.',
          'If a timestamp requires calibration, submit a Supervisory Correction with justification (stored in the immutable audit log).',
          'Verify cabin door closure and loadsheet sign-off before approving pushback authorization.',
        ],
      },
      {
        roleTitle: 'Operations Manager & Dispatcher',
        badge: 'Control Hub',
        mission: 'Oversee airport on-time performance (OTP), allocate stands on the apron map, and classify IATA delay root causes.',
        steps: [
          'Review the live Gate Apron Map to balance stand congestion and ground support equipment (GSE) availability.',
          'If a flight incurs delay, assign the exact IATA delay code and accountable department.',
          'Use the AI Turnaround Advisor to query real-time turnaround risk and simulate estimated departure times (ETD).',
          'Generate and export end-of-turnaround compliance reports for civil aviation authorities and airline partners.',
        ],
      },
    ],
    sections: [
      {
        id: 'timeline',
        iconName: 'Clock',
        title: 'Turnaround Timeline & Authoritative Stamping',
        badge: 'Core Engine',
        summary: 'Append-only chronological operational milestone log stamped with precise UTC time and GPS coordinates.',
        steps: [
          {
            title: '1. Select Aircraft and Review Milestones',
            description: 'Click on any flight card in the Operations Dashboard to access its dedicated Turnaround Timeline. All 14 standard IATA milestones are displayed in chronological order.',
            tips: 'Green indicates completed, yellow indicates in progress, red indicates problem/delayed, and gray indicates pending.',
          },
          {
            title: '2. Perform 1-Tap Operational Stamping',
            description: 'Click "1-TAP STAMP" on any active milestone. The app automatically fetches device GPS coordinates and records the authoritative UTC timestamp.',
            tips: 'Data is instantly persisted locally in IndexedDB and queued for cloud synchronization.',
          },
          {
            title: '3. Supervisory Append-Only Corrections',
            description: 'Supervisors and admins can calibrate a stamped time by clicking the edit icon. The original record remains in the immutable audit trail with a timestamped correction note.',
          },
        ],
        keyPoints: [
          'UTC timestamping provides legal and authoritative adherence to aviation standards.',
          'Every record identifies the user name, badge number, and exact role.',
          'Automatic turnaround countdown meter measures performance against standard ground time (e.g. 45 min).',
        ],
        faq: [
          {
            q: 'What if a milestone button was clicked prematurely?',
            a: 'A supervisor can click the edit icon on the milestone to adjust the status, set it back to In Progress, or log an explanatory note.',
          },
        ],
      },
      {
        id: 'ramp-mode',
        iconName: 'Smartphone',
        title: 'Ramp Agent Field Mode (Glove-Friendly)',
        badge: 'Field Ready',
        summary: 'Streamlined UI designed for high-glare ramp environments with extra-large touch targets for gloved operations.',
        steps: [
          {
            title: '1. Switch to Ramp Quick Mode',
            description: 'Navigate to "Ramp Quick Agent" via the sidebar or top navigation. This interface is tailored specifically for handheld devices and rugged tablets.',
          },
          {
            title: '2. Select the Active Flight on Stand',
            description: 'Choose your flight from the dropdown menu to immediately display aircraft type, registration, gate, and stand details.',
          },
          {
            title: '3. Execute Single-Touch Milestone Stamps',
            description: 'Tap any prominent action tile to record milestones like "Chocks & GPU On", "Bag Offload Start", "Boarding Start", or "All Doors Closed". Visual confirmation banners provide instant feedback.',
          },
        ],
        keyPoints: [
          'High-contrast color scheme ensures legibility in direct sunlight on airport aprons.',
          'Emergency red action button for instant ramp hazard/bottleneck reporting.',
          '100% offline capable with immediate browser IndexedDB caching.',
        ],
      },
      {
        id: 'ground-services',
        iconName: 'Fuel',
        title: 'Ground Services: Fueling, Catering, Cleaning & Maintenance',
        badge: 'GSE Orchestration',
        summary: 'Synchronized coordination of third-party ramp service providers to eliminate bottleneck delays.',
        steps: [
          {
            title: '1. Aircraft Refueling Monitoring',
            description: 'Track fuel truck arrival, hydrant connection, required vs actual loaded uplift (kg/liters), fuel density, and technician sign-off.',
          },
          {
            title: '2. Catering Hi-Lift Management',
            description: 'Log catering truck docking at forward/aft service doors, trolley counts, and catering receipt verification.',
          },
          {
            title: '3. Cabin Cleaning & Security Search',
            description: 'Record cleaning crew boarding, cabin security search sign-off, and cabin ready clearance prior to passenger boarding.',
          },
          {
            title: '4. Potable Water, Lavatory & Technical Maintenance',
            description: 'Document water servicing, lavatory waste servicing, and aircraft line maintenance engineer sign-off in the Aircraft Tech Log.',
          },
        ],
        keyPoints: [
          'Attach photo evidence for cabin condition or equipment defects.',
          'Parallel timeline views ensure fueling and boarding safety compliance.',
        ],
      },
      {
        id: 'baggage',
        iconName: 'Luggage',
        title: 'Baggage & Cargo Handling Management',
        badge: 'Hold & Baggage',
        summary: 'End-to-end monitoring of baggage offload, hold loading, ULD container positions, and baggage reconciliation.',
        steps: [
          {
            title: '1. Inbound Baggage Offload',
            description: 'Record cargo door opening, offload commencement, and First Bag / Last Bag delivery timestamps to the passenger reclaim belt.',
          },
          {
            title: '2. Outbound Baggage Loading',
            description: 'Monitor live baggage loading counts vs checked bags, ULD distribution in forward/aft cargo holds, and bulk hold cargo netting.',
          },
          {
            title: '3. Rush Bags & Hot Transfer Connections',
            description: 'Track expedited transfer luggage for tight flight connections to prevent mishandled baggage claims.',
          },
        ],
        keyPoints: [
          'Full IATA Baggage Reconciliation System (BRS) compatibility.',
          'Dangerous Goods (DGR) and Live Animals (AVI) notification tracking.',
        ],
      },
      {
        id: 'passengers',
        iconName: 'Users',
        title: 'Passenger Boarding & PRM Accessibility',
        badge: 'Passenger Care',
        summary: 'Sequential boarding zone tracking, passenger counts reconciliation, ambulift service, and gate closure.',
        steps: [
          {
            title: '1. Boarding Sequencing',
            description: 'Record gate opening, priority passenger boarding, general boarding by zone, and jetbridge/bus operations.',
          },
          {
            title: '2. Passengers with Reduced Mobility (PRM)',
            description: 'Log ambulift docking, wheelchair assistance, and escorting PRM guests safely to their seats prior to general boarding.',
          },
          {
            title: '3. Final Headcount & Offload of No-Shows',
            description: 'Reconcile scanned passenger count against booked seats. Trigger offload of luggage if a passenger fails to board in time.',
          },
        ],
        keyPoints: [
          'Real-time passenger boarding progress percentage indicator.',
          'Confirmation of loadsheet delivery and passenger manifest handover to flight crew.',
        ],
      },
      {
        id: 'delays-incidents',
        iconName: 'AlertOctagon',
        title: 'IATA Delay Codes & Incident Safety Reporting',
        badge: 'Safety & Quality',
        summary: 'Standardized IATA delay cause attribution and comprehensive ramp hazard incident documentation with photo evidence.',
        steps: [
          {
            title: '1. Assign Official IATA Delay Codes',
            description: 'If departure exceeds scheduled time (STD), assign the exact numeric code (e.g. Code 89 Reactionary, Code 41 Baggage, Code 51 Fueling).',
          },
          {
            title: '2. Log Ramp Incident or Safety Hazard',
            description: 'Click "Report Problem" and select the problem category (Baggage, Aircraft, GSE, Fuel, Security, Weather, Technical).',
          },
          {
            title: '3. Capture Camera Evidence',
            description: 'Attach a live photo from the device camera. The image is compressed and permanently bound to the incident log with GPS coordinates.',
          },
        ],
        keyPoints: [
          'Standardized documentation protects ground handlers in airline delay dispute reviews.',
          'Severity grading (Low, Medium, High, Critical) with automatic supervisor notifications.',
        ],
      },
      {
        id: 'offline-sync',
        iconName: 'RefreshCw',
        title: 'Offline-First Architecture & Auto-Sync Hub',
        badge: 'Zero Data Loss',
        summary: 'Continuous ramp operation during Wi-Fi/cellular dead zones powered by client-side IndexedDB persistence.',
        steps: [
          {
            title: '1. Seamless Offline Operation',
            description: 'When network signal drops, the red "OFFLINE APIC CACHING" badge activates. All stamping and logging functions continue instantly without delay.',
          },
          {
            title: '2. Idempotent Local Storage with UUID',
            description: 'Each stamped milestone receives an authoritative UTC timestamp and an idempotent event UUID stored in IndexedDB.',
          },
          {
            title: '3. Automatic Reconnection Flushes',
            description: 'As soon as connection is restored, the sync engine automatically transmits all queued records in chronological sequence without duplication.',
          },
          {
            title: '4. Manual Backup & JSON Export',
            description: 'Access the "Offline Sync Hub" at any time and click "EXPORT LOCAL DB" to download a full JSON copy of local operational data.',
          },
        ],
        keyPoints: [
          'Guaranteed data integrity even if the browser tab is closed or device is restarted.',
          'Force Full Resync button allows manual immediate network transmission.',
        ],
      },
      {
        id: 'ai-assistant',
        iconName: 'Sparkles',
        title: 'AI Turnaround Operational Advisor',
        badge: 'AI Powered',
        summary: 'Intelligent AI assistant analyzing turnaround progress, identifying critical bottlenecks, and suggesting mitigation strategies.',
        steps: [
          {
            title: '1. Access AI Advisor',
            description: 'Click on "AI Turnaround Advisor" from the main sidebar.',
          },
          {
            title: '2. Ask Natural Language Operations Queries',
            description: 'Ask questions like: "Which flights are at risk of missing target turnaround?", "Analyze delay root cause for QR102", or "Generate a shift handover briefing".',
          },
          {
            title: '3. Receive Actionable Insights',
            description: 'The AI inspects live flight milestones, luggage counts, and incidents to output structured recommendations for ground dispatchers.',
          },
        ],
        keyPoints: [
          'One-click shift handover briefing summary generation.',
          'Predictive delay estimation based on real-time service completion rates.',
        ],
      },
    ],
    quickFaq: [
      {
        q: 'Can this application run on mobile phones, tablets, and desktop computers?',
        a: 'Yes, AeroTurn is built with a fully responsive architecture optimized for smartphones, rugged industrial ramp tablets, and operations control room desktops.',
      },
      {
        q: 'How is timestamp integrity guaranteed against device clock tampering?',
        a: 'The system cross-references device timestamps with server UTC time, includes GPS satellite telemetry, and stores all corrections in an append-only audit trail.',
      },
      {
        q: 'Can turnaround reports be exported and sent to airlines?',
        a: 'Yes, from the "Turnaround Reports" module you can print or export comprehensive compliance summaries with event logs, staff IDs, and attached photos.',
      },
    ],
  },
  fr: {
    appTitle: "Guide d'Utilisation des Opérations au Sol et Escale (AeroTurn)",
    appSubtitle: "Manuel opérationnel complet pour le suivi des étapes d'escale avion (Turnaround), horodatage UTC & GPS, synchronisation hors-ligne et gestion de piste.",
    langName: 'Français',
    searchPlaceholder: 'Rechercher dans le guide (ex: horodatage, carburant, bagages, retards IATA, hors-ligne)...',
    quickStartTitle: 'Démarrage Rapide : 4 Étapes pour Maîtriser une Escale Avion',
    quickStartDesc: "Guide visuel express pour suivre un aéronef du calage à l'atterrissage jusqu'au décollage ponctuel.",
    roleGuidesTitle: 'Fiches Pratiques par Rôle Opérationnel',
    roleGuidesDesc: 'Sélectionnez votre fonction pour découvrir vos responsabilités et flux de travail quotidiens.',
    sectionsTitle: 'Modules et Systèmes Opérationnels',
    cheatSheetTitle: 'Fiche Mémo de Piste (Ramp Pocket Card)',
    cheatSheetDesc: "Aide-mémoire compact des procédures de piste pour impression ou consultation rapide.",
    copyCheatSheet: 'Copier le Résumé de Piste',
    copied: 'Copié dans le presse-papiers !',
    printGuide: 'Imprimer le Guide',
    roles: [
      {
        roleTitle: 'Agent de Piste (Ramp Agent)',
        badge: 'Piste & Tarmac',
        mission: "Horodater les étapes d'escale au sol en 1 clic avec coordonnées UTC et GPS fiables.",
        steps: [
          'Ouvrez le module "Ramp Quick Agent", optimisé avec de grands boutons utilisables avec des gants.',
          "Sélectionnez le vol et le poste de stationnement (Stand) dans le sélecteur d'aéronef en haut.",
          "À chaque étape franchie (Calage/Chocks, Portes, Déchargement, Carburant, Fermeture), appuyez sur le bouton '1-TAP STAMP'.",
          "En cas d'anomalie ou obstacle sur piste, cliquez sur 'REPORT RAMP PROBLEM' et capturez une photo immédiate.",
        ],
      },
      {
        roleTitle: "Superviseur d'Escale (Turnaround Supervisor)",
        badge: 'Supervision & Audit',
        mission: 'Piloter le chemin critique de l’escale, valider le devis de masse et superviser les rectifications d’audit.',
        steps: [
          'Surveillez le tableau de bord principal et la jauge de progression du temps d’escale cible (Turnaround Target Bar).',
          'Vérifiez la chronologie séquentielle des 14 jalons pour vous assurer du bon déroulement des services parallèles.',
          'En cas d’erreur de saisie, effectuez une rectification de supervision justifiée (enregistrée dans le journal d’audit immuable).',
          'Signez électroniquement la clôture de devis de masse (Loadsheet) avant d’autoriser le repoussage (Pushback).',
        ],
      },
      {
        roleTitle: 'Coordinateur & Chef d’Escale (Ops Manager & Dispatcher)',
        badge: 'Centre de Contrôle',
        mission: 'Superviser la ponctualité (OTP), allouer les postes sur la carte du tarmac et codifier les retards IATA.',
        steps: [
          'Consultez la carte du tarmac (Apron Map) pour équilibrer l’occupation des postes et des passerelles.',
          'En cas de retard sur le vol, attribuez le code de retard IATA officiel et le département responsable.',
          'Sollicitez l’assistant IA d’escale pour identifier les goulots d’étranglement et estimer l’heure de départ (ETD).',
          'Générez et exportez les rapports de conformité d’escale aux formats PDF et JSON pour les compagnies aériennes.',
        ],
      },
    ],
    sections: [
      {
        id: 'timeline',
        iconName: 'Clock',
        title: 'Chronologie d’Escale et Horodatage 1-Clic (Turnaround Timeline)',
        badge: 'Moteur Central',
        summary: 'Journal chronologique immuable des jalons opérationnels horodatés en UTC avec géolocalisation GPS.',
        steps: [
          {
            title: '1. Sélectionner le Vol et Vérifier les Jalons',
            description: 'Cliquez sur une carte de vol depuis le tableau de bord pour ouvrir sa chronologie détaillée. Les 14 jalons standards IATA sont présentés dans l’ordre logique de traitement.',
            tips: 'Vert : Terminé | Jaune : En cours | Rouge : Problème/Retard | Gris : En attente.',
          },
          {
            title: '2. Enregistrement par Horodatage 1-Clic (1-Tap Stamp)',
            description: 'Appuyez sur "1-TAP STAMP" sur le jalon actif. L’application capture l’heure UTC de référence, l’heure locale aéroportuaire et les coordonnées GPS précises.',
            tips: 'Les données sont immédiatement stockées en local dans IndexedDB et mises en file d’attente pour synchronisation.',
          },
          {
            title: '3. Rectifications de Supervision et Journal d’Audit',
            description: 'Les superviseurs peuvent corriger un horaire avec justification. L’enregistrement initial reste conservé dans l’historique immuable (Append-Only Audit).',
          },
        ],
        keyPoints: [
          'L’horodatage UTC garantit la conformité légale aux standards de l’aviation civile.',
          'Chaque action identifie l’agent, son matricule et son rôle précis.',
          'Calcul dynamique du compte à rebours et de la variance par rapport au temps alloué.',
        ],
        faq: [
          {
            q: 'Que faire en cas d’appui prématuré sur un bouton d’étape ?',
            a: 'Le superviseur peut cliquer sur l’icône de modification pour annoter l’étape, la repasser en cours ou ajouter un commentaire rectificatif.',
          },
        ],
      },
      {
        id: 'ramp-mode',
        iconName: 'Smartphone',
        title: 'Mode Piste & Utilisation avec Gants (Ramp Agent Field Mode)',
        badge: 'Optimisé Piste',
        summary: 'Interface tactile simplifiée à fort contraste et larges cibles pour une utilisation aisée sous la lumière directe du tarmac.',
        steps: [
          {
            title: '1. Basculer en Mode Piste Rapide',
            description: 'Sélectionnez "Ramp Quick Agent" dans le menu. L’interface s’adapte idéalement aux smartphones et tablettes industrielles de piste.',
          },
          {
            title: '2. Choisir l’Aéronef Traité',
            description: 'Sélectionnez le vol dans la liste pour afficher l’immatriculation, le type d’avion, la porte et le poste de stationnement.',
          },
          {
            title: '3. Horodater les Événements Successifs',
            description: 'Touchez le bouton correspondant (Calage, Début déchargement bagages, Plein carburant, Fermeture portes). Un retour visuel confirme l’enregistrement.',
          },
        ],
        keyPoints: [
          'Boutons surdimensionnés évitant les fausses manipulations avec des gants de sécurité.',
          'Bouton d’urgence rouge pour signaler instantanément un danger sur piste (Ramp Problem).',
          'Fonctionnement 100% autonome hors-ligne avec mémoire locale.',
        ],
      },
      {
        id: 'ground-services',
        iconName: 'Fuel',
        title: 'Services au Sol : Carburant, Catering, Nettoyage & Maintenance',
        badge: 'Coordination GSE',
        summary: 'Suivi synchronisé des prestataires d’assistance pour fluidifier le chemin critique.',
        steps: [
          {
            title: '1. Ravitaillement Carburant (Fueling)',
            description: 'Enregistrez l’arrivée du camion citerne, le début de pompage, la quantité demandée vs injectée (kg/litres), et le visa du technicien.',
          },
          {
            title: '2. Commissariat de Bord (Catering)',
            description: 'Suivez l’accostage des camions élévateurs, le nombre de chariots (trolleys) échangés et la signature du bon de livraison.',
          },
          {
            title: '3. Nettoyage Cabine & Inspection de Sûreté',
            description: 'Enregistrez la montée de l’équipe de nettoyage, la validation de la fouille de sûreté et l’autorisation "Cabine Prête" pour l’embarquement.',
          },
          {
            title: '4. Eau Potable, Vidange Sanitaire & Maintenance en Ligne',
            description: 'Documentez le plein d’eau potable, la vidange des toilettes et le visa des mécaniciens sur le carnet de route (Tech Log).',
          },
        ],
        keyPoints: [
          'Possibilité d’attacher des photos en cas de détérioration ou d’anomalie.',
          'Visualisation parallèle pour respecter les normes de sécurité carburant/embarquement.',
        ],
      },
      {
        id: 'baggage',
        iconName: 'Luggage',
        title: 'Traitement des Bagages & Fret (Baggage & Cargo)',
        badge: 'Soutes & Rapprochement',
        summary: 'Suivi du déchargement et chargement des soutes, positionnement des conteneurs ULD et réconciliation des bagages.',
        steps: [
          {
            title: '1. Déchargement Arrivée',
            description: 'Horodatez l’ouverture des soutes, le début de déchargement et l’acheminement du Premier et Dernier Bagage (First/Last Bag) sur le tapis livraison.',
          },
          {
            title: '2. Chargement Départ & Rapprochement',
            description: 'Suivez le décompte des bagages enregistrés vs chargés en soute, la répartition des conteneurs ULD (avant/arrière/vrac) et la pose des filets.',
          },
          {
            title: '3. Bagages en Correspondance Courte (Rush & Hot Bags)',
            description: 'Identifiez et traitez en priorité les bagages de correspondance à court délai pour éviter les bagages non embarqués.',
          },
        ],
        keyPoints: [
          'Conformité stricte aux exigences de réconciliation bagages IATA (BRS).',
          'Suivi des marchandises dangereuses (DGR) et animaux vivants (AVI).',
        ],
      },
      {
        id: 'passengers',
        iconName: 'Users',
        title: 'Embarquement des Passagers & Assistance PMR',
        badge: 'Service Passagers',
        summary: 'Séquencement des zones d’embarquement, décompte passagers, assistance personnes à mobilité réduite et clôture porte.',
        steps: [
          {
            title: '1. Séquencement de l’Embarquement',
            description: 'Horodatez l’ouverture de la porte, l’embarquement prioritaire, l’embarquement par zones et la gestion des passerelles/bus.',
          },
          {
            title: '2. Assistance Passagers PMR',
            description: 'Coordonnez l’accostage du véhicule élévateur (Ambulift), l’aide aux fauteuils roulants et l’installation en cabine avant l’embarquement général.',
          },
          {
            title: '3. Rapprochement Final et Débarquement des Absents',
            description: 'Comparez le nombre de passagers scannés à bord avec le manifeste. En cas de passager absent, ordonnez le déchargement de ses bagages.',
          },
        ],
        keyPoints: [
          'Indicateur en direct du pourcentage de passagers embarqués.',
          'Confirmation de remise du devis de masse et du manifeste au commandant de bord.',
        ],
      },
      {
        id: 'delays-incidents',
        iconName: 'AlertOctagon',
        title: 'Gestion des Retards IATA & Signalement d’Incidents',
        badge: 'Sécurité & Qualité',
        summary: 'Codification normalisée des causes de retard selon les standards IATA et signalement d’incidents avec photos.',
        steps: [
          {
            title: '1. Affecter le Code de Retard IATA',
            description: 'Si le départ réel dépasse l’heure prévue (STD), sélectionnez le code exact (ex: Code 89 Vol précédent, Code 41 Bagages, Code 51 Carburant).',
          },
          {
            title: '2. Signaler un Incident ou Danger Piste',
            description: 'Cliquez sur "Report Problem" et choisissez la catégorie (Bagages, Avion, Engins sol, Carburant, Sécurité, Météo, Technique).',
          },
          {
            title: '3. Joindre des Photos et Preuves',
            description: 'Prenez une photo en direct avec l’appareil. L’image compressée est liée au rapport avec ses coordonnées GPS.',
          },
        ],
        keyPoints: [
          'Dossier de preuve incontestable en cas de litige de ponctualité avec la compagnie aérienne.',
          'Niveaux de sévérité (Faible, Moyen, Élevé, Critique) avec alerte superviseur.',
        ],
      },
      {
        id: 'offline-sync',
        iconName: 'RefreshCw',
        title: 'Fonctionnement Hors-Ligne & Synchronisation Auto',
        badge: 'Zéro Perte de Données',
        summary: 'Continuité absolue de service en zone d’ombre réseau grâce à la persistance IndexedDB dans le navigateur.',
        steps: [
          {
            title: '1. Fonctionnement Fluide sans Réseau',
            description: 'En cas de perte de connexion, le badge rouge "OFFLINE" s’affiche. Toutes les saisies et horodatages continuent sans aucune interruption.',
          },
          {
            title: '2. Stockage Local Idempotent avec UUID',
            description: 'Chaque événement reçoit un identifiant UUID unique et un horodatage UTC stocké dans la base locale IndexedDB.',
          },
          {
            title: '3. Synchronisation Automatique dès Reconnexion',
            description: 'Dès que le réseau revient, le moteur de synchronisation expédie la file d’attente dans l’ordre chronologique sans doublons.',
          },
          {
            title: '4. Sauvegarde et Export JSON',
            description: 'Dans le module "Offline Sync Hub", cliquez sur "EXPORT LOCAL DB" pour télécharger une copie de sauvegarde JSON complète.',
          },
        ],
        keyPoints: [
          'Sécurité absolue des données même en cas de fermeture de l’onglet ou d’extinction de l’appareil.',
          'Bouton "Force Full Resync" pour forcer manuellement la transmission immédiate.',
        ],
      },
      {
        id: 'ai-assistant',
        iconName: 'Sparkles',
        title: 'Conseiller IA des Opérations au Sol (AI Turnaround Advisor)',
        badge: 'Intelligence Artificielle',
        summary: 'Assistant intelligent qui analyse le déroulement de l’escale, détecte les retards critiques et suggère des actions correctives.',
        steps: [
          {
            title: '1. Consulter le Conseiller IA',
            description: 'Cliquez sur "AI Turnaround Advisor" dans la barre latérale.',
          },
          {
            title: '2. Poser des Questions Opérationnelles',
            description: 'Demandez par exemple : "Quels vols risquent de dépasser le temps d’escale ?", "Analyse la cause du retard du vol QR102", ou "Génère le rapport de fin de vacation".',
          },
          {
            title: '3. Obtenir des Analyses Prédictives',
            description: 'L’IA examine l’état des bagages, du carburant et des passagers pour fournir des recommandations d’action concrètes.',
          },
        ],
        keyPoints: [
          'Génération en 1 clic des comptes-rendus de passation de consignes de quart (Shift Handover).',
          'Suggestion automatique des codes de retard IATA pertinents.',
        ],
      },
    ],
    quickFaq: [
      {
        q: 'L’application est-elle compatible avec les smartphones, tablettes et ordinateurs ?',
        a: 'Oui, AeroTurn est entièrement adaptatif et fonctionne sur smartphones, tablettes durcies de piste et ordinateurs de salle de contrôle.',
      },
      {
        q: 'Comment est garantie l’intégrité des horodatages ?',
        a: 'Les horodatages sont corrélés en UTC avec l’heure réseau et les coordonnées GPS, puis verrouillés dans un journal d’audit immuable.',
      },
      {
        q: 'Peut-on exporter un rapport complet d’escale pour la compagnie aérienne ?',
        a: 'Oui, depuis le module "Turnaround Reports", vous pouvez imprimer ou exporter le compte-rendu complet avec jalons, photos, visas et causes de retard.',
      },
    ],
  },
};
