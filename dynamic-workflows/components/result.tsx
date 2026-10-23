import type { WorkflowResult } from '@/lib/types';

export function Result({ result }: { result: WorkflowResult }) {
  return (
    <div className="vbg-custom-result">
      <p className="vbg-custom-result-summary">{result.summary}</p>
      {result.steps.map((step) => (
        <details
          className="vbg-custom-result-step"
          key={step.stepId}
          open={
            step.stepId === 'announcement' ||
            step.stepId === 'draft' ||
            step.stepId === 'response'
          }
        >
          <summary>
            <span>{step.title}</span>
            <span className="vbg-meta">View output</span>
          </summary>
          <p>{step.content}</p>
          <dl>
            {Object.entries(step.metrics).map(([key, value]) => (
              <div key={key}>
                <dt>{key.replace(/([A-Z])/g, ' $1')}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </details>
      ))}
      <details className="vbg-custom-raw-result">
        <summary>Inspect return value</summary>
        <pre className="vbg-custom-json" tabIndex={0}>
          {JSON.stringify(result, null, 2)}
        </pre>
      </details>
    </div>
  );
}
