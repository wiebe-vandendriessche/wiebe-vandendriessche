---
title: "AIBoMGen Kubeflow Integratie"
date: 2025-11-04
description: "Een proof-of-concept die ML Metadata (MLMD) uit Kubeflow-pipelines extraheert en CycloneDX AIBOMs genereert met volledige lineage en een interactieve BOM-viewer."
tags: ["python", "kubeflow", "mlmd", "aibom", "cyclonedx", "docker", "react", "vite"]
categories: ["software-project"]
draft: false
---

{{< github repo="idlab-discover/AIBoMGen" showThumbnail=false >}}

Proof-of-concept-systeem op de branch `aibomgen-v2/main` voor de volgende generatie van het AIBoMGen-platform. Het integreert met [Kubeflow](https://www.kubeflow.org/) via een [ML Metadata (MLMD)](https://github.com/google/ml-metadata)-store en haalt de volledige lineage van pipelines op om [CycloneDX](https://cyclonedx.org/) AI Bills of Materials (AIBOMs) te genereren.

Het systeem genereert BOMs per model en per dataset, met lineage-bewuste relaties via BOM-Link URNs en expliciete afhankelijkheden tussen model en dataset via external references. Daarnaast biedt het een interactieve, graafgebaseerde viewer om pipelines, modellen, datasets en hun onderlinge relaties te verkennen.

De architectuur bestaat uit een MLMD-stack in [Kubeflow](https://www.kubeflow.org/)-stijl met een simulator voor pipeline-uitvoering, een service voor BOM-generatie en een webgebaseerde visualisatielaag. Dit werk maakt deel uit van doctoraatsonderzoek naar end-to-end traceerbaarheid van de AI-levenscyclus en transparantie in de supply chain, uitgevoerd in het kader van het [CRACY-project](https://cra-cy.eu/).
