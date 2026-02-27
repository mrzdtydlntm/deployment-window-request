import { NextRequest, NextResponse } from "next/server";
import { Deployment } from "@/models/Deployment";
import { syncDatabase } from "@/lib/init-db";
import { checkAndSendLateDeploymentAlert } from "@/lib/cron";

let isDbSynced = false;

async function ensureDbSynced() {
  if (!isDbSynced) {
    await syncDatabase();
    isDbSynced = true;
  }
}

export async function GET() {
  try {
    await ensureDbSynced();
    const deployments = await Deployment.findAll({ order: [["time", "ASC"]] });
    return NextResponse.json(deployments);
  } catch (error) {
    console.error("Error fetching deployments:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDbSynced();

    const formData = await req.formData();

    const title = formData.get("title") as string | null;
    const time = formData.get("time") as string | null;
    const teamIssuer = formData.get("teamIssuer") as string | null;
    const issuerName = formData.get("issuerName") as string | null;
    const crq = formData.get("crq") as string | null;
    const rlm = formData.get("rlm") as string | null;
    const mopLink = formData.get("mopLink") as string | null;

    if (!title || !time || !teamIssuer || !issuerName) {
      return NextResponse.json(
        { error: "Missing required fields (title, time, teamIssuer, issuerName)" },
        { status: 400 },
      );
    }

    const newDeployment = await Deployment.create({
      title,
      time: new Date(time),
      teamIssuer,
      issuerName,
      crq,
      rlm,
      mopLink,
    });

    await checkAndSendLateDeploymentAlert(newDeployment);

    return NextResponse.json(newDeployment, { status: 201 });
  } catch (error) {
    console.error("Error creating deployment:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}
