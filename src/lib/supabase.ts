export async function supabaseRest(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: any
) {
  const url = new URL(path, process.env.SUPABASE_URL || "");
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || ""}`,
  };

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`[SUPABASE REST] ${method} ${path} failed:`, error);
    throw new Error(`Supabase REST error: ${response.statusText}`);
  }

  return response.json().catch(() => ({}));
}
