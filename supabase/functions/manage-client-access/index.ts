import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { clientId, email, password, action } = await req.json();

    // Verify if requester is an admin
    const authHeader = req.headers.get("Authorization")!;
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""));
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden: Admin access required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "create") {
      // 1. Check if user already exists with this email
      let userId: string | null = null;
      let alreadyExisted = false;

      const { data: existingList, error: listError } = await supabaseClient.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      if (listError) throw listError;

      const existing = existingList?.users?.find(
        (u: any) => (u.email || "").toLowerCase() === String(email).toLowerCase()
      );

      if (existing) {
        userId = existing.id;
        alreadyExisted = true;
        // Update password if provided
        if (password) {
          const { error: updErr } = await supabaseClient.auth.admin.updateUserById(existing.id, {
            password,
            email_confirm: true,
          });
          if (updErr) throw updErr;
        }
      } else {
        const { data: authUser, error: createError } = await supabaseClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { role: "cliente" },
        });
        if (createError) throw createError;
        userId = authUser.user.id;
      }

      // Check if this auth user is already linked to a DIFFERENT client
      const { data: linkedClients } = await supabaseClient
        .from("clients")
        .select("id")
        .eq("auth_user_id", userId);

      const linkedToOther = (linkedClients || []).some((c: any) => c.id !== clientId);
      if (linkedToOther) {
        return new Response(
          JSON.stringify({
            error: "Este e-mail já está vinculado a outro cliente. Use um e-mail diferente.",
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 2. Ensure profile exists with correct role
      await supabaseClient
        .from("profiles")
        .upsert({
          id: userId,
          email: email,
          role: "cliente",
          status: "ativo",
        });

      // 3. Link auth_user_id to client
      const { error: updateError } = await supabaseClient
        .from("clients")
        .update({
          auth_user_id: userId,
          portal_access_enabled: true,
          email: email,
        })
        .eq("id", clientId);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ success: true, userId, alreadyExisted }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (action === "reset-password") {
      const { data: clientData } = await supabaseClient
        .from("clients")
        .select("auth_user_id")
        .eq("id", clientId)
        .single();

      if (!clientData?.auth_user_id) throw new Error("Client has no linked auth user");

      const { error: resetError } = await supabaseClient.auth.admin.updateUserById(
        clientData.auth_user_id,
        { password }
      );

      if (resetError) throw resetError;

      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "toggle-access") {
      const { enabled } = await req.json();
      const { error: updateError } = await supabaseClient
        .from("clients")
        .update({ portal_access_enabled: enabled })
        .eq("id", clientId);

      if (updateError) throw updateError;

      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
