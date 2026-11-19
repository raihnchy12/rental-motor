import { z } from "zod";

/**
 * Skema validasi untuk Environment Variables sisi server.
 */
const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url("DATABASE_URL harus berupa URL PostgreSQL yang valid"),
  DIRECT_URL: z.string().url("DIRECT_URL harus berupa URL yang valid").optional(),

  // Auth & Keamanan (Wajib minimal 32 karakter)
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET wajib diisi dan minimal 32 karakter"),
  AUTH_URL: z.string().url("AUTH_URL harus berupa URL yang valid"),
  CRON_SECRET: z.string().min(32, "CRON_SECRET wajib diisi dan minimal 32 karakter"),

  // Storage S3 (Opsional di development, wajib jika production)
  S3_ENDPOINT: z.string().url().optional().or(z.literal("")),
  S3_REGION: z.string().min(1).optional(),
  S3_BUCKET: z.string().min(1).optional(),
  S3_ACCESS_KEY: z.string().min(1).optional(),
  S3_SECRET_KEY: z.string().min(1).optional(),

  // Resend / Email
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().email().optional().or(z.literal("")),

  // Sentry & Turnstile Secret
  SENTRY_DSN: z.string().url().optional().or(z.literal("")),
  TURNSTILE_SECRET_KEY: z.string().min(1).optional(),
});

/**
 * Skema validasi untuk Environment Variables sisi client (diawali NEXT_PUBLIC_).
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_BASE_URL: z.string().url("NEXT_PUBLIC_BASE_URL harus berupa URL yang valid"),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1).optional(),
});

const _mergedEnv = {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  AUTH_URL: process.env.AUTH_URL,
  CRON_SECRET: process.env.CRON_SECRET,
  S3_ENDPOINT: process.env.S3_ENDPOINT,
  S3_REGION: process.env.S3_REGION,
  S3_BUCKET: process.env.S3_BUCKET,
  S3_ACCESS_KEY: process.env.S3_ACCESS_KEY,
  S3_SECRET_KEY: process.env.S3_SECRET_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  SENTRY_DSN: process.env.SENTRY_DSN,
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
};

const parsedServer = serverEnvSchema.safeParse(_mergedEnv);
const parsedClient = clientEnvSchema.safeParse(_mergedEnv);

if (!parsedServer.success || !parsedClient.success) {
  console.error(
    "❌ Kesalahan konfigurasi Environment Variables (Zod Validation Failed):\n",
    JSON.stringify(
      {
        serverErrors: parsedServer.success ? null : parsedServer.error.format(),
        clientErrors: parsedClient.success ? null : parsedClient.error.format(),
      },
      null,
      2
    )
  );
  throw new Error(
    "Gagal menjalankan aplikasi karena Environment Variables tidak valid atau belum lengkap."
  );
}

export const serverEnv = parsedServer.data;
export const publicEnv = parsedClient.data;
