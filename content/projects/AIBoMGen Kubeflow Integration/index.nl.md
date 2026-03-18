---
title: "AIBoMGen Kubeflow Integratie"
date: 2024-11-01
description: "Een proof-of-concept die ML Metadata (MLMD) uit Kubeflow-pipelines extraheert en CycloneDX AIBOMs genereert met volledige lineage en een interactieve BOM-viewer."
tags: ["python", "kubeflow", "mlmd", "aibom", "cyclonedx", "docker", "react", "vite"]
draft: false
---

{{< github repo="idlab-discover/AIBoMGen" showThumbnail=false >}}

AIBoMGen Kubeflow Integratie (v2, branch `aibomgen-v2/main`) is een proof-of-concept voor het volgende-generatie AIBoMGen-systeem. Het leest pipeline- en artefactmetadata uit een [ML Metadata (MLMD)](https://github.com/google/ml-metadata)-store—zoals gevuld door Kubeflow—en genereert per-model- en per-dataset-CycloneDX BOM-bestanden (modelboms en databoms), samen met een interactieve op grafen gebaseerde viewer.

## Wat het doet

- Verbindt met een MLMD-store (SQLite of MySQL) en extraheert modellen, datasets, lineage en multi-pipeline-relaties.
- Genereert CycloneDX 1.6 JSON-bestanden in `output/cyclonedx/`, één per model en één per dataset.
- Legt lineage tussen modelversies vast via BOM-Link URN's en model–dataset-relaties via `externalReferences`.
- Biedt ruwe geëxtraheerde metadatasnapshots in `output/extracted_mlmd*.json`.
- Bevat een interactieve viewer (Vite + React + vis-network) om de gegenereerde BOM's als graaf te visualiseren, CycloneDX JSON per node te inspecteren en lineage-relaties te verkennen.

## Architectuur

De stack bestaat uit drie services georchestreerd via Docker Compose:

- **MLMD Populator**: Simuleert Kubeflow pipeline-runs en vult de MLMD-store vanuit scenario YAML-bestanden. Ondersteunt SQLite (standaard) en MySQL-backends.
- **MLMD App**: De kern-BOM-generator—verbindt met dezelfde MLMD-store, extraheert metadata en schrijft CycloneDX-bestanden. Ontworpen voor integratie in een echte Kubeflow-omgeving.
- **Viewer**: Een Vite + React-frontend die `output/cyclonedx/` uitleest en een interactieve lineage-graaf rendert.

> **Disclaimer**: Volledige Kubeflow-integratie, sabotagebestendigheid en verifieerbaarheid zijn gepland voor toekomstig werk. Dit is een onderzoeksproef van concept.
