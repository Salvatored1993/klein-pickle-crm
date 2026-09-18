import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";
import { getDailyDigests } from "@/lib/queries/digest";
import { digestHtml, digestSubject } from "@/lib/email/digest-template";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const digests = await getDailyDigests();

  const results = await Promise.allSettled(
    digests.map((digest) =>
      resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: digest.email,
        subject: digestSubject(digest),
        html: digestHtml(digest),
      }),
    ),
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.length - sent;

  return NextResponse.json({ recipients: digests.length, sent, failed });
}
