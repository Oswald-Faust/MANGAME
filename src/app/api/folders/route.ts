import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Folder from "@/models/Folder";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const parentId = searchParams.get("parentId");

  const query: Record<string, unknown> = { userEmail: session.user.email };
  if (parentId) query.parentId = parentId;
  else query.parentId = { $exists: false };

  const folders = await Folder.find(query).sort({ name: 1 });
  return NextResponse.json(folders);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  await connectDB();
  const body = await req.json();
  const { name, parentId, color } = body;

  if (!name)
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });

  const folder = await Folder.create({
    name,
    userEmail: session.user.email,
    parentId: parentId || undefined,
    color: color || "#6366f1",
  });

  return NextResponse.json(folder, { status: 201 });
}
