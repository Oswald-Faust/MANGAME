import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { put } from "@vercel/blob";
import { connectDB } from "@/lib/mongodb";
import File from "@/models/File";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as globalThis.File;
    const folderId = formData.get("folderId") as string | null;

    if (!file)
      return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });

    // Upload vers Vercel Blob
    const blob = await put(
      `${session.user.email}/${Date.now()}_${file.name}`,
      file,
      {
        access: "public",
        contentType: file.type,
      }
    );

    // Sauvegarder en DB
    await connectDB();
    const savedFile = await File.create({
      name: file.name,
      userEmail: session.user.email,
      folderId: folderId || undefined,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      url: blob.url,
      blobKey: blob.url,
      source: "local",
      processed: false,
    });

    // Lancer le traitement en arrière-plan (async)
    fetch(
      `${process.env.NEXTAUTH_URL}/api/ai/process`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": process.env.NEXTAUTH_SECRET!,
        },
        body: JSON.stringify({
          fileId: savedFile._id.toString(),
          userEmail: session.user.email,
        }),
      }
    ).catch(console.error);

    return NextResponse.json(savedFile, { status: 201 });
  } catch (error) {
    console.error("Erreur upload:", error);
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
  }
}
