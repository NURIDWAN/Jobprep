type EmailInput = { to: string; subject: string; html: string };
export async function sendEmail(input: EmailInput): Promise<{ sent: boolean; reason?: string }> {
  const key = process.env.RESEND_API_KEY; const from = process.env.RESEND_FROM_EMAIL;
  if (!key || !from) return { sent: false, reason: "Resend belum dikonfigurasi" };
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, ...input }) });
  if (!response.ok) return { sent: false, reason: `Resend mengembalikan ${response.status}` };
  return { sent: true };
}
