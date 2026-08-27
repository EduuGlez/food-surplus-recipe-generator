const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";

const recipeSchema = {
  type: "object",
  properties: {
    introduction: { type: "string" },
    recipes: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          summary: { type: "string" },
          time_minutes: { type: "integer" },
          prep_time_minutes: { type: "integer" },
          cooking_time_minutes: { type: "integer" },
          difficulty: { type: "string" },
          servings: { type: "integer" },
          portion_size: { type: "string" },
          ingredients: {
            type: "array",
            minItems: 2,
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                amount: { type: "number" },
                unit: {
                  type: "string",
                  enum: ["g", "kg", "ml", "l", "unidad", "cucharadita", "cucharada"],
                },
                preparation: { type: "string" },
                origin: { type: "string", enum: ["sobrante", "despensa"] },
              },
              required: ["name", "amount", "unit", "preparation", "origin"],
            },
          },
          steps: {
            type: "array",
            minItems: 5,
            maxItems: 10,
            items: {
              type: "object",
              properties: {
                number: { type: "integer" },
                instruction: { type: "string" },
                duration_minutes: { type: "integer" },
                temperature: { type: "string" },
              },
              required: ["number", "instruction", "duration_minutes", "temperature"],
            },
          },
          waste_tip: { type: "string" },
          safety_note: { type: "string" },
        },
        required: [
          "title", "summary", "time_minutes", "prep_time_minutes",
          "cooking_time_minutes", "difficulty", "servings", "portion_size",
          "ingredients", "steps", "waste_tip", "safety_note",
        ],
      },
    },
    discarded_items: { type: "array", items: { type: "string" } },
    closing_tip: { type: "string" },
  },
  required: ["introduction", "recipes", "discarded_items", "closing_tip"],
};

function normalizeContent(content: string) {
  const cleaned = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  return JSON.parse(cleaned);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      description?: string;
      servings?: number;
      maxTime?: number;
      restrictions?: string;
      style?: string;
      model?: string;
    };

    if (!body.description?.trim()) {
      return Response.json({ error: "Indica qué alimentos han sobrado." }, { status: 400 });
    }

    const model = "llama3.2:3b";
    const prompt = `
OBJETIVO
Crear exactamente 3 recetas profesionales, diferentes entre sí, detalladas y realmente
ejecutables en una cocina. Deben aprovechar los alimentos disponibles sin sacrificar la
calidad culinaria ni la seguridad alimentaria.

DATOS DE PARTIDA
- Alimentos disponibles: ${body.description.trim()}
- Número exacto de comensales: ${body.servings || 4}
- Tiempo máximo total por receta: ${body.maxTime || 45} minutos
- Estilo culinario solicitado: ${body.style || "cocina sencilla y mediterránea"}
- Restricciones o alergias: ${body.restrictions || "ninguna indicada"}

REGLAS PARA LOS INGREDIENTES
1. Incluye en ingredients TODOS los ingredientes necesarios, tanto los sobrantes como los
   ingredientes básicos de despensa. No menciones ningún ingrediente en los pasos si no aparece
   antes en ingredients.
2. Calcula las cantidades para el número exacto de comensales. Cada ingrediente debe tener una
   cantidad numérica y una unidad métrica o doméstica admitida por el esquema.
3. No uses expresiones vagas como “al gusto”, “un poco”, “cantidad necesaria”, “un chorrito” o
   “una pizca”. Cuantifica también el aceite, la sal, las especias, el agua y las guarniciones.
4. No dupliques ingredientes. En preparation indica la preparación previa exacta: lavado,
   pelado, escurrido, corte y tamaño del corte, cuando proceda.
5. Marca origin como “sobrante” únicamente para los alimentos aportados por el usuario y como
   “despensa” para los ingredientes adicionales. Añade pocos ingredientes de despensa.
6. Si el usuario no facilita cantidades, realiza una estimación culinaria razonable y coherente
   con las raciones. No afirmes que el usuario dispone de una cantidad que no haya indicado.

REGLAS PARA LA ELABORACIÓN
1. Escribe entre 5 y 10 pasos numerados consecutivamente desde 1, sin saltos ni repeticiones.
2. Cada paso debe explicar una acción concreta: qué se hace, con qué ingredientes, durante
   cuánto tiempo y a qué temperatura o potencia cuando corresponda.
3. Incluye señales observables del punto correcto: color, textura, reducción, temperatura
   interior o consistencia. No des por supuesto conocimientos profesionales avanzados.
4. Mantén el orden real de trabajo: mise en place, preparación, cocción, ajuste final y servicio.
5. La suma de prep_time_minutes y cooking_time_minutes debe ser igual a time_minutes, y
   time_minutes no puede superar el tiempo máximo solicitado.
6. Evita pasos genéricos como “cocinar hasta que esté hecho” o “preparar normalmente”.

CALIDAD Y SEGURIDAD
- Las tres recetas deben utilizar técnicas o presentaciones claramente diferentes.
- Respeta estrictamente todas las restricciones y alergias indicadas.
- No uses alimentos deteriorados, restos de platos de clientes, productos de procedencia dudosa
  ni alimentos que puedan no ser seguros. Añádelos a discarded_items con un motivo breve y
  prudente, sin diagnosticar su estado si faltan datos.
- No inventes procesos que hagan seguro un alimento potencialmente inseguro.
- Explica en safety_note la comprobación esencial que debe realizar la cocina para esa receta.
- Toda propuesta debe ser validada por el responsable de cocina y por el sistema APPCC del centro.

SALIDA
- Escribe en español claro y profesional.
- Devuelve exclusivamente un objeto JSON válido que cumpla exactamente el esquema proporcionado.
- No añadas Markdown, comentarios, encabezados ni texto fuera del JSON.`;

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        format: recipeSchema,
        options: {
          temperature: 0.2,
          num_predict: 3600,
          num_ctx: 8192,
          repeat_penalty: 1.08,
        },
        messages: [
          {
            role: "system",
            content: `Eres un chef ejecutivo especializado en cocina hotelera, estandarización
de recetas, escandallos, reaprovechamiento y seguridad alimentaria. Redactas recetas precisas,
coherentes y reproducibles por otro equipo de cocina. Compruebas mentalmente cantidades,
raciones, tiempos, temperaturas, alérgenos y correspondencia entre ingredientes y pasos antes
de responder. Priorizas exactitud y viabilidad sobre creatividad. Respondes únicamente con JSON
válido que cumple el esquema solicitado.`,
          },
          { role: "user", content: prompt },
        ],
      }),
      signal: AbortSignal.timeout(180000),
    });

    const data = (await response.json()) as {
      message?: { content?: string };
      error?: string;
    };

    if (!response.ok) {
      const detail = data.error || "Ollama no pudo procesar la solicitud.";
      return Response.json({ error: detail }, { status: response.status });
    }

    if (!data.message?.content) {
      return Response.json({ error: "Ollama devolvió una respuesta vacía." }, { status: 502 });
    }

    const recipes = normalizeContent(data.message.content);
    return Response.json(recipes);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json(
        { error: "El modelo no devolvió las recetas con el formato esperado. Inténtalo de nuevo." },
        { status: 502 },
      );
    }

    return Response.json(
      {
        error: "No se pudo conectar con Ollama. Comprueba que está iniciado y que el modelo está descargado.",
      },
      { status: 503 },
    );
  }
}
