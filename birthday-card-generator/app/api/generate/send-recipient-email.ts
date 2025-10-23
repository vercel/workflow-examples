import { Resend } from 'resend';
import { generatePostcardEmailTemplate } from '@/lib/template';
import { v4 as uuid } from 'uuid';

type RsvpReply = {
  email: string;
  reply: string;
};

type RecipientEmailParams = {
  recipientEmail: string;
  cardImage: string;
  cardText: string;
  rsvpReplies: RsvpReply[];
};

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendRecipientEmail = async ({
  recipientEmail,
  cardImage,
  cardText,
  rsvpReplies,
}: RecipientEmailParams) => {
  'use step';

  try {
    console.log(`[STEP] Sending birthday card to recipient: ${recipientEmail}`);
    console.log(`[STEP] RSVP replies:`, rsvpReplies);

    // Format RSVP replies for display
    const rsvpSummary = rsvpReplies
      .map(({ email, reply }) => `${email}: ${reply}`)
      .join('<br>');

    // Convert data URI to base64 content for attachment
    // cardImage format: "data:image/png;base64,..."
    const base64Content = cardImage.split(',')[1];
    const mimeType = cardImage.match(/data:([^;]+);/)?.[1] || 'image/png';

    await resend.emails.send({
      from: 'Workflow DevKit Birthday Demo <birthday-card-generator@resend.pranay.gp>',
      to: recipientEmail,
      subject: 'Happy Birthday!',
      headers: {
        'X-Entity-Ref-ID': uuid(),
      },
      html: generatePostcardEmailTemplate(
        'Happy Birthday',
        `${cardText.replace(/\n/g, '<br>')}${rsvpSummary ? `<br><br><strong>RSVP Replies:</strong><br>${rsvpSummary}` : ''}`
      ),
      attachments: [
        {
          filename: 'birthday-card.png',
          content: Buffer.from(base64Content, 'base64'),
          contentId: 'postcard',
        },
      ],
    });

    console.log('[STEP] Birthday card email sent successfully');

    return {
      success: true,
      recipientEmail,
      sentAt: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[STEP] Error sending recipient email:', message);
    throw error;
  }
};
