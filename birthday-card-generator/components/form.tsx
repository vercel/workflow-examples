'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ArrowUpIcon, CalendarIcon, Loader2Icon } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@/components/ui/input-group';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Textarea } from './ui/textarea';

const formSchema = z.object({
  prompt: z.string().min(1, {
    message: 'Prompt is required.',
  }),
  recipientEmail: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  eventDate: z.date().optional(),
  rsvpEmail1: z
    .string()
    .email({
      message: 'Please enter a valid email address.',
    })
    .optional()
    .or(z.literal('')),
  rsvpEmail2: z
    .string()
    .email({
      message: 'Please enter a valid email address.',
    })
    .optional()
    .or(z.literal('')),
  rsvpEmail3: z
    .string()
    .email({
      message: 'Please enter a valid email address.',
    })
    .optional()
    .or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

export const BirthdayCardForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    image: string;
    text: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema as never),
    defaultValues: {
      prompt: '',
      recipientEmail: '',
      rsvpEmail1: '',
      rsvpEmail2: '',
      rsvpEmail3: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      // Collect non-empty RSVP emails
      const rsvpEmails = [
        values.rsvpEmail1,
        values.rsvpEmail2,
        values.rsvpEmail3,
      ].filter((email) => email && email.trim().length > 0);

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: values.prompt,
          recipientEmail: values.recipientEmail,
          eventDate: values.eventDate?.toISOString(),
          rsvpEmails,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate birthday card');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasPrompt = form.watch('prompt').trim().length > 0;

  return (
    <div className="w-full space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="recipientEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recipient Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="recipient@example.com"
                    className="bg-background"
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="eventDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Birthday</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                        disabled={isSubmitting}
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto size-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="prompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Describe the birthday card you want to create
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="I want a beach image with a message that says 'Happy Birthday!' and something nice."
                    disabled={isSubmitting}
                    className="bg-background min-h-32"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="space-y-2">
            <FormLabel>RSVP Email</FormLabel>
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="rsvpEmail1"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="guest1@example.com"
                        className="bg-background"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rsvpEmail2"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="guest2@example.com"
                        className="bg-background"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rsvpEmail3"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="guest3@example.com"
                        className="bg-background"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={isSubmitting || !hasPrompt}
            className="w-full"
          >
            {isSubmitting ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <>Generate and send</>
            )}
          </Button>
        </form>
      </Form>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-900">
          <p className="font-medium text-sm">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <Dialog open={Boolean(result?.image && result?.text)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="sr-only">
              Generated Birthday Card
            </DialogTitle>
          </DialogHeader>
          <img
            alt="Generated birthday card"
            className="w-full rounded-md"
            src={result?.image}
          />
          <p className="text-sm">{result?.text}</p>
        </DialogContent>
      </Dialog>
    </div>
  );
};
