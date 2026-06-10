---
title: "AIBoMGen Kubeflow Integratie"
date: 2025-11-04
description: "Een proof-of-concept die ML Metadata (MLMD) uit Kubeflow-pipelines extraheert en CycloneDX AIBOMs genereert met volledige lineage en een interactieve BOM-viewer."
tags: ["python", "kubeflow", "mlmd", "aibom", "cyclonedx", "docker", "react", "vite"]
draft: false
---

{{< github repo="idlab-discover/AIBoMGen" showThumbnail=false >}}

Proof-of-concept op branch `aibomgen-v2/main` voor de volgende generatie AIBoMGen. Het systeem leest metadata uit een [ML Metadata (MLMD)](https://github.com/google/ml-metadata) store die door [Kubeflow](https://www.kubeflow.org/) wordt gevuld en zet dit om naar [CycloneDX](https://cyclonedx.org/) AI Bills of Materials.

Het genereert per model en per dataset een BOM, met relaties tussen modellen via BOM-Link URNs en relaties tussen model en dataset via external references. Daarnaast is er een interactieve graph viewer om pipelines, modellen en datasets visueel te verkennen.

De opzet bestaat uit een MLMD simulator, een BOM generator service en een web viewer. Dit werk is onderdeel van PhD onderzoek rond traceerbaarheid en transparantie in de AI lifecycle, uitgevoerd in het kader van het [CRACY Project](https://cra-cy.eu/).