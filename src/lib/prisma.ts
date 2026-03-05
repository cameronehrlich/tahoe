import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = globalThis as unknown as {
  _prisma: PrismaClient | undefined;
  _prismaPromise: Promise<PrismaClient> | undefined;
};

async function createTursoClient(): Promise<PrismaClient> {
  const { PrismaLibSql } = await import("@prisma/adapter-libsql");
  const adapter = new PrismaLibSql({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  return new PrismaClient({ adapter });
}

export function getPrisma(): Promise<PrismaClient> {
  if (!globalForPrisma._prismaPromise) {
    if (process.env.TURSO_DATABASE_URL) {
      globalForPrisma._prismaPromise = createTursoClient().then((client) => {
        if (process.env.NODE_ENV !== "production") {
          globalForPrisma._prisma = client;
        }
        return client;
      });
    } else {
      const client = globalForPrisma._prisma ?? new PrismaClient();
      if (process.env.NODE_ENV !== "production") {
        globalForPrisma._prisma = client;
      }
      globalForPrisma._prismaPromise = Promise.resolve(client);
    }
  }
  return globalForPrisma._prismaPromise;
}
