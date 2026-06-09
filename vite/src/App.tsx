import { useState } from "react";

export function App() {
  const [email, setEmail] = useState("hello@example.com");
  const [message, setMessage] = useState("Ready to start a workflow.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function startWorkflow(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("Starting workflow...");

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setMessage("Workflow started.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start workflow.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      style={{
        display: "grid",
        minHeight: "100vh",
        placeItems: "center",
        padding: "2rem",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <form
        onSubmit={startWorkflow}
        style={{
          display: "grid",
          gap: "1rem",
          width: "min(100%, 28rem)",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.75rem" }}>Vite Workflow Starter</h1>
        <input
          aria-label="Email"
          disabled={isSubmitting}
          onChange={(event) => setEmail(event.target.value)}
          required
          style={{
            border: "1px solid #d4d4d8",
            borderRadius: 6,
            font: "inherit",
            padding: "0.75rem 0.875rem",
          }}
          type="email"
          value={email}
        />
        <button
          disabled={isSubmitting}
          style={{
            background: "#0a0a0a",
            border: 0,
            borderRadius: 6,
            color: "white",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            font: "inherit",
            padding: "0.75rem 0.875rem",
          }}
          type="submit"
        >
          {isSubmitting ? "Starting..." : "Start workflow"}
        </button>
        <p aria-live="polite" style={{ color: "#52525b", margin: 0 }}>
          {message}
        </p>
      </form>
    </main>
  );
}
