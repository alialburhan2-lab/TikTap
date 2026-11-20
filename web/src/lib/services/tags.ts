import type { Prisma, PrismaClient } from "@prisma/client";
import { slugify } from "../slug";

type Tx = PrismaClient | Prisma.TransactionClient;

/** يحوّل أسماء الوسوم إلى معرفات، وينشئ غير الموجود منها */
export async function resolveTagIds(tx: Tx, names: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const name of names) {
    const slug = slugify(name, 60);
    if (!slug) continue;
    const tag = await tx.tag.upsert({ where: { slug }, update: {}, create: { name, slug } });
    if (!ids.includes(tag.id)) ids.push(tag.id);
  }
  return ids;
}
