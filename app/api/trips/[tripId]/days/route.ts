import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { tripId } = params;
    const days = await prisma.tripDay.findMany({
      where: { tripId },
      orderBy: { dateLocal: "asc" },
      include: {
        fixed: { orderBy: { startAt: "asc" } },
        items: { orderBy: { startAt: "asc" } },
      },
    });
    return NextResponse.json(days, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to get days" }, { status: 500 });
  }
}
