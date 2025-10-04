/**
 * CASL/CAN-SPAM Compliant Email Templates
 * 
 * All templates include:
 * - Sender identification (name, address, phone)
 * - One-click unsubscribe link
 * - Consent reference and timestamp
 * - Clear subject lines
 * - Physical mailing address (CAN-SPAM §5(a)(5))
 */

export interface EmailContext {
  leadId: string;
  consentId: string;
  leadName: string;
  leadEmail: string;
  dealershipName: string;
  dealershipAddress: string;
  dealershipCity: string;
  dealershipProvince: string;
  dealershipPostalCode: string;
  dealershipPhone: string;
  dealershipEmail: string;
  dealershipLicense: string;
  consentGrantedAt: string;
  unsubscribeUrl: string;
  preferencesUrl: string;
}

export function generateCompliantFooter(ctx: EmailContext): string {
  return `
  <!-- CASL/CAN-SPAM Compliant Footer -->
  <footer style="background: #f5f5f5; padding: 20px; border-top: 2px solid #ddd; font-size: 12px; color: #666; margin-top: 40px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td>
          <p style="margin: 0 0 10px 0; font-weight: bold; color: #333;">
            ${ctx.dealershipName}
          </p>
          <p style="margin: 0 0 10px 0; line-height: 1.6;">
            ${ctx.dealershipAddress}<br>
            ${ctx.dealershipCity}, ${ctx.dealershipProvince} ${ctx.dealershipPostalCode}<br>
            Phone: ${ctx.dealershipPhone}<br>
            Email: <a href="mailto:${ctx.dealershipEmail}" style="color: #0066cc;">${ctx.dealershipEmail}</a><br>
            Dealer License: ${ctx.dealershipLicense}
          </p>
          
          <p style="margin: 15px 0; padding: 10px 0; border-top: 1px solid #ddd; border-bottom: 1px solid #ddd;">
            <a href="${ctx.unsubscribeUrl}" 
               style="color: #0066cc; text-decoration: underline; font-weight: bold;">
              Unsubscribe from all communications
            </a> | 
            <a href="${ctx.preferencesUrl}" 
               style="color: #0066cc; text-decoration: underline;">
              Update your preferences
            </a>
          </p>
          
          <p style="margin: 10px 0 0 0; font-size: 10px; color: #999; line-height: 1.5;">
            You're receiving this email because you opted in to receive promotional offers 
            on ${new Date(ctx.consentGrantedAt).toLocaleDateString('en-CA', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'America/Toronto'
            })} EST.<br>
            Consent ID: ${ctx.consentId}<br>
            Lead ID: ${ctx.leadId}
          </p>
          
          <p style="margin: 5px 0 0 0; font-size: 10px; color: #999;">
            This message complies with Canada's Anti-Spam Legislation (CASL) and the U.S. CAN-SPAM Act.
          </p>
        </td>
      </tr>
    </table>
  </footer>`;
}

export function welcomeEmail(ctx: EmailContext): { subject: string; html: string } {
  return {
    subject: `Welcome to ${ctx.dealershipName}!`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  
  <div style="padding: 40px 20px;">
    <h1 style="color: #111827; font-size: 28px; margin-bottom: 20px;">
      Welcome, ${ctx.leadName}!
    </h1>
    
    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
      Thank you for your interest in ${ctx.dealershipName}. We're excited to help you find your perfect vehicle.
    </p>
    
    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
      As part of your inquiry, you'll receive updates about:
    </p>
    
    <ul style="color: #374151; font-size: 16px; line-height: 1.8; margin-bottom: 24px;">
      <li>New vehicle arrivals that match your interests</li>
      <li>Exclusive promotions and financing offers</li>
      <li>Service reminders and maintenance tips</li>
    </ul>
    
    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
      You can manage your communication preferences or unsubscribe at any time using the links below.
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="tel:${ctx.dealershipPhone}" 
         style="display: inline-block; background: #667eea; color: white; padding: 14px 32px; 
                text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
        Call Us Now
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 24px;">
      Best regards,<br>
      <strong>The ${ctx.dealershipName} Team</strong>
    </p>
  </div>
  
  ${generateCompliantFooter(ctx)}
  
</body>
</html>`
  };
}

export function quoteFollowUpEmail(ctx: EmailContext, quoteDetails: {
  vehicleName: string;
  vehicleYear: number;
  monthlyPayment: number;
  totalPrice: number;
  validUntil: string;
}): { subject: string; html: string } {
  return {
    subject: `Your Quote for ${quoteDetails.vehicleYear} ${quoteDetails.vehicleName}`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Vehicle Quote</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  
  <div style="padding: 40px 20px;">
    <h1 style="color: #111827; font-size: 28px; margin-bottom: 20px;">
      Your Personalized Quote
    </h1>
    
    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
      Hi ${ctx.leadName},
    </p>
    
    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      Here's the quote we prepared for the <strong>${quoteDetails.vehicleYear} ${quoteDetails.vehicleName}</strong>:
    </p>
    
    <table style="width: 100%; background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Monthly Payment:</td>
        <td style="padding: 8px 0; color: #111827; font-size: 18px; font-weight: bold; text-align: right;">
          $${quoteDetails.monthlyPayment.toFixed(2)}/mo
        </td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Total Price:</td>
        <td style="padding: 8px 0; color: #111827; font-size: 16px; font-weight: bold; text-align: right;">
          $${quoteDetails.totalPrice.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
        </td>
      </tr>
      <tr>
        <td colspan="2" style="padding: 12px 0 0 0; color: #ef4444; font-size: 12px; text-align: center;">
          Quote valid until ${new Date(quoteDetails.validUntil).toLocaleDateString('en-CA')}
        </td>
      </tr>
    </table>
    
    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      Ready to move forward? Book a test drive or contact us with any questions.
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="tel:${ctx.dealershipPhone}" 
         style="display: inline-block; background: #667eea; color: white; padding: 14px 32px; 
                text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; margin: 0 8px;">
        Call to Book Test Drive
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 24px;">
      Best regards,<br>
      <strong>${ctx.dealershipName}</strong>
    </p>
  </div>
  
  ${generateCompliantFooter(ctx)}
  
</body>
</html>`
  };
}

export function promotionalEmail(ctx: EmailContext, promo: {
  title: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `${promo.title} - ${ctx.dealershipName}`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${promo.title}</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  
  <div style="padding: 40px 20px;">
    <h1 style="color: #111827; font-size: 28px; margin-bottom: 20px;">
      ${promo.title}
    </h1>
    
    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
      Hi ${ctx.leadName},
    </p>
    
    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      ${promo.description}
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${promo.ctaUrl}" 
         style="display: inline-block; background: #667eea; color: white; padding: 14px 32px; 
                text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
        ${promo.ctaText}
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 24px; text-align: center;">
      Offer ends soon. Contact us today!
    </p>
  </div>
  
  ${generateCompliantFooter(ctx)}
  
</body>
</html>`
  };
}

/**
 * Generate SMS-compliant message
 * TCPA requirements: Sender ID, opt-out, disclosure
 */
export function generateSMSMessage(
  dealershipName: string,
  message: string
): string {
  // Truncate message if too long (160 chars standard, minus overhead)
  const maxLength = 120;
  const truncated = message.length > maxLength 
    ? message.substring(0, maxLength) + '...' 
    : message;
  
  return `${dealershipName}: ${truncated} Reply STOP to end, HELP for info. Msg&Data rates may apply.`;
}

/**
 * Generate unsubscribe URL with token
 */
export function generateUnsubscribeUrl(
  baseUrl: string,
  consentId: string,
  leadId: string,
  channel: 'email' | 'sms' | 'phone' | 'all' = 'all'
): string {
  return `${baseUrl}/unsubscribe?token=${consentId}&lead=${leadId}&channel=${channel}`;
}

/**
 * Generate preference center URL
 */
export function generatePreferencesUrl(
  baseUrl: string,
  leadId: string
): string {
  return `${baseUrl}/preferences?lead=${leadId}`;
}
