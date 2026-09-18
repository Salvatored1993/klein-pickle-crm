import type { SalespersonDigest } from "@/lib/queries/digest";
import { formatDate } from "@/lib/format";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://klein-pickle-crm-aez5.vercel.app";

export function digestSubject(digest: SalespersonDigest) {
  const overdueCount = digest.items.filter((i) => i.isOverdue).length;
  const total = digest.items.length;
  return overdueCount > 0
    ? `${total} follow-up${total === 1 ? "" : "s"} today (${overdueCount} overdue)`
    : `${total} follow-up${total === 1 ? "" : "s"} due today`;
}

export function digestHtml(digest: SalespersonDigest) {
  const greetingName = digest.fullName ?? "there";

  const rows = digest.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;font-size:14px;">
            <a href="${APP_URL}${item.href}" style="color:#111;text-decoration:none;font-weight:600;">${escapeHtml(item.companyName)}</a>
            <span style="color:#666;font-size:12px;"> — ${item.type === "lead" ? "Lead" : "Customer"}</span>
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;font-size:14px;text-align:right;color:${item.isOverdue ? "#b91c1c" : "#444"};">
            ${formatDate(item.date)}${item.isOverdue ? " (overdue)" : ""}
          </td>
        </tr>`,
    )
    .join("");

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;">
      <h2 style="font-size:18px;">Good morning, ${escapeHtml(greetingName)}</h2>
      <p style="font-size:14px;color:#444;">Here's who needs a follow-up today:</p>
      <table style="width:100%;border-collapse:collapse;margin-top:12px;">
        ${rows}
      </table>
      <p style="font-size:12px;color:#999;margin-top:24px;">
        Sent by Klein Pickle CRM. <a href="${APP_URL}/calendar" style="color:#999;">View your calendar</a>
      </p>
    </div>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
