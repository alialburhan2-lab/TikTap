import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { repo } from "@/lib/store";
import { readPrivateFile } from "@/lib/private-files";
import { audit } from "@/lib/admin/audit";

/** Streams a private verification document to an authorised officer only. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "super_admin" && user.role !== "verification_officer")) return new NextResponse("Forbidden", { status: 403 });
  const { id } = await params;
  const doc = await repo().get("verificationDocuments", id);
  if (!doc?.storagePath) return new NextResponse("Not found", { status: 404 });
  await audit(user, "document_view", "verificationDocuments", id);
  const file = await readPrivateFile(doc.storagePath);
  if (file.redirect) return NextResponse.redirect(file.redirect);
  return new NextResponse(new Uint8Array(file.body!), {
    headers: { "Content-Type": file.type!, "Cache-Control": "private, no-store", "Content-Disposition": "inline", "X-Robots-Tag": "noindex" },
  });
}
