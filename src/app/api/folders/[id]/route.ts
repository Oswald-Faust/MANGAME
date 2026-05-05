import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Folder from "@/models/Folder";
import File from "@/models/File";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  await connectDB();
  const { id } = await params;

  const folder = await Folder.findOneAndDelete({
    _id: id,
    userEmail: session.user.email,
  });

  if (!folder)
    return NextResponse.json({ error: "Dossier non trouvé" }, { status: 404 });

  // Supprimer les fichiers du dossier
  await File.deleteMany({ folderId: id, userEmail: session.user.email });

  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const body = await req.json();

  const folder = await Folder.findOneAndUpdate(
    { _id: id, userEmail: session.user.email },
    { $set: body },
    { new: true }
  );

  if (!folder)
    return NextResponse.json({ error: "Dossier non trouvé" }, { status: 404 });

  return NextResponse.json(folder);
}
