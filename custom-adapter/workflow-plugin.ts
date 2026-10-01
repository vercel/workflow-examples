import { plugin } from "bun";
import { transform } from '@swc/core';

console.log('Workflow plugin loaded');

plugin({
  name: 'workflow-transform',
  setup(build) {
    build.onLoad({ filter: /workflows\/.*\.(ts|tsx|js|jsx)$/ }, async (args) => {
      const source = await Bun.file(args.path).text();

      const result = await transform(source, {
        filename: args.path,
        jsc: {
          experimental: {
            plugins: [[require.resolve('@workflow/swc-plugin'), { mode: 'step' }]],
          },
        },
      });

      return {
        contents: result.code,
        loader: 'ts',
      };
    });
  },
});