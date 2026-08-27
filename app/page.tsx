"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Recipe = {
  title: string;
  summary: string;
  time_minutes: number;
  prep_time_minutes: number;
  cooking_time_minutes: number;
  difficulty: string;
  servings: number;
  portion_size: string;
  ingredients?: Array<{
    name: string;
    amount: number | null;
    unit: string;
    preparation: string;
    origin: "sobrante" | "despensa";
  }>;
  uses?: string[];
  extras?: string[];
  steps?: Array<{
    number: number;
    instruction: string;
    duration_minutes: number;
    temperature: string;
  } | string>;
  waste_tip: string;
  safety_note: string;
};

type RecipeResponse = {
  introduction: string;
  recipes: Recipe[];
  discarded_items: string[];
  closing_tip: string;
};

type ConnectionState = "checking" | "online" | "offline";

const examples = [
  "Pan del desayuno, tomates maduros y queso",
  "Arroz cocido, verduras asadas y pollo sin servir",
  "Plátanos maduros, yogur natural y avena",
];

export default function Home() {
  const [mode, setMode] = useState<"natural" | "form">("natural");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [servings, setServings] = useState("4");
  const [maxTime, setMaxTime] = useState("45");
  const [restrictions, setRestrictions] = useState("");
  const [style, setStyle] = useState("Cocina canaria y mediterránea");
  const [model, setModel] = useState("llama3.2:3b");
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [connection, setConnection] = useState<ConnectionState>("checking");
  const [result, setResult] = useState<RecipeResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const sourceText = useMemo(
    () => (mode === "natural" ? description : ingredients),
    [description, ingredients, mode],
  );

  async function checkConnection() {
    setConnection("checking");
    try {
      const response = await fetch("/api/models", { cache: "no-store" });
      if (!response.ok) throw new Error("offline");
      const data = (await response.json()) as { models: string[] };
      setAvailableModels(data.models);
      if (data.models.length && !data.models.includes(model)) {
        setModel(data.models[0]);
      }
      setConnection("online");
    } catch {
      setAvailableModels([]);
      setConnection("offline");
    }
  }

  useEffect(() => {
    void checkConnection();
    // The first connection check should only run once when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generateRecipes(event: FormEvent) {
    event.preventDefault();
    if (!sourceText.trim()) {
      setError("Indica primero qué alimentos han sobrado.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: sourceText.trim(),
          servings: Number(servings) || 4,
          maxTime: Number(maxTime) || 45,
          restrictions: restrictions.trim(),
          style: style.trim(),
          model: model.trim(),
        }),
      });

      const data = (await response.json()) as RecipeResponse & { error?: string };
      if (!response.ok) throw new Error(data.error || "No se pudieron generar las recetas.");
      setResult(data);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No se pudieron generar las recetas.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Circular Chef Advisor, inicio">
          <span className="brand-mark" aria-hidden="true">C</span>
          <span>
            <strong>Circular Chef</strong>
            <small>Advisor</small>
          </span>
        </a>
        <button
          className={`connection ${connection}`}
          type="button"
          onClick={() => void checkConnection()}
          aria-label="Comprobar conexión con Ollama"
        >
          <span className="connection-dot" />
          {connection === "online"
            ? "Ollama conectado"
            : connection === "checking"
              ? "Comprobando Ollama"
              : "Ollama sin conexión"}
        </button>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow"><span>●</span> Cocina circular asistida por IA</div>
        <h1>Convierte lo que ha sobrado en <em>algo delicioso.</em></h1>
        <p>
          Cuéntanos qué alimentos tienes disponibles y el asistente local propondrá
          recetas prácticas para aprovecharlos mejor.
        </p>
        <div className="flow" aria-label="Cómo funciona">
          <span><b>1</b> Indica los sobrantes</span>
          <i>→</i>
          <span><b>2</b> La IA los combina</span>
          <i>→</i>
          <span><b>3</b> Cocina y aprovecha</span>
        </div>
      </section>

      <section className="workspace" aria-label="Generador de recetas">
        <div className="generator-card">
          <div className="tabs" role="tablist" aria-label="Modo de entrada">
            <button
              className={mode === "natural" ? "active" : ""}
              type="button"
              role="tab"
              aria-selected={mode === "natural"}
              onClick={() => setMode("natural")}
            >
              Texto libre
            </button>
            <button
              className={mode === "form" ? "active" : ""}
              type="button"
              role="tab"
              aria-selected={mode === "form"}
              onClick={() => setMode("form")}
            >
              Formulario guiado
            </button>
          </div>

          <form onSubmit={generateRecipes}>
            {mode === "natural" ? (
              <div className="field large-field">
                <label htmlFor="description">¿Qué ha sobrado hoy?</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Ej.: Han sobrado 2 kg de tomates maduros, pan del desayuno y medio kilo de queso. Quiero preparar algo para 6 personas..."
                  rows={6}
                />
                <div className="examples" aria-label="Ejemplos rápidos">
                  <span>Prueba con:</span>
                  {examples.map((example) => (
                    <button key={example} type="button" onClick={() => setDescription(example)}>
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="field large-field">
                <label htmlFor="ingredients">Alimentos disponibles</label>
                <textarea
                  id="ingredients"
                  value={ingredients}
                  onChange={(event) => setIngredients(event.target.value)}
                  placeholder="Ej.: 2 kg de tomates maduros; 1 barra de pan; 500 g de queso..."
                  rows={4}
                />
              </div>
            )}

            <div className="form-grid">
              <div className="field">
                <label htmlFor="servings">Comensales</label>
                <input
                  id="servings"
                  type="number"
                  min="1"
                  max="100"
                  value={servings}
                  onChange={(event) => setServings(event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="time">Tiempo máximo</label>
                <select id="time" value={maxTime} onChange={(event) => setMaxTime(event.target.value)}>
                  <option value="20">20 minutos</option>
                  <option value="30">30 minutos</option>
                  <option value="45">45 minutos</option>
                  <option value="60">60 minutos</option>
                  <option value="90">90 minutos</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="style">Tipo de cocina</label>
                <input id="style" value={style} onChange={(event) => setStyle(event.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="restrictions">Alergias o restricciones</label>
                <input
                  id="restrictions"
                  value={restrictions}
                  onChange={(event) => setRestrictions(event.target.value)}
                  placeholder="Ej.: sin gluten, vegetariano..."
                />
              </div>
            </div>

            <div className="model-row">
              <div>
                <span>Modelo local</span>
                <small>Los datos no salen de este equipo</small>
              </div>
              {availableModels.length ? (
                <select aria-label="Modelo de Ollama" value={model} onChange={(event) => setModel(event.target.value)}>
                  {availableModels.map((name) => <option key={name}>{name}</option>)}
                </select>
              ) : (
                <input
                  aria-label="Nombre del modelo de Ollama"
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                />
              )}
            </div>

            {connection === "offline" && (
              <div className="notice warning" role="status">
                <b>Ollama no está disponible.</b>
                <span>Inícialo y descarga el modelo <code>{model}</code>; después pulsa el indicador de conexión.</span>
              </div>
            )}
            {error && <div className="notice error" role="alert">{error}</div>}

            <button className="generate-button" type="submit" disabled={loading}>
              {loading ? <><span className="spinner" /> Pensando recetas…</> : <>Generar 3 recetas <span>→</span></>}
            </button>
          </form>
        </div>

        <aside className="side-card">
          <span className="side-icon" aria-hidden="true">↺</span>
          <h2>Aprovecha más.<br />Desperdicia menos.</h2>
          <p>Cada ingrediente recuperado reduce costes y evita residuos innecesarios.</p>
          <div className="local-badge">
            <span>⌂</span>
            <div><b>100 % local</b><small>Procesado con Ollama</small></div>
          </div>
          <div className="safety-note">
            <b>Seguridad primero</b>
            Utiliza únicamente alimentos no servidos, en buen estado y conservados según tu sistema APPCC.
          </div>
        </aside>
      </section>

      {result && (
        <section className="results" aria-live="polite">
          <div className="results-heading">
            <div><span className="section-number">03</span><p>PROPUESTAS</p></div>
            <h2>Tres formas de aprovecharlo</h2>
            <p>{result.introduction}</p>
          </div>

          {result.discarded_items?.length > 0 && (
            <div className="discard-warning">
              <b>No se han utilizado por seguridad:</b> {result.discarded_items.join(", ")}
            </div>
          )}

          <div className="recipe-grid">
            {result.recipes.map((recipe, index) => {
              const recipeIngredients = recipe.ingredients ?? [
                ...(recipe.uses ?? []).map((name) => ({
                  name,
                  amount: null,
                  unit: "",
                  preparation: "Preparación no especificada",
                  origin: "sobrante" as const,
                })),
                ...(recipe.extras ?? []).map((name) => ({
                  name,
                  amount: null,
                  unit: "",
                  preparation: "Preparación no especificada",
                  origin: "despensa" as const,
                })),
              ];
              const recipeSteps = (recipe.steps ?? []).map((step, stepIndex) =>
                typeof step === "string"
                  ? {
                      number: stepIndex + 1,
                      instruction: step,
                      duration_minutes: 0,
                      temperature: "",
                    }
                  : step,
              );

              return (
              <article className="recipe-card" key={`${recipe.title}-${index}`}>
                <div className="recipe-topline">
                  <span>RECETA {String(index + 1).padStart(2, "0")}</span>
                  <span>{recipe.difficulty}</span>
                </div>
                <h3>{recipe.title}</h3>
                <p>{recipe.summary}</p>
                <div className="recipe-meta">
                  <span>◷ {recipe.time_minutes} min en total</span>
                  {recipe.prep_time_minutes != null && <span>Preparación: {recipe.prep_time_minutes} min</span>}
                  {recipe.cooking_time_minutes != null && <span>Cocción: {recipe.cooking_time_minutes} min</span>}
                  <span>♙ {recipe.servings} raciones</span>
                  {recipe.portion_size && <span>{recipe.portion_size}</span>}
                </div>
                <div className="recipe-content">
                  <div className="ingredient-block">
                    <h4>Ingredientes y cantidades</h4>
                    <p className="section-helper">Para {recipe.servings} raciones</p>
                    <ul className="ingredients-list">
                      {recipeIngredients.map((ingredient, ingredientIndex) => (
                        <li key={`${ingredient.name}-${ingredientIndex}`}>
                          <div>
                            <b>
                              {ingredient.amount != null
                                ? `${ingredient.amount} ${ingredient.unit}`
                                : "Cantidad no indicada"}
                            </b>
                            <span>{ingredient.name}</span>
                          </div>
                          <small>
                            {ingredient.preparation}
                            <em>{ingredient.origin === "sobrante" ? "Sobrante" : "Despensa"}</em>
                          </small>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="procedure-block">
                    <h4>Elaboración paso a paso</h4>
                    <p className="section-helper">Sigue los pasos en este orden</p>
                    <ol className="steps-list">
                      {recipeSteps.map((step, stepIndex) => (
                        <li key={`${step.number}-${stepIndex}`}>
                          <span className="step-number">{step.number}</span>
                          <div>
                            <p>{step.instruction}</p>
                            <small>
                              {step.duration_minutes > 0 ? `${step.duration_minutes} min` : ""}
                              {step.temperature && step.temperature.toLowerCase() !== "no aplica"
                                ? `${step.duration_minutes > 0 ? " · " : ""}${step.temperature}`
                                : ""}
                            </small>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
                <div className="recipe-footer">
                  <div className="tip"><b>Consejo circular</b>{recipe.waste_tip}</div>
                  {recipe.safety_note && <small className="recipe-safety"><b>Control APPCC</b>{recipe.safety_note}</small>}
                </div>
              </article>
              );
            })}
          </div>
          <p className="closing-tip">{result.closing_tip}</p>
        </section>
      )}

      <footer>
        <span>Circular Chef Advisor · Prototipo local</span>
        <span>La IA propone; el equipo de cocina valida.</span>
      </footer>
    </main>
  );
}
