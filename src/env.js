export function requiredEnv(name) {
  // Try Vite environment variables first, then fallback to process.env
  const value = (typeof import !== 'undefined' && import.meta?.env?.[name]) || 
                (typeof process !== 'undefined' && process.env?.[name]);
  if (!value) throw new Error(`${name} is not set. Create .env.local from .env.example`);
  return value;
}
