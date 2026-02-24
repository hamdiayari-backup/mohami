const { pool } = require('./db.cjs');

// Email templates (same as TypeScript version but in CommonJS)
const emailTemplates = {
  welcome: (userName) => ({
    subject: 'مرحباً بك في منصة المحامي - Welcome to Mouhami AI',
    html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>مرحباً بك</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Tajawal', Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #1e293b; margin: 0; font-size: 32px; font-weight: bold;">مرحباً ${userName}! 👋</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #334155; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
                مرحباً بك في <strong style="color: #f59e0b;">منصة المحامي</strong> - المنصة الأولى في تونس التي تستخدم الذكاء الاصطناعي لمساعدة المحامين.
              </p>
              <p style="color: #334155; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
                نحن سعداء بانضمامك إلينا! الآن يمكنك:
              </p>
              <ul style="color: #334155; font-size: 16px; line-height: 2; padding-right: 20px;">
                <li>استخراج الثغرات القانونية من المحاضر تلقائياً</li>
                <li>إدارة قضاياك ومتابعة الجلسات</li>
                <li>تحليل العقود والوثائق القانونية</li>
                <li>الوصول للمكتبة القانونية الشاملة</li>
              </ul>
              <div style="margin: 30px 0; text-align: center;">
                <a href="#" style="display: inline-block; background-color: #f59e0b; color: #1e293b; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">ابدأ الآن</a>
              </div>
              <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                إذا كان لديك أي استفسار، لا تتردد في التواصل معنا عبر مركز المساعدة في المنصة.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #1e293b; padding: 30px; text-align: center;">
              <p style="color: #94a3b8; font-size: 14px; margin: 0 0 10px 0;">منصة المحامي - Mouhami AI</p>
              <p style="color: #64748b; font-size: 12px; margin: 0;">صنع في تونس 🇹🇳 | جميع الحقوق محفوظة © 2025</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    text: `مرحباً ${userName}!\n\nمرحباً بك في منصة المحامي - المنصة الأولى في تونس التي تستخدم الذكاء الاصطناعي لمساعدة المحامين.\n\nنحن سعداء بانضمامك إلينا!`
  }),

  planUpgrade: (userName, planName) => ({
    subject: `تم ترقية باقاتك إلى ${planName} - Plan Upgraded`,
    html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Tajawal', Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">🎉 تم ترقية باقاتك!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #334155; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
                عزيزي/عزيزتي <strong>${userName}</strong>,
              </p>
              <p style="color: #334155; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
                نود إعلامك بأن باقاتك قد تم ترقيتها بنجاح إلى <strong style="color: #f59e0b;">${planName}</strong>.
              </p>
              <p style="color: #334155; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
                يمكنك الآن الاستفادة من جميع المميزات الجديدة المتاحة في باقاتك المحدثة.
              </p>
              <div style="margin: 30px 0; text-align: center;">
                <a href="#" style="display: inline-block; background-color: #f59e0b; color: #1e293b; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">استكشف المميزات</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #1e293b; padding: 30px; text-align: center;">
              <p style="color: #94a3b8; font-size: 14px; margin: 0;">منصة المحامي - Mouhami AI</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `
  }),

  caseCreated: (userName, caseTitle) => ({
    subject: `تم إنشاء قضية جديدة: ${caseTitle}`,
    html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Tajawal', Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">📁 قضية جديدة</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #334155; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
                عزيزي/عزيزتي <strong>${userName}</strong>,
              </p>
              <p style="color: #334155; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
                تم إنشاء قضية جديدة بنجاح: <strong style="color: #f59e0b;">${caseTitle}</strong>
              </p>
              <p style="color: #334155; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
                يمكنك الآن رفع الوثائق وبدء التحليل الذكي للقضية.
              </p>
              <div style="margin: 30px 0; text-align: center;">
                <a href="#" style="display: inline-block; background-color: #f59e0b; color: #1e293b; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">عرض القضية</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #1e293b; padding: 30px; text-align: center;">
              <p style="color: #94a3b8; font-size: 14px; margin: 0;">منصة المحامي - Mouhami AI</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `
  }),

  attendanceCreated: (userName, eventTitle, eventDate) => ({
    subject: `تم إنشاء موعد جديد: ${eventTitle}`,
    html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Tajawal', Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">📅 موعد جديد</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #334155; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
                عزيزي/عزيزتي <strong>${userName}</strong>,
              </p>
              <p style="color: #334155; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
                تم إنشاء موعد جديد في جدولك:
              </p>
              <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #1e293b; font-size: 18px; font-weight: bold; margin: 0 0 10px 0;">${eventTitle}</p>
                <p style="color: #64748b; font-size: 14px; margin: 0;">📅 ${new Date(eventDate).toLocaleDateString('ar-TN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div style="margin: 30px 0; text-align: center;">
                <a href="#" style="display: inline-block; background-color: #f59e0b; color: #1e293b; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">عرض الجدول</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #1e293b; padding: 30px; text-align: center;">
              <p style="color: #94a3b8; font-size: 14px; margin: 0;">منصة المحامي - Mouhami AI</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `
  }),

  attendanceReminder: (userName, eventTitle, eventDate, eventTime) => ({
    subject: `تذكير: موعد قادم خلال ساعة - ${eventTitle}`,
    html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Tajawal', Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border: 2px solid #f59e0b;">
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #1e293b; margin: 0; font-size: 32px; font-weight: bold;">⏰ تذكير بالموعد</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #334155; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
                عزيزي/عزيزتي <strong>${userName}</strong>,
              </p>
              <p style="color: #dc2626; font-size: 18px; font-weight: bold; margin: 0 0 20px 0; text-align: center;">
                ⚠️ لديك موعد خلال ساعة واحدة!
              </p>
              <div style="background-color: #fef3c7; border-right: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #1e293b; font-size: 20px; font-weight: bold; margin: 0 0 10px 0;">${eventTitle}</p>
                <p style="color: #64748b; font-size: 16px; margin: 5px 0;">
                  📅 ${new Date(eventDate).toLocaleDateString('ar-TN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                ${eventTime ? `<p style="color: #64748b; font-size: 16px; margin: 5px 0;">🕐 ${eventTime}</p>` : ''}
              </div>
              <p style="color: #334155; font-size: 16px; line-height: 1.8; margin: 20px 0;">
                يرجى التأكد من الاستعداد للموعد.
              </p>
              <div style="margin: 30px 0; text-align: center;">
                <a href="#" style="display: inline-block; background-color: #f59e0b; color: #1e293b; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">عرض التفاصيل</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #1e293b; padding: 30px; text-align: center;">
              <p style="color: #94a3b8; font-size: 14px; margin: 0;">منصة المحامي - Mouhami AI</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `
  })
};

const emailService = {
  sendEmail: async (options) => {
    try {
      // Store email in queue
      await pool.query(
        `INSERT INTO email_queue (id, to_email, subject, html_content, text_content, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          options.to,
          options.subject,
          options.html,
          options.text || options.html.replace(/<[^>]*>/g, ''),
          'pending',
          new Date().toISOString()
        ]
      );
      return true;
    } catch (error) {
      console.error('Error queuing email:', error);
      return false;
    }
  },

  sendWelcomeEmail: async (userEmail, userName) => {
    const template = emailTemplates.welcome(userName);
    return await emailService.sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  },

  sendPlanUpgradeEmail: async (userEmail, userName, planName) => {
    const template = emailTemplates.planUpgrade(userName, planName);
    return await emailService.sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html
    });
  },

  sendCaseCreatedEmail: async (userEmail, userName, caseTitle) => {
    const template = emailTemplates.caseCreated(userName, caseTitle);
    return await emailService.sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html
    });
  },

  sendAttendanceCreatedEmail: async (userEmail, userName, eventTitle, eventDate) => {
    const template = emailTemplates.attendanceCreated(userName, eventTitle, eventDate);
    return await emailService.sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html
    });
  },

  sendAttendanceReminderEmail: async (userEmail, userName, eventTitle, eventDate, eventTime) => {
    const template = emailTemplates.attendanceReminder(userName, eventTitle, eventDate, eventTime);
    return await emailService.sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html
    });
  },

  sendMarketingEmail: async (userEmail, userName, subject, htmlContent) => {
    return await emailService.sendEmail({
      to: userEmail,
      subject: subject,
      html: htmlContent
    });
  },

  sendBulkMarketingEmails: async (userIds, subject, htmlContent) => {
    const users = await pool.query('SELECT email, name FROM users WHERE id = ANY($1)', [userIds]);
    let success = 0;
    let failed = 0;

    for (const user of users.rows) {
      const sent = await emailService.sendMarketingEmail(user.email, user.name, subject, htmlContent);
      if (sent) success++;
      else failed++;
    }

    return { success, failed };
  }
};

module.exports = { emailService };
