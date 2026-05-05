import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import File from "@/models/File";
import Embedding from "@/models/Embedding";
import { del } from "@vercel/blob";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  await connectDB();
  const { id } = await params;

  const file = await File.findOne({ _id: id, userEmail: session.user.email });
  if (!file)
    return NextResponse.json({ error: "Fichier non trouvé" }, { status: 404 });

  return NextResponse.json(file);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  await connectDB();
  const { id } = await params;

  const file = await File.findOne({ _id: id, userEmail: session.user.email });
  if (!file)
    return NextResponse.json({ error: "Fichier non trouvé" }, { status: 404 });

  // Supprimer le blob si fichier local
  if (file.source === "local" && file.url) {
    try {
      await del(file.url);
    } catch (e) {
      console.error("Erreur suppression blob:", e);
    }
  }

  // Supprimer les embeddings
  await Embedding.deleteMany({ fileId: id });
  await file.deleteOne();

  return NextResponse.json({ success: true });
}
