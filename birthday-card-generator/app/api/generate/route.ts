import { NextResponse } from 'next/server';
import { FatalError } from 'workflow';
import { start } from 'workflow/api';
import { generateBirthdayCard } from '@/app/api/generate/generate-birthday-card';

export const POST = async (request: Request): Promise<NextResponse> => {
  try {
    const body = await request.json();
    const { prompt, recipientEmail, rsvpEmails, eventDate } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      );
    }

    // Start the workflow
    const result = await start(generateBirthdayCard, [
      prompt,
      recipientEmail,
      rsvpEmails,
      new Date(eventDate),
    ]);

    const values = await result.returnValue;

    return NextResponse.json(values);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const isFatal = error instanceof FatalError;

    return NextResponse.json(
      {
        error: message,
        fatal: isFatal,
      },
      { status: isFatal ? 400 : 500 }
    );
  }
};
