import { Router } from "express";
import { buildOpenApiDocument } from "./openapi.js";

const SWAGGER_UI_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Document Approval API Docs</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({ url: "/api/openapi.json", dom_id: "#swagger-ui", persistAuthorization: true });
    </script>
  </body>
</html>`;

export function createDocsRouter() {
  const router = Router();
  const document = buildOpenApiDocument();

  router.get("/openapi.json", (_req, res) => {
    res.json(document);
  });
  router.get("/docs", (_req, res) => {
    res.type("html").send(SWAGGER_UI_HTML);
  });

  return router;
}
