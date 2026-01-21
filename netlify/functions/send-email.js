const RESEND_API_URL = 'https://api.resend.com/emails';
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;
const MAX_EMAILS_PER_WINDOW = 3;

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'error', message: 'Method not allowed' }),
    };
  }


  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const TO_EMAIL = process.env.TO_EMAIL;
  const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
  const SITE_URL = process.env.URL || '';

  if (!RESEND_API_KEY || !TO_EMAIL) {
    console.error('Missing required environment variables: RESEND_API_KEY or TO_EMAIL');
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'error', message: 'Server configuration error' }),
    };
  }

  const origin = event.headers.origin || event.headers.Origin || '';
  const referer = event.headers.referer || event.headers.Referer || '';
  const allowedOrigins = [SITE_URL, 'http://localhost:8888', 'http://localhost:3000', 'http://127.0.0.1:8888'];
  
  const isAllowedOrigin = allowedOrigins.some(allowed => 
    origin.startsWith(allowed) || referer.startsWith(allowed)
  ) || SITE_URL === '';

  if (!isAllowedOrigin && process.env.NODE_ENV === 'production') {
    console.warn('Blocked request from unauthorized origin:', origin);
    return {
      statusCode: 403,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'error', message: 'Forbidden' }),
    };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch (e) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'error', message: 'Invalid request body' }),
    };
  }

  const { name, email, subject, message, _gotcha, _timestamp, recaptchaToken } = data;

  if (_gotcha && _gotcha.trim() !== '') {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'success', message: 'Message sent successfully!' }),
    };
  }

  const submissionTime = Date.now();
  const formLoadTime = parseInt(_timestamp, 10) || submissionTime;
  const timeDiff = (submissionTime - formLoadTime) / 1000;

  if (timeDiff < 3) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'error', message: 'Please take your time filling out the form.' }),
    };
  }

  if (RECAPTCHA_SECRET_KEY && recaptchaToken) {
    try {
      const recaptchaResponse = await fetch(RECAPTCHA_VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`,
      });
      
      const recaptchaData = await recaptchaResponse.json();
      
      if (!recaptchaData.success || recaptchaData.score < 0.5) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'error', message: 'Security verification failed. Please try again.' }),
        };
      }
    } catch (error) {
      console.error('reCAPTCHA verification error:', error);
    }
  }

  if (!name || !email || !subject || !message) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'error', message: 'All fields are required.' }),
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'error', message: 'Invalid email address.' }),
    };
  }

  const emailLower = email.toLowerCase();
  const now = Date.now();
  const userRateData = rateLimitMap.get(emailLower) || { count: 0, firstRequest: now };
  
  if (now - userRateData.firstRequest > RATE_LIMIT_WINDOW) {
    userRateData.count = 0;
    userRateData.firstRequest = now;
  }
  
  if (userRateData.count >= MAX_EMAILS_PER_WINDOW) {
    return {
      statusCode: 429,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'error', message: 'Too many messages. Please try again later.' }),
    };
  }
  
  userRateData.count++;
  rateLimitMap.set(emailLower, userRateData);

  const sanitize = (str) => {
    return str
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .replace(/data:/gi, '')
      .trim()
      .substring(0, 1000);
  };
  
  const cleanName = sanitize(name);
  const cleanSubject = sanitize(subject);
  const cleanMessage = sanitize(message).substring(0, 5000);
  
  const escapeHtml = (str) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const clientIP = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
  const timestamp = new Date().toISOString();

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Portfolio Contact <onboarding@resend.dev>',
        to: [TO_EMAIL],
        reply_to: email,
        subject: `🌐 Portfolio Contact: ${cleanSubject}`,
        text: `
════════════════════════════════════════════════════════════
                    PORTFOLIO CONTACT FORM
════════════════════════════════════════════════════════════

📧 NEW MESSAGE RECEIVED

From: ${cleanName}
Email: ${email}
Subject: ${cleanSubject}

────────────────────────────────────────────────────────────
MESSAGE:
────────────────────────────────────────────────────────────

${cleanMessage}

────────────────────────────────────────────────────────────
METADATA:
────────────────────────────────────────────────────────────
Timestamp: ${timestamp}
IP Address: ${clientIP}
Source: francis-kamau.netlify.app

════════════════════════════════════════════════════════════
        `,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <tr>
      <td style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">🌐 Portfolio Contact</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">New message from your portfolio website</p>
      </td>
    </tr>
    
    <tr>
      <td style="padding: 30px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px; background-color: #f8fafc; border-radius: 8px; padding: 20px;">
          <tr>
            <td>
              <p style="margin: 0 0 10px 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">From</p>
              <p style="margin: 0 0 5px 0; color: #1e293b; font-size: 18px; font-weight: 600;">${escapeHtml(cleanName)}</p>
              <p style="margin: 0; color: #3b82f6; font-size: 14px;">
                <a href="mailto:${escapeHtml(email)}" style="color: #3b82f6; text-decoration: none;">${escapeHtml(email)}</a>
              </p>
            </td>
          </tr>
        </table>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
          <tr>
            <td>
              <p style="margin: 0 0 8px 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Subject</p>
              <p style="margin: 0; color: #1e293b; font-size: 16px; font-weight: 500;">${escapeHtml(cleanSubject)}</p>
            </td>
          </tr>
        </table>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
          <tr>
            <td>
              <p style="margin: 0 0 12px 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Message</p>
              <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">${escapeHtml(cleanMessage)}</p>
              </div>
            </td>
          </tr>
        </table>
        
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="text-align: center;">
              <a href="mailto:${escapeHtml(email)}?subject=Re: ${encodeURIComponent(cleanSubject)}" 
                 style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                Reply to ${escapeHtml(cleanName)}
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    
    <tr>
      <td style="background-color: #f8fafc; padding: 20px; border-top: 1px solid #e2e8f0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="color: #94a3b8; font-size: 11px; text-align: center;">
              <p style="margin: 0 0 5px 0;">📍 Sent from <strong>francis-kamau.netlify.app</strong></p>
              <p style="margin: 0 0 5px 0;">🕐 ${timestamp}</p>
              <p style="margin: 0;">🌐 IP: ${clientIP}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Resend API error:', errorData);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'error', message: 'Failed to send message. Please try again later.' }),
      };
    }

    console.log(`Email sent successfully from ${email} at ${timestamp}`);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'success', message: 'Message sent successfully! I\'ll get back to you soon.' }),
    };

  } catch (error) {
    console.error('Error sending email:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'error', message: 'Failed to send message. Please try again later.' }),
    };
  }
};
