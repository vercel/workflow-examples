import { Resend } from 'resend';
import { v4 as uuid } from 'uuid';
import { generateRsvpEmailTemplate } from '@/lib/template';

export const requestRsvp = async (
  email: string,
  url: string,
  cardImage: string,
  cardText: string
) => {
  'use step';

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    console.log(`[STEP] Sending RSVP email to: ${email}`);

    console.log(`[STEP] Webhook URL for ${email}: ${url}`);

    const base64Content = cardImage.split(',')[1];

    await resend.emails.send({
      from: 'Workflow SDK Birthday Demo <birthday-card-generator@resend.pranay.gp>',
      to: email,
      subject: "You're Invited to a Birthday Party!",
      html: generateRsvpEmailTemplate(email, url, cardText),
      attachments: [
        {
          filename: 'birthday-card-preview.png',
          content: Buffer.from(base64Content, 'base64'),
          contentId: 'postcard',
        },
      ],
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
