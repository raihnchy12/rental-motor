// @ts-expect-error: Mengatasi perbedaan resolusi modul Prisma versi terbaru
import { PrismaClient } from "@prisma/client";

/**
 * Mencegah pembuatan instance PrismaClient baru secara berlebihan saat Next.js
 * melakukan hot reload (terutama pada mode development `pnpm dev`).
 * Tanpa pola singleton ini, setiap file yang melakukan re-import prisma
 * akan membuka koneksi database baru yang dapat menghabiskan kuota koneksi PostgreSQL.
 */

const prismaClientSingleton = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (PrismaClient as any)({
    log: ["error", "warn"],
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export { prisma };

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}
