---
title: "AIBoMGen Kubeflow Integration"
date: 2025-11-04
description: "A proof-of-concept that extracts ML Metadata (MLMD) from Kubeflow pipelines and generates CycloneDX AIBOMs with full lineage and an interactive BOM viewer."
tags: ["python", "kubeflow", "mlmd", "aibom", "cyclonedx", "docker", "react", "vite"]
draft: false
---

{{< github repo="idlab-discover/AIBoMGen" showThumbnail=false >}}

Proof-of-concept system on the `aibomgen-v2/main` branch for the next-generation AIBoMGen platform. It integrates with [Kubeflow](https://www.kubeflow.org/) via an [ML Metadata (MLMD)](https://github.com/google/ml-metadata) store and extracts full pipeline lineage to generate [CycloneDX](https://cyclonedx.org/) AI Bills of Materials (AIBOMs).

The system generates per-model and per-dataset BOMs, including lineage-aware relationships using BOM-Link URNs and explicit model–dataset dependencies via external references. It also provides an interactive graph-based viewer to explore pipelines, models, datasets, and their relationships.

The architecture consists of a [Kubeflow](https://www.kubeflow.org/)-style MLMD stack with a simulator for pipeline execution, a BOM generation service, and a web-based visualization layer. This work is part of PhD research into end-to-end AI lifecycle traceability and supply chain transparency, conducted as part of the [CRACY Project](https://cra-cy.eu/).
