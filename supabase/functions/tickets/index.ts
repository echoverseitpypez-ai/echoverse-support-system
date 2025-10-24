// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const json = (body: unknown, status = 200, extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });

Deno.serve(async (req) => {
  // Basic CORS for direct HTTP calls (supabase.functions.invoke adds auth header automatically)
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
  );

  const cors = { "Access-Control-Allow-Origin": "*" };

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401, cors);

    if (req.method === "GET") {
      // List tickets visible by RLS
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return json({ data }, 200, cors);
    }

    if (req.method === "POST") {
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
      const payload = {
        title: String(body.title ?? "").slice(0, 200),
        description: String(body.description ?? ""),
        priority: (body.priority as string) ?? "normal",
        status: "open",
        created_by: user.id,
      };
      const { data, error } = await supabase.from("tickets").insert(payload).select("*").single();
      if (error) throw error;
      return json({ data }, 201, cors);
    }

    return json({ error: "Method Not Allowed" }, 405, cors);
  } catch (err) {
    return json({ message: (err as any)?.message ?? String(err) }, 500, cors);
  }
});
