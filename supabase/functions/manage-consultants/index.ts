import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, userData } = await req.json()

    if (action === 'create') {
      const { email, password, full_name, role, specialty, phone, city, state, max_clients, hours_available, status } = userData

      // 1. Create user in Auth
      const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name, role }
      })

      if (authError) throw authError

      // 2. Upsert profile (the trigger might have already created it)
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email,
          full_name,
          role: (role || 'consultor') as any,
          specialty,
          phone,
          city,
          state,
          status: status || 'ativo',
          max_clients: max_clients || 10,
          hours_available: hours_available || 160
        }, { onConflict: 'id' })


      if (profileError) {
        // Rollback auth user if profile creation fails
        await supabaseClient.auth.admin.deleteUser(authData.user.id)
        throw profileError
      }

      // 3. Seed default permissions if it's a consultant
      if (role === 'consultor' || !role) {
        const { error: permError } = await supabaseClient.rpc('seed_default_consultant_permissions', {
          p_consultant_id: authData.user.id
        })
        if (permError) console.error('Error seeding default permissions:', permError)
      }

      return new Response(JSON.stringify({ user: authData.user }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (action === 'update') {
      const { id, full_name, specialty, phone, city, state, status, role, max_clients, hours_available } = userData

      const { error } = await supabaseClient
        .from('profiles')
        .update({ full_name, specialty, phone, city, state, status, role, max_clients, hours_available })
        .eq('id', id)

      if (error) throw error

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (action === 'delete') {
      const { id } = userData

      // Delete from Auth (cascades or we manual delete profile if RLS/FK allows)
      const { error } = await supabaseClient.auth.admin.deleteUser(id)
      if (error) throw error

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    throw new Error('Invalid action')
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
