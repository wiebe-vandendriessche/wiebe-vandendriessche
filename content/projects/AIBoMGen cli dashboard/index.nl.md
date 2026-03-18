---
title: "AIBoMGen CLI Dashboard"
date: 2025-02-01
description: "Een demo-dashboard voor AIBoMGen CLI: een Go REST API die de AIBoMGen-bibliotheek gebruikt en een Next.js-webfrontend voor het genereren, valideren en samenvoegen van AIBOMs."
tags: ["go", "typescript", "nextjs", "aibom", "cyclonedx", "rest-api", "swagger", "docker"]
draft: false
---

{{< github repo="CRA-tools/AIBoMGen-cli-dashboard" showThumbnail=false >}}

AIBoMGen CLI Dashboard is een demonstratie van de [AIBoMGen CLI](https://github.com/idlab-discover/AIBoMGen-cli)-bibliotheek als een service. Het bestaat uit een lichtgewicht Go REST API die AIBoMGen-functionaliteit via HTTP beschikbaar stelt, en een Next.js-webfrontend (het "dashboard") waarmee gebruikers AI Bills of Materials (AIBOMs) kunnen genereren, valideren, beoordelen op volledigheid en samenvoegen.

## Componenten

- **Go REST API**: Een dunne HTTP-server die rechtstreeks gebruikt maakt van de AIBoMGen CLI Go-pakketten. API-endpoints zijn gedocumenteerd met Swagger-annotaties en beschikbaar als Swagger UI op `/swagger/index.html`. De API accepteert scanpaden, model-ID's en bestaande AIBOM/SBOM-bestanden, en retourneert CycloneDX BOM's.
- **Next.js Dashboard** (`webapp/`): Een webfrontend die de REST API aanroept en een visuele interface biedt voor de volledige AIBoMGen-workflow—van scannen en genereren tot validatie, volledigheidsscoring, verrijking en samenvoegen.

## Stack

- **Backend**: Go, [swaggo/swag](https://github.com/swaggo/swag) voor het genereren van Swagger-documentatie.
- **Frontend**: Next.js (TypeScript), CSS.
- **Uitvoering**: Start de API met `go run .` (poort 8080) en de frontend met `npm run dev` in `webapp/` (poort 3000).
