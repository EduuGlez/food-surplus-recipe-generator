import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("contains the complete local recipe flow", async () => {
  const [page, recipesRoute, modelsRoute, layout, packageJson] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/api/recipes/route.ts", root), "utf8"),
    readFile(new URL("app/api/models/route.ts", root), "utf8"),
    readFile(new URL("app/layout.tsx", root), "utf8"),
    readFile(new URL("package.json", root), "utf8"),
  ]);

  assert.match(page, /Texto libre/);
  assert.match(page, /Formulario guiado/);
  assert.match(page, /Generar 3 recetas/);
  assert.match(page, /Ollama conectado/);
  assert.match(page, /sistema APPCC/);
  assert.match(page, /Ingredientes y cantidades/);
  assert.match(page, /Elaboración paso a paso/);
  assert.match(page, /recipe\.ingredients \?\?/);
  assert.match(page, /recipe\.uses \?\?/);
  assert.match(recipesRoute, /\/api\/chat/);
  assert.match(recipesRoute, /exactamente 3 recetas/);
  assert.match(recipesRoute, /prep_time_minutes/);
  assert.match(recipesRoute, /duration_minutes/);
  assert.match(recipesRoute, /No uses expresiones vagas/);
  assert.match(modelsRoute, /\/api\/tags/);
  assert.match(layout, /Circular Chef Advisor/);
  assert.doesNotMatch(page, /SkeletonPreview|codex-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});

test("includes the project social image and removes the starter preview", async () => {
  await access(new URL("public/og.png", root));
  await assert.rejects(access(new URL("app/_sites-preview/SkeletonPreview.tsx", root)));
  await assert.rejects(access(new URL("app/_sites-preview/preview.css", root)));
});
