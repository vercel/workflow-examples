import type { NextConfig } from 'next';
import { withWorkflow } from 'workflow/next';

const nextConfig: NextConfig = {
  /* config options here */
};

export default withWorkflow(nextConfig);
