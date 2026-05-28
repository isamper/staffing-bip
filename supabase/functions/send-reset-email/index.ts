import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const email: string = body?.email?.trim()?.toLowerCase() ?? "";

    // Validate domain
    if (!email.endsWith("@bip-group.com")) {
      return new Response(
        JSON.stringify({ error: "Only @bip-group.com addresses are allowed." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing Supabase environment variables.");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Generate password reset link
    const { data: linkData, error: linkError } =
      await supabase.auth.admin.generateLink({
        type: "recovery",
        email,
        options: {
          redirectTo: "https://staffing-bip.vercel.app/login",
        },
      });

    if (linkError || !linkData?.properties?.action_link) {
      throw new Error(linkError?.message ?? "Failed to generate reset link.");
    }

    const resetLink = linkData.properties.action_link;

    // Send email via Gmail SMTP using nodemailer
    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPass = Deno.env.get("GMAIL_PASS");

    if (!gmailUser || !gmailPass) {
      throw new Error("Missing Gmail SMTP credentials.");
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:#1e3a5f;padding:32px 40px;text-align:left;">
              <span style="font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                bench<span style="color:#e63946;">.</span>
              </span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 24px;">
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1e3a5f;">Reset your password</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#4a5568;line-height:1.6;">
                We received a request to reset the password for your bench. account associated with <strong>${email}</strong>.
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#4a5568;line-height:1.6;">
                Click the button below to set a new password. This link will expire in 1 hour.
              </p>
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#1e3a5f;border-radius:6px;">
                    <a href="${resetLink}"
                       style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;letter-spacing:0.2px;">
                      Reset password
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:0;" />
            </td>
          </tr>
          <!-- Footer note -->
          <tr>
            <td style="padding:24px 40px 40px;">
              <p style="margin:0 0 12px;font-size:13px;color:#718096;line-height:1.5;">
                If you didn't request a password reset, you can safely ignore this email — your password will remain unchanged.
              </p>
              <p style="margin:0;font-size:13px;color:#718096;line-height:1.5;">
                Or copy and paste this URL into your browser:<br />
                <a href="${resetLink}" style="color:#1e3a5f;word-break:break-all;">${resetLink}</a>
              </p>
            </td>
          </tr>
          <!-- Footer brand -->
          <tr>
            <td style="background-color:#f4f6f9;padding:20px 40px;text-align:center;">
              <span style="font-size:13px;color:#a0aec0;">
                bench<span style="color:#e63946;">.</span> &nbsp;|&nbsp; BIP Group Staffing Platform
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    await transporter.sendMail({
      from: `"bench." <${gmailUser}>`,
      to: email,
      subject: "Reset your bench. password",
      html: htmlBody,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[send-reset-email] error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
