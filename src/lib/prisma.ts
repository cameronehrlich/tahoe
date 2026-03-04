import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

async function createTursoClient(): Promise<PrismaClient> {
  const { PrismaLibSql } = await import("@prisma/adapter-libsql");
  const { createClient } = await import("@libsql/client");

  const libsql = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaLibSql(libsql as any);
  return new PrismaClient({ adapter } as any);
}

function createLocalClient(): PrismaClient {
  return new PrismaClient();
}

async function createPrismaClient(): Promise<PrismaClient> {
  if (process.env.TURSO_DATABASE_URL) {
    return createTursoClient();
  }
  return createLocalClient();
}

export const prisma =
  globalForPrisma.prisma || (await createPrismaClient());

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
