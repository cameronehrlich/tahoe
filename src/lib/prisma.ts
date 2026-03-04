import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  _prisma: PrismaClient | undefined;
  _prismaPromise: Promise<PrismaClient> | undefined;
};

async function createTursoClient(): Promise<PrismaClient> {
  const { PrismaLibSQL } = await import("@prisma/adapter-libsql");
  const { createClient } = await import("@libsql/client/web");

  const libsql = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  const adapter = new PrismaLibSQL(libsql);
  return new PrismaClient({ adapter } as any);
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
