import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Verify JWT and check hr_admin role
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

    // Create admin client
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify the caller's token and get their user info
    const { data: { user: caller }, error: verifyError } = await adminClient.auth.getUser(token);

    if (verifyError || !caller) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check that caller has hr_admin role (check profiles table — source of truth)
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

    // List all users and filter to pending status
    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();

    if (listError) {
      throw new Error(listError.message);
    }

    const pendingUsers = (users ?? [])
      .filter((u) => u.user_metadata?.status === "pending")
      .map((u) => ({
        id: u.id,
        email: u.email ?? "",
        name: u.user_metadata?.name ?? "",
        seniority: u.user_metadata?.seniority ?? "",
        created_at: u.created_at,
      }));

    return new Response(JSON.stringify({ users: pendingUsers }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[list-pending-users] error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
