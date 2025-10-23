import { Resend } from 'resend';
import { v4 as uuid } from 'uuid';
import { generateRsvpEmailTemplate } from '@/lib/template';

export const requestRsvp = async (email: string, url: string) => {
  'use step';

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    console.log(`[STEP] Sending RSVP email to: ${email}`);

    console.log(`[STEP] Webhook URL for ${email}: ${url}`);

    await resend.emails.send({
      from: 'Workflow DevKit Birthday Demo <birthday-card-generator@resend.pranay.gp>',
      to: email,
      subject: "You're Invited to a Birthday Party!",
      html: generateRsvpEmailTemplate(email, url),
      headers: {
        'X-Entity-Ref-ID': uuid(),
      },
    });

    console.log(`[STEP] RSVP email sent successfully to: ${email}`);
    return { email, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[STEP] Error sending RSVP emails:', message);
    throw error;
  }
};
