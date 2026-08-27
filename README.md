# Circular Chef Advisor

Prototipo local que propone tres recetas de reaprovechamiento a partir de los
alimentos disponibles. La interfaz se conecta exclusivamente con Ollama en el
propio equipo.

## Requisitos

- Node.js 22 o posterior.
- Ollama instalado y en ejecución.
- Un modelo local compatible. El prototipo utiliza `llama3.2:3b` por defecto.

## Puesta en marcha

1. Descarga el modelo la primera vez:

   ```bash
   ollama pull llama3.2:3b
   ```

2. Comprueba que Ollama está iniciado:

   ```bash
   ollama serve
   ```

3. En otra terminal, inicia la interfaz desde esta carpeta:

   ```bash
   npm run dev
   ```

4. Abre `http://localhost:3000`.

La luz de estado de la cabecera indicará si Ollama está conectado. Si ya tienes
otros modelos descargados, aparecerán automáticamente en el selector.

## Configuración opcional

Ollama se busca en `http://127.0.0.1:11434`. Para utilizar otra dirección:

```bash
OLLAMA_BASE_URL=http://127.0.0.1:11434 npm run dev
```

## Qué hace

- Acepta una descripción libre o una lista guiada de sobrantes.
- Tiene en cuenta comensales, tiempo, estilo culinario y restricciones.
- Pide exactamente tres recetas en español, con ingredientes cuantificados y
  pasos de elaboración numerados.
- Calcula preparación, cocción, duración total y tamaño de la ración.
- Cada paso incluye duración y temperatura o potencia cuando corresponde.
- Advierte sobre ingredientes que el modelo considera dudosos y recuerda que
  toda propuesta debe validarse según el sistema APPCC del establecimiento.
- No envía la información a servicios externos.

## Verificación

```bash
npm run build
npm test
```
