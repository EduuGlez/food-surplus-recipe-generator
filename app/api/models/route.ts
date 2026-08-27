const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";

export async function GET() {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(3500),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Ollama no respondió correctamente");

    const data = (await response.json()) as { models?: Array<{ name: string }> };
    return Response.json({ models: (data.models || []).map((item) => item.name) });
  } catch {
    return Response.json(
      { error: "No se pudo conectar con Ollama", models: [] },
      { status: 503 },
    );
  }
}
