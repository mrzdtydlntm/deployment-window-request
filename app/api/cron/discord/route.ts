import { NextResponse } from "next/server";
import { sendDiscordDailyReport } from "@/lib/cron";

export async function GET() {
  const result = await sendDiscordDailyReport();

  if (!result.success) {
    return NextResponse.json({ error: result.error || "Internal Server Error" }, { status: 500 });
  }

  return NextResponse.json({ message: result.message });
}
