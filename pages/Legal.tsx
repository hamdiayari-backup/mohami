import React from 'react';

const LegalLayout = ({ title, children, onBack }: { title: string, children: React.ReactNode, onBack: () => void }) => (
  <div className="min-h-screen bg-slate-50 font-sans" dir="rtl">
    <nav className="bg-slate-900 text-white p-4 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-3 space-x-reverse cursor-pointer" onClick={onBack}>
          <img 
            src="/assets/logo.png" 
            alt="المحامي" 
            className="w-8 h-8 rounded-lg object-contain"
          />
          <span className="font-bold text-lg">المحامي</span>
        </div>
        <button onClick={onBack} className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded transition">
          العودة للرئيسية
        </button>
      </div>
    </nav>
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold text-slate-900 mb-8">{title}</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 prose prose-lg prose-slate max-w-none">
        {children}
      </div>
      <div className="mt-8 p-6 bg-slate-100 rounded-lg">
        <h3 className="font-bold text-slate-900 mb-4">معلومات الشركة</h3>
        <p className="text-sm text-slate-700 mb-2"><strong>الاسم:</strong> NOVALABS WEB DESIGN</p>
        <p className="text-sm text-slate-700 mb-2"><strong>العنوان:</strong> 2 Rue Lac Loch Ness, Tunis 1053, Tunis 1021</p>
        <p className="text-sm text-slate-700 mb-2"><strong>البريد الإلكتروني:</strong> contact@novalabs.tn</p>
        <p className="text-sm text-slate-700"><strong>الهاتف:</strong> +216 24 73 46 47</p>
      </div>
    </div>
  </div>
);

export const TermsPage = ({ onBack }: { onBack: () => void }) => (
  <LegalLayout title="شروط الاستخدام" onBack={onBack}>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">1. مقدمة وقبول الشروط</h2>
        <p className="mb-4">
          مرحباً بكم في منصة "المحامي" (المنصة) المملوكة والمدارة من قبل شركة <strong>NOVALABS WEB DESIGN</strong> 
          (المشار إليها فيما يلي بـ "نحن"، "لنا"، "الشركة"). باستخدام هذه المنصة، فإنك تقر بأنك قد قرأت وفهمت ووافقت 
          على الالتزام بجميع الشروط والأحكام الواردة في هذه الوثيقة.
        </p>
        <p className="mb-4">
          إذا كنت لا توافق على أي من هذه الشروط، يرجى عدم استخدام المنصة. نحن نحتفظ بالحق في تعديل هذه الشروط 
          في أي وقت، وسيتم إشعارك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار على المنصة.
        </p>
        <p className="mb-4">
          <strong>تاريخ آخر تحديث:</strong> {new Date().toLocaleDateString('ar-TN', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">2. تعريفات</h2>
        <ul className="list-disc list-inside space-y-2 mb-4">
          <li><strong>"المنصة"</strong> تشير إلى موقع الويب والتطبيق الإلكتروني "المحامي" وجميع الخدمات المرتبطة به.</li>
          <li><strong>"المستخدم"</strong> أو <strong>"أنت"</strong> يشير إلى أي شخص أو كيان قانوني يستخدم المنصة.</li>
          <li><strong>"الخدمة"</strong> تشير إلى جميع الخدمات المقدمة من خلال المنصة بما في ذلك التحليل بالذكاء الاصطناعي، إدارة القضايا، والمكتبة القانونية.</li>
          <li><strong>"البيانات"</strong> تشير إلى جميع المعلومات والملفات والوثائق التي تقوم برفعها أو إدخالها في المنصة.</li>
          <li><strong>"الموكل"</strong> يشير إلى العميل الذي يمثله المستخدم (المحامي) في القضايا القانونية.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">3. قبول الشروط والقيود</h2>
        <p className="mb-4">
          <strong>3.1.</strong> يجب أن تكون قد بلغت سن الرشد القانوني (18 سنة) أو أن يكون لديك موافقة الوالدين أو الوصي القانوني لاستخدام هذه المنصة.
        </p>
        <p className="mb-4">
          <strong>3.2.</strong> أنت مسؤول عن الحفاظ على سرية معلومات حسابك وكلمة المرور. أنت توافق على تحمل المسؤولية الكاملة عن جميع الأنشطة التي تحدث تحت حسابك.
        </p>
        <p className="mb-4">
          <strong>3.3.</strong> أنت توافق على استخدام المنصة فقط للأغراض القانونية والمهنية المشروعة. يمنع استخدام المنصة لأي أغراض غير قانونية أو احتيالية أو ضارة.
        </p>
        <p className="mb-4">
          <strong>3.4.</strong> أنت توافق على عدم محاولة الوصول غير المصرح به إلى المنصة أو أنظمتها أو شبكاتها.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">4. الخدمات المقدمة</h2>
        <p className="mb-4">
          <strong>4.1.</strong> تقدم المنصة خدمات مساعدة للمحامين تشمل:
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 mr-4">
          <li>تحليل الوثائق القانونية باستخدام الذكاء الاصطناعي</li>
          <li>إدارة القضايا والمواعيد</li>
          <li>مكتبة قانونية للاستشارات</li>
          <li>تحليل العقود والوثائق</li>
          <li>خدمات الدردشة والدعم</li>
        </ul>
        <p className="mb-4">
          <strong>4.2.</strong> نحن نحتفظ بالحق في تعديل أو تعليق أو إيقاف أي جزء من الخدمات في أي وقت دون إشعار مسبق.
        </p>
        <p className="mb-4">
          <strong>4.3.</strong> نحن لا نضمن أن الخدمات ستكون متاحة بشكل مستمر أو خالية من الأخطاء.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">5. إخلاء المسؤولية المهم</h2>
        <div className="bg-yellow-50 border-r-4 border-yellow-400 p-4 mb-4">
          <p className="font-bold text-yellow-900 mb-2">⚠️ تنبيه قانوني مهم:</p>
          <p className="text-yellow-800">
            التحليلات والنتائج التي يقدمها الذكاء الاصطناعي في هذه المنصة هي <strong>أدوات مساعدة فقط</strong> 
            وليست بديلاً عن الرأي القانوني المهني أو الاستشارة القانونية المباشرة من محامٍ مؤهل.
          </p>
        </div>
        <p className="mb-4">
          <strong>5.1.</strong> نحن لا نقدم استشارات قانونية مباشرة ولا نكون علاقة محامي-موكل مع أي مستخدم.
        </p>
        <p className="mb-4">
          <strong>5.2.</strong> جميع التحليلات والنتائج المقدمة هي لأغراض إعلامية ومساعدة فقط. يجب عليك دائماً 
          مراجعة جميع النتائج مع محامٍ مؤهل قبل اتخاذ أي قرارات قانونية.
        </p>
        <p className="mb-4">
          <strong>5.3.</strong> نحن لا نتحمل أي مسؤولية عن:
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 mr-4">
          <li>أي قرارات قانونية تتخذها بناءً على التحليلات المقدمة</li>
          <li>أي أضرار أو خسائر ناتجة عن استخدام أو عدم القدرة على استخدام الخدمات</li>
          <li>أي أخطاء أو إغفالات في التحليلات المقدمة</li>
          <li>أي انتهاكات للقوانين أو اللوائح من قبل المستخدم</li>
          <li>أي خسائر تجارية أو بيانات أو أرباح محتملة</li>
        </ul>
        <p className="mb-4">
          <strong>5.4.</strong> أنت توافق صراحة على أن استخدامك للخدمات يكون على مسؤوليتك الخاصة وأنك تتحمل 
          جميع المخاطر المرتبطة بذلك.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">6. حقوق الملكية الفكرية</h2>
        <p className="mb-4">
          <strong>6.1.</strong> جميع المحتويات الموجودة على هذه المنصة، بما في ذلك على سبيل المثال لا الحصر: النصوص، 
          التصاميم، الشعارات، الأكواد البرمجية، الواجهات، الرسوم البيانية، الصور، والأيقونات، هي ملكية حصرية 
          لشركة <strong>NOVALABS WEB DESIGN</strong> ومحمية بموجب قوانين حقوق الملكية الفكرية التونسية والدولية.
        </p>
        <p className="mb-4">
          <strong>6.2.</strong> يتم منحك رخصة محدودة وغير حصرية وغير قابلة للتحويل لاستخدام المنصة لأغراضك المهنية 
          الشخصية فقط. يمنع منعاً باتاً:
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 mr-4">
          <li>نسخ أو إعادة إنتاج أو توزيع أي جزء من المنصة</li>
          <li>عكس هندسة أو محاولة استخراج الكود المصدري</li>
          <li>إنشاء أعمال مشتقة بناءً على المنصة</li>
          <li>استخدام المنصة لأغراض تجارية غير مصرح بها</li>
          <li>إزالة أو تعديل أي إشعارات حقوق الملكية</li>
        </ul>
        <p className="mb-4">
          <strong>6.3.</strong> جميع العلامات التجارية والأسماء التجارية المستخدمة في المنصة هي ملكية لأصحابها 
          المعنيين. استخدامك للمنصة لا يمنحك أي حقوق في هذه العلامات التجارية.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">7. بيانات المستخدم والملفات</h2>
        <p className="mb-4">
          <strong>7.1.</strong> أنت تحتفظ بجميع حقوق الملكية في البيانات والملفات التي تقوم برفعها إلى المنصة.
        </p>
        <p className="mb-4">
          <strong>7.2.</strong> من خلال رفع البيانات، تمنحنا ترخيصاً محدوداً لاستخدام هذه البيانات فقط لتقديم 
          الخدمات المطلوبة ومعالجة طلباتك.
        </p>
        <p className="mb-4">
          <strong>7.3.</strong> نحن لا نستخدم بياناتك أو ملفاتك لتدريب نماذج الذكاء الاصطناعي العامة أو مشاركتها 
          مع أطراف ثالثة لأغراض تجارية.
        </p>
        <p className="mb-4">
          <strong>7.4.</strong> أنت مسؤول عن التأكد من أن لديك جميع الحقوق والتراخيص اللازمة لرفع أي بيانات أو 
          ملفات إلى المنصة.
        </p>
        <p className="mb-4">
          <strong>7.5.</strong> نحن لا نتحمل أي مسؤولية عن محتوى البيانات التي تقوم برفعها أو عن أي انتهاكات 
          لحقوق الملكية الفكرية من قبل المستخدم.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">8. الاشتراكات والدفع</h2>
        <p className="mb-4">
          <strong>8.1.</strong> تقدم المنصة خطط اشتراك مختلفة (البداية، المحترف، المكتب) بأسعار وقيود مختلفة.
        </p>
        <p className="mb-4">
          <strong>8.2.</strong> جميع الأسعار معروضة بالدينار التونسي (د.ت) وقد تكون قابلة للتغيير دون إشعار مسبق.
        </p>
        <p className="mb-4">
          <strong>8.3.</strong> الدفع يتم عبر التحويل البنكي. نحن لا نتحمل مسؤولية أي تأخير في معالجة التحويلات 
          من قبل البنوك.
        </p>
        <p className="mb-4">
          <strong>8.4.</strong> جميع المدفوعات غير قابلة للاسترداد إلا في حالات محددة بموجب القانون التونسي.
        </p>
        <p className="mb-4">
          <strong>8.5.</strong> نحن نحتفظ بالحق في رفض أو إلغاء أي اشتراك في أي وقت لأسباب تتعلق بالأمان أو 
          انتهاك الشروط.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">9. إيقاف الحساب</h2>
        <p className="mb-4">
          <strong>9.1.</strong> يمكنك إلغاء حسابك في أي وقت من خلال إعدادات الحساب أو التواصل معنا.
        </p>
        <p className="mb-4">
          <strong>9.2.</strong> نحن نحتفظ بالحق في تعليق أو إيقاف حسابك فوراً ودون إشعار مسبق في حالة:
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 mr-4">
          <li>انتهاكك لأي من هذه الشروط</li>
          <li>استخدامك للمنصة لأغراض غير قانونية</li>
          <li>عدم دفع الرسوم المستحقة</li>
          <li>أي نشاط يشكل تهديداً لأمن المنصة أو مستخدميها</li>
        </ul>
        <p className="mb-4">
          <strong>9.3.</strong> في حالة إيقاف حسابك، قد نفقد أو نحذف بياناتك وفقاً لسياسة الخصوصية.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">10. التعديلات على الشروط</h2>
        <p className="mb-4">
          <strong>10.1.</strong> نحن نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم نشر النسخة المحدثة على 
          المنصة مع تحديث تاريخ "آخر تحديث".
        </p>
        <p className="mb-4">
          <strong>10.2.</strong> سيتم إشعارك بأي تغييرات جوهرية عبر البريد الإلكتروني المسجل في حسابك أو 
          إشعار على المنصة.
        </p>
        <p className="mb-4">
          <strong>10.3.</strong> استمرارك في استخدام المنصة بعد نشر التعديلات يعتبر موافقة منك على الشروط 
          المحدثة.
        </p>
        <p className="mb-4">
          <strong>10.4.</strong> إذا كنت لا توافق على التعديلات، يجب عليك إيقاف استخدام المنصة فوراً.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">11. القانون الحاكم والولاية القضائية</h2>
        <p className="mb-4">
          <strong>11.1.</strong> تخضع هذه الشروط وتفسر وفقاً لقوانين الجمهورية التونسية.
        </p>
        <p className="mb-4">
          <strong>11.2.</strong> أي نزاعات تنشأ عن أو تتعلق بهذه الشروط أو استخدام المنصة تخضع للولاية القضائية 
          الحصرية لمحاكم تونس.
        </p>
        <p className="mb-4">
          <strong>11.3.</strong> في حالة وجود أي نزاع، يجب على الأطراف محاولة حله ودياً أولاً قبل اللجوء إلى 
          القضاء.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">12. أحكام عامة</h2>
        <p className="mb-4">
          <strong>12.1.</strong> إذا تم اعتبار أي حكم من هذه الشروط غير صالح أو غير قابل للتنفيذ، فإن باقي 
          الأحكام تبقى سارية ومفعول.
        </p>
        <p className="mb-4">
          <strong>12.2.</strong> عدم ممارستنا لأي حق من الحقوق المنصوص عليها في هذه الشروط لا يعتبر تنازلاً عن 
          هذا الحق.
        </p>
        <p className="mb-4">
          <strong>12.3.</strong> هذه الشروط تشكل الاتفاق الكامل بينك وبيننا فيما يتعلق باستخدام المنصة وتحل 
          محل جميع الاتفاقيات السابقة.
        </p>
        <p className="mb-4">
          <strong>12.4.</strong> لا يجوز لك نقل أو تفويض أي من حقوقك أو التزاماتك بموجب هذه الشروط دون موافقتنا 
          الخطية المسبقة.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">13. الاتصال بنا</h2>
        <p className="mb-4">
          إذا كان لديك أي أسئلة أو استفسارات حول هذه الشروط، يرجى التواصل معنا على:
        </p>
        <ul className="list-none space-y-2 mb-4">
          <li><strong>البريد الإلكتروني:</strong> contact@novalabs.tn</li>
          <li><strong>الهاتف:</strong> +216 24 73 46 47</li>
          <li><strong>العنوان:</strong> 2 Rue Lac Loch Ness, Tunis 1053, Tunis 1021</li>
        </ul>
      </section>
    </div>
  </LegalLayout>
);

export const PrivacyPage = ({ onBack }: { onBack: () => void }) => (
  <LegalLayout title="سياسة الخصوصية" onBack={onBack}>
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">1. مقدمة</h2>
        <p className="mb-4">
          تحترم شركة <strong>NOVALABS WEB DESIGN</strong> (المشار إليها بـ "نحن"، "لنا"، "الشركة") خصوصيتك 
          وتلتزم بحماية بياناتك الشخصية. تشرح هذه السياسة كيف نجمع ونستخدم ونحمي معلوماتك عند استخدامك 
          لمنصة "المحامي".
        </p>
        <p className="mb-4">
          نحن ملتزمون بالامتثال الكامل لقانون حماية البيانات الشخصية التونسي (قانون 2004-63) واللوائح 
          الأوروبية العامة لحماية البيانات (GDPR) حيثما ينطبق.
        </p>
        <p className="mb-4">
          <strong>تاريخ آخر تحديث:</strong> {new Date().toLocaleDateString('ar-TN', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">2. البيانات التي نجمعها</h2>
        <h3 className="text-xl font-bold text-slate-800 mb-3">2.1. البيانات الشخصية</h3>
        <p className="mb-4">
          نجمع البيانات التالية عند التسجيل واستخدام المنصة:
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 mr-4">
          <li><strong>معلومات الهوية:</strong> الاسم الكامل، البريد الإلكتروني، رقم الهاتف (اختياري)</li>
          <li><strong>معلومات الحساب:</strong> كلمة المرور (مشفرة)، نوع الاشتراك، حالة الحساب</li>
          <li><strong>معلومات المهنة:</strong> نوع الممارسة القانونية، التخصص (إن وجد)</li>
          <li><strong>معلومات الاستخدام:</strong> سجل تسجيل الدخول، الصفحات التي تزورها، الميزات المستخدمة</li>
        </ul>

        <h3 className="text-xl font-bold text-slate-800 mb-3">2.2. البيانات الحساسة (ملفات القضايا)</h3>
        <p className="mb-4">
          عند رفع ملفات القضايا والوثائق القانونية:
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 mr-4">
          <li>نقوم بتخزين الملفات التي ترفعها فقط لغرض المعالجة والتحليل</li>
          <li>لا نستخدم هذه الملفات لتدريب نماذج الذكاء الاصطناعي العامة</li>
          <li>لا نشارك هذه الملفات مع أي أطراف ثالثة</li>
          <li>نحتفظ بالملفات فقط طوال مدة اشتراكك النشط</li>
        </ul>

        <h3 className="text-xl font-bold text-slate-800 mb-3">2.3. البيانات التقنية</h3>
        <p className="mb-4">
          نجمع تلقائياً معلومات تقنية عند استخدام المنصة:
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 mr-4">
          <li>عنوان IP</li>
          <li>نوع المتصفح ونظام التشغيل</li>
          <li>معرفات الأجهزة</li>
          <li>سجلات الوصول والأنشطة</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">3. كيف نستخدم بياناتك</h2>
        <p className="mb-4">
          <strong>3.1. تقديم الخدمات:</strong> نستخدم بياناتك لتقديم وتحسين خدمات المنصة، بما في ذلك:
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 mr-4">
          <li>معالجة وتحليل الوثائق القانونية التي ترفعها</li>
          <li>إدارة حسابك واشتراكك</li>
          <li>توفير الدعم الفني والرد على استفساراتك</li>
          <li>إرسال إشعارات مهمة متعلقة بخدمتك</li>
        </ul>

        <p className="mb-4">
          <strong>3.2. الأمان والامتثال:</strong> نستخدم بياناتك لـ:
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 mr-4">
          <li>التحقق من هويتك ومنع الاحتيال</li>
          <li>ضمان الامتثال للقوانين واللوائح</li>
          <li>حماية أمن المنصة ومستخدميها</li>
        </ul>

        <p className="mb-4">
          <strong>3.3. التحسينات:</strong> نستخدم بيانات مجمعة وغير قابلة للتعريف لتحسين أداء المنصة وتجربة المستخدم.
        </p>

        <p className="mb-4">
          <strong>3.4. التواصل:</strong> قد نستخدم بريدك الإلكتروني لإرسال:
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 mr-4">
          <li>إشعارات مهمة عن حسابك</li>
          <li>تحديثات عن الخدمات</li>
          <li>رسائل تسويقية (يمكنك إلغاء الاشتراك في أي وقت)</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">4. حماية البيانات والتشفير</h2>
        <div className="bg-blue-50 border-r-4 border-blue-400 p-4 mb-4">
          <p className="font-bold text-blue-900 mb-2">🔒 التزامنا بأمن البيانات:</p>
          <p className="text-blue-800">
            نحن نستخدم أحدث تقنيات التشفير والأمان لحماية بياناتك. جميع البيانات الحساسة يتم تشفيرها 
            أثناء النقل والتخزين.
          </p>
        </div>

        <h3 className="text-xl font-bold text-slate-800 mb-3">4.1. التشفير أثناء النقل (In-Transit Encryption)</h3>
        <p className="mb-4">
          جميع الاتصالات بين متصفحك وخوادمنا محمية بتشفير SSL/TLS (HTTPS) باستخدام بروتوكولات 
          التشفير الحديثة:
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 mr-4">
          <li><strong>TLS 1.3:</strong> أحدث بروتوكول تشفير آمن</li>
          <li><strong>شهادات SSL:</strong> شهادات موقعة من سلطة معتمدة</li>
          <li><strong>Perfect Forward Secrecy:</strong> ضمان عدم كشف البيانات السابقة حتى في حالة اختراق المفاتيح</li>
        </ul>
        <div className="bg-gray-100 p-3 rounded mb-4 font-mono text-sm">
          <p className="text-xs text-gray-600 mb-1">مثال تقني:</p>
          <code>HTTPS://platform.com → TLS 1.3 Encryption → Secure Server</code>
        </div>

        <h3 className="text-xl font-bold text-slate-800 mb-3">4.2. التشفير أثناء التخزين (At-Rest Encryption)</h3>
        <p className="mb-4">
          جميع البيانات المخزنة في قاعدة البيانات محمية بتشفير على مستوى قاعدة البيانات:
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 mr-4">
          <li><strong>تشفير قاعدة البيانات:</strong> PostgreSQL مع تشفير AES-256</li>
          <li><strong>تشفير الملفات:</strong> جميع الملفات المرفوعة مشفرة قبل التخزين</li>
          <li><strong>تشفير كلمات المرور:</strong> كلمات المرور مشفرة باستخدام خوارزميات hash آمنة (bcrypt/scrypt)</li>
        </ul>
        <div className="bg-gray-100 p-3 rounded mb-4 font-mono text-sm">
          <p className="text-xs text-gray-600 mb-1">مثال تقني لتشفير كلمة المرور:</p>
          <code>Password: "user123" → Hash: "$2b$10$N9qo8uLOickgx2ZMRZoMye..."</code>
          <p className="text-xs text-gray-600 mt-1">(لا يمكن عكس هذا التشفير)</p>
        </div>

        <h3 className="text-xl font-bold text-slate-800 mb-3">4.3. عدم تخزين البيانات الحساسة</h3>
        <p className="mb-4">
          <strong>نؤكد صراحة:</strong> نحن <strong>لا نخزن</strong> البيانات التالية في أي مكان في منصتنا:
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 mr-4">
          <li>كلمات المرور في نص واضح (يتم hash فقط)</li>
          <li>معلومات بطاقات الائتمان (لا نقبلها أصلاً)</li>
          <li>بيانات الموكلين في سجلات غير مشفرة</li>
          <li>محتوى الوثائق في سجلات النظام أو ملفات السجل</li>
        </ul>
        <div className="bg-gray-100 p-3 rounded mb-4 font-mono text-sm">
          <p className="text-xs text-gray-600 mb-1">مثال من الكود - لا نستخدم:</p>
          <code className="text-red-600">❌ console.log(password) // محظور تماماً</code><br/>
          <code className="text-red-600">❌ localStorage.setItem('sensitiveData', data) // محظور</code><br/>
          <code className="text-green-600">✅ const hashed = await bcrypt.hash(password, 10) // صحيح</code>
        </div>

        <h3 className="text-xl font-bold text-slate-800 mb-3">4.4. أمان قاعدة البيانات</h3>
        <p className="mb-4">
          قاعدة البيانات محمية بـ:
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 mr-4">
          <li><strong>جدران الحماية (Firewalls):</strong> منع الوصول غير المصرح به</li>
          <li><strong>الوصول المقيد:</strong> فقط الخوادم المصرح بها يمكنها الوصول</li>
          <li><strong>النسخ الاحتياطي المشفر:</strong> جميع النسخ الاحتياطية مشفرة</li>
          <li><strong>مراقبة الوصول:</strong> تسجيل جميع محاولات الوصول</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">5. موقع الخوادم والتخزين</h2>
        <div className="bg-green-50 border-r-4 border-green-400 p-4 mb-4">
          <p className="font-bold text-green-900 mb-2">🇹🇳 التزامنا بالسيادة الرقمية:</p>
          <p className="text-green-800">
            جميع خوادمنا ومراكز البيانات موجودة داخل الأراضي التونسية. لا يتم نقل أو تخزين بياناتك 
            خارج تونس إلا بموافقتك الصريحة أو بموجب القانون.
          </p>
        </div>
        <p className="mb-4">
          <strong>5.1.</strong> الخوادم الرئيسية: تونس - مركز بيانات معتمد
        </p>
        <p className="mb-4">
          <strong>5.2.</strong> قاعدة البيانات: PostgreSQL على خوادم محلية في تونس
        </p>
        <p className="mb-4">
          <strong>5.3.</strong> النسخ الاحتياطي: يتم تخزين النسخ الاحتياطية في موقع ثانوي داخل تونس
        </p>
        <p className="mb-4">
          <strong>5.4.</strong> في حالة الحاجة لنقل بيانات خارج تونس (مثل استخدام خدمات سحابية دولية)، 
          سنحصل على موافقتك الصريحة ونضمن أن هذه الخدمات ملتزمة بمعايير حماية البيانات الدولية.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">6. مشاركة البيانات مع أطراف ثالثة</h2>
        <p className="mb-4">
          <strong>6.1.</strong> نحن <strong>لا نبيع</strong> بياناتك الشخصية لأي طرف ثالث.
        </p>
        <p className="mb-4">
          <strong>6.2.</strong> قد نشارك بياناتك فقط في الحالات التالية:
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 mr-4">
          <li><strong>مقدمي الخدمات:</strong> مع شركات موثوقة تساعدنا في تشغيل المنصة (مثل استضافة الخوادم، 
            معالجة المدفوعات) - وهؤلاء ملزمون بمعايير حماية البيانات نفسها</li>
          <li><strong>الامتثال القانوني:</strong> عندما يتطلب القانون ذلك (مثل أمر قضائي)</li>
          <li><strong>حماية الحقوق:</strong> لحماية حقوقنا أو حقوق المستخدمين الآخرين</li>
          <li><strong>بموافقتك:</strong> عندما تمنحنا موافقة صريحة</li>
        </ul>
        <p className="mb-4">
          <strong>6.3.</strong> نحن <strong>لا نستخدم</strong> بياناتك أو ملفاتك لتدريب نماذج الذكاء الاصطناعي 
          العامة أو مشاركتها مع شركات التكنولوجيا لأغراض التدريب.
        </p>
        <p className="mb-4">
          <strong>6.4.</strong> جميع مقدمي الخدمات من الأطراف الثالثة ملزمون بمعايير حماية البيانات الصارمة 
          ويمنعون من استخدام بياناتك لأي غرض آخر غير المتفق عليه.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">7. حقوقك في بياناتك</h2>
        <p className="mb-4">
          بموجب قانون حماية البيانات التونسي، لديك الحقوق التالية:
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 mr-4">
          <li><strong>حق الوصول:</strong> يمكنك طلب نسخة من جميع بياناتك الشخصية</li>
          <li><strong>حق التصحيح:</strong> يمكنك تصحيح أي بيانات غير دقيقة</li>
          <li><strong>حق الحذف:</strong> يمكنك طلب حذف بياناتك (مع مراعاة الالتزامات القانونية)</li>
          <li><strong>حق الاعتراض:</strong> يمكنك الاعتراض على معالجة بياناتك</li>
          <li><strong>حق التنقل:</strong> يمكنك طلب نقل بياناتك إلى خدمة أخرى</li>
          <li><strong>حق سحب الموافقة:</strong> يمكنك سحب موافقتك على معالجة بياناتك في أي وقت</li>
        </ul>
        <p className="mb-4">
          لممارسة أي من هذه الحقوق، يرجى التواصل معنا على: <strong>contact@novalabs.tn</strong>
        </p>
        <p className="mb-4">
          سنرد على طلبك خلال 30 يوماً من تاريخ استلامه.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">8. ملفات تعريف الارتباط (Cookies)</h2>
        <p className="mb-4">
          <strong>8.1.</strong> نستخدم ملفات تعريف الارتباط لتحسين تجربة استخدامك للمنصة:
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 mr-4">
          <li><strong>ملفات أساسية:</strong> ضرورية لعمل المنصة (مثل حفظ جلسة تسجيل الدخول)</li>
          <li><strong>ملفات وظيفية:</strong> لحفظ تفضيلاتك (مثل اللغة، الوضع الليلي)</li>
          <li><strong>ملفات تحليلية:</strong> لفهم كيفية استخدام المنصة (مجمعة وغير قابلة للتعريف)</li>
        </ul>
        <p className="mb-4">
          <strong>8.2.</strong> يمكنك إدارة ملفات تعريف الارتباط من إعدادات المتصفح، لكن قد يؤثر ذلك على 
          وظائف المنصة.
        </p>
        <p className="mb-4">
          <strong>8.3.</strong> لا نستخدم ملفات تعريف الارتباط للتتبع عبر المواقع أو الإعلانات المستهدفة.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">9. مدة الاحتفاظ بالبيانات</h2>
        <p className="mb-4">
          <strong>9.1.</strong> نحتفظ ببياناتك الشخصية طالما كان حسابك نشطاً أو حسب الحاجة لتقديم الخدمات.
        </p>
        <p className="mb-4">
          <strong>9.2.</strong> عند إلغاء حسابك، سنحذف بياناتك الشخصية خلال 30 يوماً، إلا إذا كان القانون 
          يتطلب الاحتفاظ بها لفترة أطول.
        </p>
        <p className="mb-4">
          <strong>9.3.</strong> قد نحتفظ ببعض البيانات المجمعة وغير القابلة للتعريف لأغراض إحصائية وتحليلية.
        </p>
        <p className="mb-4">
          <strong>9.4.</strong> ملفات القضايا والوثائق: يتم حذفها تلقائياً بعد 90 يوماً من إلغاء الحساب، 
          ما لم تطلب حذفها فوراً.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">10. أمان البيانات</h2>
        <p className="mb-4">
          <strong>10.1.</strong> نستخدم تدابير أمنية تقنية وإدارية صارمة لحماية بياناتك:
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 mr-4">
          <li>تشفير جميع البيانات الحساسة</li>
          <li>جدران الحماية وأنظمة كشف التسلل</li>
          <li>الوصول المقيد للبيانات (مبدأ أقل صلاحية)</li>
          <li>مراقبة مستمرة للأنشطة المشبوهة</li>
          <li>تدريب موظفينا على أمان البيانات</li>
          <li>اختبارات أمنية منتظمة</li>
        </ul>
        <p className="mb-4">
          <strong>10.2.</strong> ومع ذلك، لا يمكن ضمان الأمان المطلق 100%. أنت توافق على أن استخدام 
          الإنترنت والمنصة ينطوي على مخاطر أمنية.
        </p>
        <p className="mb-4">
          <strong>10.3.</strong> في حالة حدوث خرق أمني، سنقوم بإشعارك والسلطات المختصة خلال 72 ساعة 
          وفقاً للقانون.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">11. خصوصية الأطفال</h2>
        <p className="mb-4">
          المنصة مخصصة للمحامين المحترفين فقط. لا نجمع عمداً بيانات من أشخاص دون سن 18 عاماً. إذا 
          اكتشفنا أننا جمعنا بيانات من قاصر، سنحذفها فوراً.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">12. التغييرات على سياسة الخصوصية</h2>
        <p className="mb-4">
          قد نحدث هذه السياسة من وقت لآخر. سيتم إشعارك بأي تغييرات جوهرية عبر البريد الإلكتروني أو 
          إشعار على المنصة. استمرارك في استخدام المنصة بعد التغييرات يعتبر موافقة منك.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">13. التواصل معنا</h2>
        <p className="mb-4">
          إذا كان لديك أي أسئلة أو مخاوف حول سياسة الخصوصية أو معالجة بياناتك، يرجى التواصل معنا:
        </p>
        <ul className="list-none space-y-2 mb-4">
          <li><strong>البريد الإلكتروني:</strong> contact@novalabs.tn</li>
          <li><strong>الهاتف:</strong> +216 24 73 46 47</li>
          <li><strong>العنوان:</strong> 2 Rue Lac Loch Ness, Tunis 1053, Tunis 1021</li>
        </ul>
        <p className="mb-4">
          لديك أيضاً الحق في تقديم شكوى إلى الهيئة الوطنية لحماية البيانات الشخصية في تونس إذا كنت 
          تعتقد أن معالجة بياناتك تنتهك القانون.
        </p>
      </section>
    </div>
  </LegalLayout>
);
