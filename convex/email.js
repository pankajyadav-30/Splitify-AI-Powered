import { v } from "convex/values";
import { action } from "./_generated/server";
import { Resend } from "resend";

export const sendEmail = action({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
    text: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("Missing RESEND_API_KEY in Convex environment");
      return { success: false, error: "Missing RESEND_API_KEY" };
    }

    const resend = new Resend(apiKey);

    try {
      const result = await resend.emails.send({
        // <-- IMPORTANT: use a FROM address from a domain you've verified in Resend
        from: "Splitr <noreply@updates.yourdomain.com>",
        to: args.to,
        subject: args.subject,
        html: args.html,
        text: args.text,
      });

      console.log("Email sent successfully:", { id: result.id, to: args.to });
      return { success: true, id: result.id };
    } catch (error) {
      console.error("Failed to send email:", error);
      return { success: false, error: error?.message || String(error) };
    }
  },
});
