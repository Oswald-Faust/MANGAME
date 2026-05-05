import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import File from "@/models/File";
import Folder from "@/models/Folder";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  await connectDB();

  const [totalFiles, totalFolders, localFiles, driveFiles] = await Promise.all([
    File.countDocuments({ userEmail: session.user.email }),
    Folder.countDocuments({ userEmail: session.user.email }),
    File.countDocuments({ userEmail: session.user.email, source: "local" }),
    File.countDocuments({ userEmail: session.user.email, source: "google-drive" }),
  ]);

  // Calcul taille totale
  const sizeResult = await File.aggregate([
    { $match: { userEmail: session.user.email, source: "local" } },
    { $group: { _id: null, total: { $sum: "$size" } } },
  ]);

  const totalSize = sizeResult[0]?.total || 0;

  return NextResponse.json({
    totalFiles,
    totalFolders,
    localFiles,
    driveFiles,
    totalSize,
  });
}
