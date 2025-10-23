export function generateRsvpEmailTemplate(
  recipientEmail: string,
  url: string
): string {
  // Replace undefined with localhost because of a current bug in embedded world
  let callbackUrl = url.includes('://undefined/')
    ? url.replace('://undefined/', '://localhost:3000/')
    : url;

  // Replace https with http for localhost URLs
  if (callbackUrl.includes('localhost')) {
    callbackUrl = callbackUrl.replace('https://', 'http://');
  }

  const yesUrl = `${callbackUrl}?reply=yes&email=${encodeURIComponent(recipientEmail)}`;
  const noUrl = `${callbackUrl}?reply=no&email=${encodeURIComponent(recipientEmail)}`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
            background-color: #ffffff;
            color: #000000;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
          }
          .header {
            padding: 48px 24px 32px;
            text-align: center;
            border-bottom: 1px solid #eaeaea;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 500;
            color: #000000;
            letter-spacing: -0.02em;
          }
          .content {
            padding: 40px 24px;
          }
          .message {
            margin: 0 0 32px;
            font-size: 15px;
            line-height: 1.6;
            color: #666666;
            text-align: center;
          }
          .button-group {
            display: flex;
            gap: 12px;
            justify-content: center;
            margin: 32px 0;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            font-size: 14px;
            font-weight: 500;
            text-decoration: none;
            border-radius: 6px;
            transition: background-color 0.2s;
          }
          .button-yes {
            background-color: #f5f5f5;
            color: #000000;
            border: 1px solid #eaeaea;
          }
          .button-yes:hover {
            background-color: #e5e5e5;
          }
          .button-no {
            background-color: #f5f5f5;
            color: #000000;
            border: 1px solid #eaeaea;
          }
          .button-no:hover {
            background-color: #e5e5e5;
          }
          .footer {
            padding: 32px 24px;
            text-align: center;
            font-size: 12px;
            color: #999999;
            border-top: 1px solid #eaeaea;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>You're Invited to a Birthday Party!</h1>
          </div>
          <div class="content">
            <p class="message">
              We're planning a special birthday celebration and would love for you to be there!<br><br>
              Please let us know if you can make it by clicking one of the buttons below.
            </p>
            <div class="button-group">
              <a href="${yesUrl}" class="button button-yes">Yes, I'll be there!</a>
              <a href="${noUrl}" class="button button-no">Sorry, can't make it</a>
            </div>
          </div>
          <div class="footer">
            This invitation was sent via Vercel Workflow
          </div>
        </div>
      </body>
    </html>`;
}

export function generatePostcardEmailTemplate(
  title: string,
  text: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
            background-color: #ffffff;
            color: #000000;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
          }
          .header {
            padding: 48px 24px 32px;
            text-align: center;
            border-bottom: 1px solid #eaeaea;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 500;
            color: #000000;
            letter-spacing: -0.02em;
          }
          .content {
            padding: 40px 24px;
          }
          .postcard-wrapper {
            margin-bottom: 32px;
            overflow: hidden;
            border-radius: 4px;
            border: 1px solid #eaeaea;
          }
          .postcard-image {
            width: 100%;
            aspect-ratio: 4 / 3;
            object-fit: cover;
            display: block;
          }
          .postcard-text {
            margin: 32px 0;
            padding: 0;
            font-size: 15px;
            line-height: 1.6;
            color: #666666;
          }
          .cta-section {
            margin-top: 40px;
            padding-top: 32px;
            border-top: 1px solid #eaeaea;
            text-align: center;
          }
          .cta-text {
            margin: 0 0 16px;
            font-size: 15px;
            color: #666666;
          }
          .cta-url {
            margin-top: 0;
            font-size: 14px;
            font-weight: 500;
            word-break: break-all;
          }
          .cta-url a {
            color: #000000;
            text-decoration: underline;
          }
          .cta-url a:hover {
            color: #666666;
          }
          .footer {
            padding: 32px 24px;
            text-align: center;
            font-size: 12px;
            color: #999999;
            border-top: 1px solid #eaeaea;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${title}</h1>
          </div>
          <div class="content">
            <div class="postcard-wrapper">
              <img src="cid:postcard" alt="Birthday card" class="postcard-image" />
            </div>
            <div class="postcard-text">
              ${text}
            </div>
          </div>
        </div>
      </body>
    </html>`;
}
