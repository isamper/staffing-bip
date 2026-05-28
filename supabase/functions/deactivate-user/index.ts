import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
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
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");

    if (!token) {
      return new Response(JSON.stringify({ error: "Missing authorization token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify caller is hr_admin (check profiles table)
    const { data: { user: caller }, error: verifyError } = await adminClient.auth.getUser(token);
    if (verifyError || !caller) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("user_role")
      .eq("id", caller.id)
      .single();

    const isAdmin =
      callerProfile?.user_role === "hr_admin" ||
      caller.user_metadata?.user_role === "hr_admin";

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: hr_admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the email of the consultant to deactivate
    const body = await req.json();
    const email: string = body?.email?.trim()?.toLowerCase() ?? "";

    if (!email) {
      return new Response(JSON.stringify({ error: "email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the user by email
    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();
    if (listError) throw new Error(listError.message);

    const target = (users ?? []).find((u) => u.email?.toLowerCase() === email);

    if (!target) {
      // No Supabase account found — consultant was never invited yet, nothing to delete
      return new Response(JSON.stringify({ ok: true, note: "No Supabase account found for this email" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Delete the user — cascade deletes their profile row too
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(target.id);
    if (deleteError) throw new Error(deleteError.message);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[deactivate-user] error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
