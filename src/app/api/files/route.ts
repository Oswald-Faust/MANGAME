import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import File from "@/models/File";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get("folderId");
  const source = searchParams.get("source");
  const search = searchParams.get("search");

  const query: Record<string, unknown> = { userEmail: session.user.email };
  if (folderId) query.folderId = folderId;
  if (source) query.source = source;
  if (search) query.name = { $regex: search, $options: "i" };

  const files = await File.find(query).sort({ createdAt: -1 });
  return NextResponse.json(files);
}
