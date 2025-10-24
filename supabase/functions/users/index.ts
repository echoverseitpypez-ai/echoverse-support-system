// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
  );
  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const slugify = (input: string) => (input || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { data: profile } = await userClient.from('profiles').select('role').eq('id', user.id).single();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'agent';
  if (!isAdmin) return json({ error: 'Forbidden' }, 403);

  try {
    if (req.method === 'GET') {
      const { data, error } = await adminClient.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return json({ data });
    }

    if (req.method === 'POST') {
      const { username, password, full_name, department_id } = await req.json();
      if (!username || !password) return json({ error: 'username and password required' }, 400);
      const safe = slugify(username);
      const email = `${safe || 'teacher'}@echoverse.local`;
      const { data: created, error: e1 } = await adminClient.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { username: safe, display_name: full_name || username } });
      if (e1) throw e1;
      const uid = created.user.id;
      const { data, error } = await adminClient.from('profiles').upsert({ id: uid, full_name: full_name || username, role: 'teacher', department_id }, { onConflict: 'id' }).select('*').single();
      if (error) throw error;
      return json({ user_id: uid, profile: data }, 201);
    }

    if (req.method === 'PATCH') {
      const { id, ...fields } = await req.json();
      if (!id) return json({ error: 'id required' }, 400);
      const { data, error } = await adminClient.from('profiles').update(fields).eq('id', id).select('*').single();
      if (error) throw error;
      return json({ data });
    }

    if (req.method === 'DELETE') {
      const { id } = await req.json();
      if (!id) return json({ error: 'id required' }, 400);
      const { error } = await adminClient.auth.admin.deleteUser(id);
      if (error) throw error;
      return json({ ok: true });
    }

    return json({ error: 'Method Not Allowed' }, 405);
  } catch (err) {
    return json({ message: (err as any)?.message ?? String(err) }, 500);
  }
});
