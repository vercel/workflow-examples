'use client';
import { useState } from 'react';
interface BookingApprovalProps {
  toolCallId: string;
  input?: {
    flightNumber: string;
    passengerName: string;
    price: number;
  };
  output?: string;
}
export function BookingApproval({
  toolCallId,
  input,
  output,
}: BookingApprovalProps) {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If we have output, the approval has been processed
  if (output) {
    try {
      const json = JSON.parse(output) as { output: { value: string } };
      return (
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">{json.output.value}</p>
        </div>
      );
    } catch (error) {
      return (
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            Error parsing approval result: {(error as Error).message}
          </p>
        </div>
      );
    }
  }

  const handleSubmit = async (approved: boolean) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/hooks/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolCallId, approved, comment }),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API error: ${response.status} - ${errorData || response.statusText}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit approval';
      setError(errorMessage);
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);
  };
  return (
    <div className="border rounded-lg p-4 space-y-4">
      {error && (
        <div className="border border-red-300 rounded bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      <div className="space-y-2">
        <p className="font-medium">Approve this booking?</p>
        <div className="text-sm text-muted-foreground">
          {input && (
            <>
              <div>Flight: {input.flightNumber}</div>
              <div>Passenger: {input.passengerName}</div>
              <div>Price: ${input.price}</div>
            </>
          )}
        </div>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add a comment (optional)..."
        className="w-full border rounded p-2 text-sm"
        rows={2}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={isSubmitting}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Approve'}
        </button>
        <button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={isSubmitting}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Reject'}
        </button>
      </div>
    </div>
  );
}
