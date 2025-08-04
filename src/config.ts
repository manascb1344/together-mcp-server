import { z } from 'zod';

const ConfigSchema = z.object({
  TOGETHER_API_KEY: z.string({
    error: 'TOGETHER_API_KEY is required'
  }),
  MODEL: z.string().default('black-forest-labs/FLUX.1-schnell-Free'),
  TIMEOUT_MS: z.string().optional().default('30000').transform(val => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num <= 0) {
      throw new Error('TIMEOUT_MS must be a positive integer');
    }
    return num;
  })
});

export type AppConfig = z.infer<typeof ConfigSchema>;

export function loadConfig(env: Record<string, string | undefined> = process.env) {
  const result = ConfigSchema.safeParse(env);
  
  if (!result.success) {
    const errors = result.error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
    throw new Error(`Configuration validation failed: ${errors}`);
  }
  
  return result.data;
}