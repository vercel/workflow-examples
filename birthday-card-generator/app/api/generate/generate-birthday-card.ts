import { createWebhook, sleep } from 'workflow';
import { generateImage } from './generate-image';
import { generateMessage } from './generate-message';
import { generatePrompts } from './generate-prompts';
import { requestRsvp } from './request-rsvp';
import { sendRecipientEmail } from './send-recipient-email';

export const generateBirthdayCard = async (
  prompt: string,
  recipientEmail: string,
  rsvpEmails: string[],
  birthday?: Date
) => {
  'use workflow';

  const rsvpEmail = rsvpEmails[0];

  // @ts-expect-error obv this should be a Date
  birthday = '10 seconds'; // overwrite sleep to be 10 seconds so this demo doesn't take forever

  try {
    console.log(`[WORKFLOW] Starting birthday card generation for: ${prompt}`);

    // Step 1: Generate separate text and image prompts from user input
    console.log('[WORKFLOW] Step 1/5: Generating text and image prompts');
    const { textPrompt, imagePrompt } = await generatePrompts(prompt);
    console.log('[WORKFLOW] Step 1/5 complete. Prompts generated');

    // Step 2: Generate image using Gemini
    console.log('[WORKFLOW] Step 2/5: Generating image and text.');
    const [image, text] = await Promise.all([
      generateImage(imagePrompt),
      generateMessage(textPrompt),
    ]);
    console.log('[WORKFLOW] Step 2/5 complete. Image and text generated');

    // // Step 3: Send RSVP emails (optional)
    // console.log('[WORKFLOW] Step 3/5: Sending RSVP email');
    // const webhook = createWebhook();
    // await requestRsvp(rsvpEmail, webhook.url);
    //
    // const rsvpReplies: Array<{ email: string; reply: string }> = [];
    // const req = await webhook;
    // const url = new URL(req.url);
    // const reply = url.searchParams.get('reply') || 'no-response';
    // const email = url.searchParams.get('email') || 'unknown';
    // rsvpReplies.push({ email, reply });
    //
    // console.log(`[WORKFLOW] Step 3/5 complete. RSVP received: ${reply}`);

    // Step 3: Send RSVP emails (optional)
    console.log('[WORKFLOW] Step 3/5: Sending RSVP emails');
    const webhooks = rsvpEmails.map((_) => createWebhook());

    // Send RSVP emails with webhook URLs
    await Promise.all(
      rsvpEmails.map((friend, i) => requestRsvp(friend, webhooks[i].url))
    );

    // // Store webhook promises - they'll resolve when users click the RSVP buttons
    // // We don't await them here, so the workflow continues even if users don't respond
    // const rsvpReplies: Array<{ email: string; reply: string }> = [];

    console.log('[WORKFLOW] Step 3/5. RSVP emails sent');

    const rsvpReplies = await Promise.all(
      webhooks.map((webhook) => {
        return webhook.then((request) => {
          const url = new URL(request.url);
          const reply = url.searchParams.get('reply') || 'no-response';
          const email = url.searchParams.get('email') || 'unknown';
          return { email, reply };
        });
      })
    );
    console.log('[WORKFLOW] Step 3/5 complete. All RSVPs Received');

    // webhooks.forEach((webhook) => {
    //   webhook.then((request) => {
    //     const url = new URL(request.url);
    //     const reply = url.searchParams.get('reply') || 'no-response';
    //     const email = url.searchParams.get('email') || 'unknown';
    //     rsvpReplies.push({ email, reply });
    //   });
    // });

    // Step 4: Wait until event date is reached
    console.log('[WORKFLOW] Step 4/5: Waiting until event date is reached');
    await sleep(birthday!);
    console.log('[WORKFLOW] Step 4/5 complete. Event date reached');

    // Step 5: Send email to recipient
    console.log('[WORKFLOW] Step 5/5: Sending birthday card to recipient');
    await sendRecipientEmail({
      recipientEmail,
      cardImage: image,
      cardText: text,
      rsvpReplies,
    });
    console.log(
      '[WORKFLOW] Step 5/5 complete. Birthday card sent to recipient'
    );

    return { image, text };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    console.error(`[WORKFLOW] Error:`, message);

    throw error;
  }
};
