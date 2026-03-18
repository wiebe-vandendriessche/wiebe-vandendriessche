---
title: "AIBoMGen CLI Dashboard"
date: 2025-02-01
description: "A demo dashboard for AIBoMGen CLI: a Go REST API backed by the AIBoMGen library and a Next.js web frontend for generating, validating, and merging AIBOMs."
tags: ["go", "typescript", "nextjs", "aibom", "cyclonedx", "rest-api", "swagger", "docker"]
draft: false
---

{{< github repo="CRA-tools/AIBoMGen-cli-dashboard" showThumbnail=false >}}

AIBoMGen CLI Dashboard is a demonstration of the [AIBoMGen CLI](https://github.com/idlab-discover/AIBoMGen-cli) library as a service. It consists of a lightweight Go REST API that exposes AIBoMGen functionality over HTTP, and a Next.js web frontend (the "dashboard") through which users can generate, validate, assess completeness of, and merge AI Bills of Materials (AIBOMs).

## Components

- **Go REST API**: A thin HTTP server backed directly by the AIBoMGen CLI Go packages. API endpoints are documented with Swagger annotations and served as a Swagger UI at `/swagger/index.html`. The API accepts scan paths, model IDs, and existing AIBOM/SBOM files, and returns CycloneDX BOMs.
- **Next.js Dashboard** (`webapp/`): A web frontend that calls the REST API and provides a visual interface for the full AIBoMGen workflow—from scanning and generation through validation, completeness scoring, enrichment, and merging.

## Stack

- **Backend**: Go, [swaggo/swag](https://github.com/swaggo/swag) for Swagger docs generation.
- **Frontend**: Next.js (TypeScript), CSS.
- **Deployment**: Run the API with `go run .` (port 8080) and the frontend with `npm run dev` in `webapp/` (port 3000).
