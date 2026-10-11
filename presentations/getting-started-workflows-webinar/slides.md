---
theme: ./
title: Getting Started with Vercel Workflows
footerLogo: wordmark
footerTitle: true
layout: 1-title
variant: title
subtitle1Image: https://vercel.com/api/www/avatar/d86685cc0ac958594071ba9cf94e5c50a3551011
subtitle2Icon: code
subtitle3Icon: cake
subtitle4Icon: bot
subtitleSize: lg
---

::title::
# Getting Started with Vercel Workflows

::subtitle-1::
Pranay Prakash, Head of Workflows

::subtitle-2::
Long-running backends in plain TypeScript

::subtitle-3::
Demo-first walkthrough

::subtitle-4::
Streaming, agents, and GA

<!--
- Quick intro.
- This is a demo-first talk.
- I want to show one real app, then explain why the model works.
-->
---
layout: 2-statement
variant: large
---

::title::
# The code you run on day one can be the code you ship

::subtitle::
Workflow is about removing the whole “now productionize it with queues, workers, schedulers, and state machines” phase.

<!--
- This is the real thesis from the mock run.
- We are used to demo first, then productionizing later.
- Workflow is trying to collapse that gap.
-->
---
layout: 2-statement
variant: transition
transitionLabel: "Demo First"
---

::title::
Let's jump straight into the birthday card app

::subtitle::
Then we will break apart the code, the runtime model, and how that extends to agents.

<!--
- I want to go straight into the demo.
- Then I will come back and explain how it works.
-->
---
layout: 2-statement
variant: title-4
tagPosition: inline
---

::title::
# Birthday card generator

::s1-tag::
<Tag color="gray">Input</Tag>

::s1-title::
One request

::s1-body::
Describe the card, pick a birthday, add guests, and send.

::s2-tag::
<Tag color="gray">Parallel</Tag>

::s2-title::
Image + message

::s2-body::
Generate both pieces together, then stream progress to the UI.

::s3-tag::
<Tag color="gray">Human</Tag>

::s3-title::
RSVP signatures

::s3-body::
Guests click a webhook link to sign the card and resume the workflow.

::s4-tag::
<Tag color="gray">Time</Tag>

::s4-title::
Deliver later

::s4-body::
Sleep until the birthday, then send the final postcard.

<!--
- This app is playful, but the async shape is very real.
- One request, parallel work, human input, then a delayed send.
- That is enough to show the whole workflow model.
-->
---
layout: 4-mermaid
variant: title-image
chart: |
  flowchart LR
    A["User submits form"] --> B["POST /api/generate"]
    B --> C["start(generateBirthdayCard)"]
    C --> D["generate prompts"]
    D --> E["generate image"]
    D --> F["generate message"]
    C --> G["send RSVP emails"]
    G --> H["wait for webhook clicks"]
    H --> I["sleep until birthday"]
    I --> J["send final postcard"]
    classDef accent fill:#111111,stroke:#666666,color:#ffffff;
    class C,E,F,G,H,I,J accent;
---

::title::
# One workflow, multiple async patterns

<!--
- One request triggers the entire flow.
- We do immediate work, then wait on people, then wait on time.
- This is why the demo is useful: it covers the main primitives in one story.
-->
---
layout: 2-statement
variant: cols-4
tagPosition: above
---

::title::
# What to watch during the live demo

::s1-tag::
<Tag color="gray">1</Tag>

::s1-title::
Live progress

::s1-body::
The UI updates as the workflow runs, before the final result is done.

::s2-tag::
<Tag color="gray">2</Tag>

::s2-title::
Parallel steps

::s2-body::
Image and message generation happen at the same time.

::s3-tag::
<Tag color="gray">3</Tag>

::s3-title::
Suspension

::s3-body::
The workflow actually stops running while it waits for RSVP clicks.

::s4-tag::
<Tag color="gray">4</Tag>

::s4-title::
Resumption

::s4-body::
The workflow wakes back up exactly where it left off.

<!--
- This is the checklist to anchor the demo.
- Especially call out suspend/resume and live progress.
-->
---
layout: 2-statement
variant: transition
transitionLabel: "After The Demo"
---

::title::
Now let's break apart what actually happened

::subtitle::
The interesting part is how little infrastructure code is needed to model a multi-step, multi-day process.

<!--
- After the demo, move right into the code.
- The key message is how little extra plumbing there is.
-->
---
layout: 10-code
variant: left-2
filename: app/api/generate/generate-birthday-card.ts
codeSize: xs
---

::code::
```ts
export const generateBirthdayCard = async (...) => {
  'use workflow';

  const { textPrompt, imagePrompt } = await generatePrompts(prompt);

  const [image, text] = await Promise.all([
    generateImage(imagePrompt),
    generateMessage(textPrompt),
  ]);

  const webhooks = rsvpEmails.map(() => createWebhook());
  await Promise.all(rsvpEmails.map((email, i) =>
    requestRsvp(email, webhooks[i].url, image, text)
  ));

  const rsvpReplies = await Promise.all(webhooks);
  await sleep(birthday!);
  await sendRecipientEmail({ recipientEmail, cardImage: image, cardText: text, rsvpReplies });
};
```

::s1-title::
This reads like product logic

::s1-body::
It is top-to-bottom business logic, not a map of workers, queues, and schedulers.

::s2-title::
This is the main abstraction

::s2-body::
A workflow is just long-running code with explicit async boundaries.

<!--
- This is the most important code slide.
- It matches how I would whiteboard the feature.
- That is the real product value.
-->
---
layout: 10-code
variant: right-list
filename: app/api/generate/route.ts + app/api/generate/[runId]/stream/route.ts
codeSize: xs
---

::code::
```ts
const run = await start(generateBirthdayCard, [...]);

return new Response(run.readable, {
  headers: {
    'x-workflow-run-id': run.runId,
  },
});

const stream = run.getReadable<string>({ startIndex });
return new Response(stream);
```

::title::
# Two routes, not an orchestration system

::item-1::
One route starts the workflow

::item-2::
One route resumes the stream

::item-3::
No webhook correlation database

::item-4::
No worker app to coordinate separately

<!--
- This is something I stressed in the mock.
- One start route.
- One stream resume route.
- Not a whole separate backend architecture.
-->
---
layout: 2-statement
variant: cols-3
tagPosition: inline
---

::title::
# Hooks and webhooks are the most powerful primitive here

::s1-tag::
<Tag color="gray">Webhook</Tag>

::s1-title::
One-time public URL

::s1-body::
Perfect for email links, approvals, signatures, and “click to continue” flows.

::s2-tag::
<Tag color="gray">Hook</Tag>

::s2-title::
Resume from your own code

::s2-body::
Use a token to resume from Slack, GitHub, internal events, or another route.

::s3-tag::
<Tag color="gray">Pattern</Tag>

::s3-title::
Event bus without extra state

::s3-body::
One workflow can naturally map to one Slack thread, one PR, one task, or one onboarding flow.

<!--
- In the live walkthrough, hooks/webhooks were a much bigger part of the story.
- Emphasize that this is not just the birthday demo.
- This is how we model PR comments, Slack threads, and other event-driven flows.
-->
---
layout: 2-statement
variant: cols-2
tagPosition: inline
---

::title::
# Sleep is more than a timer

::s1-tag::
<Tag color="gray">Delay</Tag>

::s1-title::
Wait for days or weeks

::s1-body::
The workflow suspends fully and resumes later. No server is sitting there “waiting.”

::s2-tag::
<Tag color="gray">Timeout</Tag>

::s2-title::
Race hooks vs sleep

::s2-body::
“Wait for a webhook, but only for 24 hours” becomes a simple pattern instead of custom infrastructure.

<!--
- Talk about sleep as a real long-running primitive.
- Also land the timeout pattern because that felt useful in the mock.
-->
---
layout: 2-statement
variant: cols-3
tagPosition: inline
---

::title::
# What `use workflow` and `use step` are actually doing

::s1-tag::
<Tag color="gray">Workflow</Tag>

::s1-title::
Deterministic replay

::s1-body::
The workflow function replays quickly using the event log instead of redoing side effects.

::s2-tag::
<Tag color="gray">Step</Tag>

::s2-title::
Full Node.js boundary

::s2-body::
Steps run the real work, serialize inputs and outputs, and become retryable execution units.

::s3-tag::
<Tag color="gray">Result</Tag>

::s3-title::
Code stays simple

::s3-body::
You get durability without turning your code into a state machine DSL.

<!--
- This is where I explain the runtime model.
- Workflow replays, steps do the work.
- Event log is what makes suspend/resume possible.
-->
---
layout: 4-mermaid
variant: left-list
chart: |
  flowchart TD
    A["Workflow starts"] --> B["Call step"]
    B --> C["Step runs"]
    C --> D["Inputs + outputs logged"]
    D --> E["Workflow replays"]
    E --> F["Resume from event log"]
    F --> G["Wait on hook / sleep"]
    G --> H["Replay and continue"]
    classDef accent fill:#111111,stroke:#666666,color:#ffffff;
    class B,C,D,E,F,G,H accent;
---

::title::
# The event log powers both durability and observability

::item-1::
Every step has inputs and outputs

::item-2::
Parallel steps show up naturally

::item-3::
Replay and recovery come from the same system

::item-4::
You get the audit trail without building it yourself

<!--
- This is a key point from the walkthrough.
- Observability is not bolted on.
- It comes from the same event log that powers replay.
-->
---
layout: 2-statement
variant: cols-3
tagPosition: inline
---

::title::
# Streaming is durable too

::s1-tag::
<Tag color="gray">UI</Tag>

::s1-title::
Live progress

::s1-body::
Steps write progress to a workflow stream so the client sees updates before the run finishes.

::s2-tag::
<Tag color="gray">Recovery</Tag>

::s2-title::
Resume from chunk index

::s2-body::
If the page reloads or the connection drops, the client can reconnect and continue from where it left off.

::s3-tag::
<Tag color="gray">Scale</Tag>

::s3-title::
Same primitive for agents

::s3-body::
Simple apps send progress JSON; agents can stream every token, tool call, and result.

<!--
- This is one of the biggest changes from the old deck.
- Don't just say “streaming exists.”
- Say “the stream is durable and resumable.”
-->
---
layout: 10-code
variant: left-2
filename: flight-booking-app/workflows/chat/index.ts
codeSize: xs
---

::code::
```ts
export async function chat(initialMessages: UIMessage[]) {
  'use workflow';

  const writable = getWritable<UIMessageChunk>();

  const agent = new DurableAgent({
    model: 'bedrock/claude-haiku-4-5-20251001-v1',
    system: FLIGHT_ASSISTANT_PROMPT,
    tools: flightBookingTools,
  });

  await agent.stream({
    messages,
    writable,
    preventClose: true,
  });
}
```

::s1-title::
An agent is basically just a workflow

::s1-body::
LLM calls, tool calls, retries, and long-running state all fit the same model.

::s2-title::
Why DurableAgent matters

::s2-body::
It gives agent builders a native workflow abstraction instead of a fragile loop around `streamText`.

<!--
- This matches the way I explained agents in the mock.
- Don't treat agents as separate.
- They are just a natural long-running workflow.
-->
---
layout: 2-statement
variant: cols-4
tagPosition: above
---

::title::
# Getting started is intentionally small

::s1-tag::
<Tag color="gray">Setup</Tag>

::s1-title::
Wrap the framework

::s1-body::
In Next.js, the setup is basically `withWorkflow(nextConfig)`.

::s2-tag::
<Tag color="gray">Adoption</Tag>

::s2-title::
Start with one painful path

::s2-body::
Retries, approvals, delayed sends, or multi-step AI are perfect first candidates.

::s3-tag::
<Tag color="gray">Breadth</Tag>

::s3-title::
Many frameworks

::s3-body::
Next.js, Astro, Express, Fastify, Hono, Nitro, Nuxt, SvelteKit, Vite, and more.

::s4-tag::
<Tag color="gray">Launch</Tag>

::s4-title::
Python too

::s4-body::
GA is about broadening where the model applies, not just polishing one API.

<!--
- Keep the setup story lightweight.
- The main adoption advice is: pick one ugly async path and move it over.
- Mention framework breadth and Python at GA.
-->
---
layout: 2-statement
variant: grid-4
tagPosition: above
---

::title::
# Why GA matters

::s1-tag::
<Tag color="gray">Internal</Tag>

::s1-title::
Used across Vercel agents

::s1-body::
This is no longer a niche experiment. It is part of how Vercel runs long-lived agent systems.

::s2-tag::
<Tag color="gray">Customer</Tag>

::s2-title::
Flora

::s2-body::
A creative agent workflow where the core product experience is built on workflows.

::s3-tag::
<Tag color="gray">Customer</Tag>

::s3-title::
Durable

::s3-body::
Workflow-powered onboarding and generated customer sites as part of a real production flow.

::s4-tag::
<Tag color="gray">Scale</Tag>

::s4-title::
5,000+ step runs

::s4-body::
The model is not limited to toy demos. It is designed for serious, high-step, high-parallelism workloads.

<!--
- This slide should feel like proof.
- Internal usage.
- Real customers.
- Real scale.
-->
---
layout: 2-statement
variant: large
---

::title::
# Durable systems should be easy to explain from the code itself

::subtitle::
If your team can read the workflow top to bottom, they can build it, debug it, and trust it in production.

<!--
- This is the closing message.
- Reliability matters, but shared understanding matters too.
-->
---
layout: 8-special
variant: qa
badge: Questions?
item1Icon: mail
item2Icon: github
item3Icon: book-open
item4Icon: bot
---

::left::
## Thank you

Let's talk about the workflows you want to make durable next.

::item-1::
pranay@vercel.com

::item-2::
github.com/vercel/workflow-examples

::item-3::
useworkflow.dev

::item-4::
Hooks, streaming, agents, and GA

<!--
- Invite questions on adoption.
- Invite questions on hooks, streaming, and agents.
- If needed, seed with: what is a good first workflow candidate?
-->
