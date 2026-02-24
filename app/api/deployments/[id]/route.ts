import { NextRequest, NextResponse } from "next/server";
import { Deployment } from "@/models/Deployment";
import { syncDatabase } from "@/lib/init-db";

let isDbSynced = false;

async function ensureDbSynced() {
  if (!isDbSynced) {
    await syncDatabase();
    isDbSynced = true;
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureDbSynced();
    const { id } = await params;

    const deployment = await Deployment.findByPk(id);
    if (!deployment) {
      return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
    }

    const formData = await req.formData();

    // Extract fields
    const title = formData.get("title") as string | null;
    const time = formData.get("time") as string | null;
    const teamIssuer = formData.get("teamIssuer") as string | null;
    const issuerName = formData.get("issuerName") as string | null;
    const crq = formData.get("crq") as string | null;
    const rlm = formData.get("rlm") as string | null;
    const mopLink = formData.get("mopLink") as string | null;

    if (!title?.trim() || !time?.trim() || !teamIssuer?.trim() || !issuerName?.trim()) {
      return NextResponse.json(
        { error: "Missing required fields: Title, Time, Team Issuer, and Issuer Name must not be empty." },
        { status: 400 },
      );
    }

    await deployment.update({
      title,
      time: new Date(time),
      teamIssuer,
      issuerName,
      crq,
      rlm,
      mopLink,
    });

    return NextResponse.json(deployment);
  } catch (error) {
    console.error("Error updating deployment:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureDbSynced();
    const { id } = await params;

    const deployment = await Deployment.findByPk(id);
    if (!deployment) {
      return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
    }

    await deployment.destroy();

    return NextResponse.json({ message: "Deployment deleted successfully" });
  } catch (error) {
    console.error("Error deleting deployment:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}
