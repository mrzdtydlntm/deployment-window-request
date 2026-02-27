import { Deployment } from "@/models/Deployment";
import { syncDatabase } from "@/lib/init-db";
import { Op } from "sequelize";

let isDbSynced = false;

async function ensureDbSynced() {
  if (!isDbSynced) {
    await syncDatabase();
    isDbSynced = true;
  }
}

export async function sendDiscordDailyReport() {
  try {
    await ensureDbSynced();

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error("DISCORD_WEBHOOK_URL not configured in environment");
      return { success: false, error: "Missing config" };
    }

    // Determine today in UTC+7
    const now = new Date();

    // Convert current time to Asia/Jakarta (UTC+7) representation safely
    const options: Intl.DateTimeFormatOptions = {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    };
    const dateParts = new Intl.DateTimeFormat("en-US", options).formatToParts(now);

    let year = 0,
      month = 0,
      day = 0;
    for (const part of dateParts) {
      if (part.type === "year") year = parseInt(part.value);
      if (part.type === "month") month = parseInt(part.value) - 1; // 0-indexed for JS Date logic
      if (part.type === "day") day = parseInt(part.value);
    }

    // Construct start and end of day exactly in UTC+7 ISO format
    const startString = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00+07:00`;
    const endString = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}T23:59:59.999+07:00`;

    const startOfDay = new Date(startString);
    const endOfDay = new Date(endString);

    const deployments = await Deployment.findAll({
      where: {
        time: {
          [Op.gte]: startOfDay,
          [Op.lte]: endOfDay,
        },
      },
      order: [["time", "ASC"]],
    });

    if (deployments.length === 0) {
      console.log("No deployments scheduled for today. No Discord notification sent.");
      return { success: true, message: "No deploy today" };
    }

    const todayString = new Date(startString).toLocaleDateString("en-US", {
      timeZone: "Asia/Jakarta",
      dateStyle: "full",
    });
    let description = "Please prepare the document and make sure the pre-requisites are met before deployment.\n\n";

    deployments.forEach((dep, index) => {
      // Format time in UTC+7 for the Discord display message
      const displayTime = new Date(dep.dataValues.time).toLocaleTimeString("en-US", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      description += `**${index + 1}. ${dep.dataValues.title}**\n`;
      description += `⏰ **Time:** ${displayTime} (UTC+7)\n`;
      description += `👤 **Issuer:** ${dep.dataValues.issuerName} (${dep.dataValues.teamIssuer})\n`;
      if (dep.dataValues.crq) description += `🔗 **CRQ:** ${dep.dataValues.crq}\n`;
      else description += `🔗 **CRQ:** -\n`;
      if (dep.dataValues.rlm) description += `📦 **RLM:** ${dep.dataValues.rlm}\n`;
      else description += `📦 **RLM:** -\n`;
      if (dep.dataValues.mopLink) description += `📄 [**View MoP Document**](${dep.dataValues.mopLink})\n`;
      else description += `📄 **View MoP Document:** -\n`;
      description += `\n`;
    });

    const payload = {
      content: "🔔 **DEPLOYMENT WINDOW ALERT FOR TONIGHT** 🔔 @everyone",
      embeds: [
        {
          title: `Scheduled Deployments for ${todayString}`,
          description: description,
          color: 0x3b82f6, // Blue to seamlessly match the application's glassmorphism theme
        },
      ],
    };

    const discordRes = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!discordRes.ok) {
      const errorText = await discordRes.text();
      throw new Error(`Discord API error: ${errorText}`);
    }

    console.log("Discord notification successfully dispatched!");
    return { success: true, message: "Sent successfully" };
  } catch (error) {
    console.error("Error sending Discord notification:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function checkAndSendLateDeploymentAlert(dep: Deployment) {
  try {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    const now = new Date();
    const depDate = new Date(dep.time || dep.dataValues.time);

    // Convert both to Asia/Jakarta to safely compare local days
    const jktNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const jktDep = new Date(depDate.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));

    // Check if the deployment is scheduled for TODAY (in Jakarta time)
    if (
      jktNow.getFullYear() !== jktDep.getFullYear() ||
      jktNow.getMonth() !== jktDep.getMonth() ||
      jktNow.getDate() !== jktDep.getDate()
    ) {
      return;
    }

    // Check if the current time is 08:00 AM or later (in Jakarta time)
    if (jktNow.getHours() < 8) {
      return;
    }

    // It meets all conditions! Send an immediate alert.
    const displayTime = depDate.toLocaleTimeString("en-US", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const data = dep.dataValues || dep;

    let description = "A new deployment window has just been requested for today.\n\n";
    description += `**${data.title}**\n`;
    description += `⏰ **Time:** ${displayTime} (UTC+7)\n`;
    description += `👤 **Issuer:** ${data.issuerName} (${data.teamIssuer})\n`;
    description += `🔗 **CRQ:** ${data.crq ? data.crq : "-"}\n`;
    description += `📦 **RLM:** ${data.rlm ? data.rlm : "-"}\n`;
    description += `📄 **View MoP Document:** ${data.mopLink ? `[Link](${data.mopLink})` : "-"}\n`;

    const payload = {
      content: "🚨 **LATE ADDITION: NEW DEPLOYMENT WINDOW FOR TONIGHT** 🚨 @everyone",
      embeds: [
        {
          title: `New Scheduled Deployment Added`,
          description: description,
          color: 0xef4444, // Red for urgent late-addition
        },
      ],
    };

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log("Late addition Discord notification successfully dispatched!");
  } catch (error) {
    console.error("Error evaluating late deployment alert:", error);
  }
}
