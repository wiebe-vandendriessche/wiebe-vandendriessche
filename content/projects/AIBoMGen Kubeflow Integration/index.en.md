---
title: "AIBoMGen Kubeflow Integration"
date: 2024-11-01
description: "A proof-of-concept that extracts ML Metadata (MLMD) from Kubeflow pipelines and generates CycloneDX AIBOMs with full lineage and an interactive BOM viewer."
tags: ["python", "kubeflow", "mlmd", "aibom", "cyclonedx", "docker", "react", "vite"]
draft: false
---

{{< github repo="idlab-discover/AIBoMGen" showThumbnail=false >}}

AIBoMGen Kubeflow Integration (v2, branch `aibomgen-v2/main`) is a proof-of-concept for the next-generation AIBoMGen system. It reads pipeline and artifact metadata from an [ML Metadata (MLMD)](https://github.com/google/ml-metadata) store—as populated by Kubeflow—and generates per-model and per-dataset CycloneDX BOM files (modelboms and databoms), together with an interactive graph-based viewer.

## What it does

- Connects to an MLMD store (SQLite or MySQL) and extracts models, datasets, lineage, and multi-pipeline relationships.
- Generates CycloneDX 1.6 JSON files under `output/cyclonedx/`, one per model and one per dataset.
- Captures lineage between model versions via BOM-Link URNs and model–dataset relationships via `externalReferences`.
- Provides raw extracted metadata snapshots in `output/extracted_mlmd*.json`.
- Ships an interactive viewer (Vite + React + vis-network) to visualize the generated BOMs as a graph, inspect CycloneDX JSON per node, and navigate lineage relationships.

## Architecture

The stack is composed of three services orchestrated via Docker Compose:

- **MLMD Populator**: Simulates Kubeflow pipeline runs and populates the MLMD store from scenario YAML files. Supports SQLite (default) and MySQL backends.
- **MLMD App**: The core BOM generator—connects to the same MLMD store, extracts metadata, and writes CycloneDX files. Designed for integration into a real Kubeflow environment.
- **Viewer**: A Vite + React frontend that reads from `output/cyclonedx/` and renders an interactive lineage graph.

> **Disclaimer**: Full Kubeflow integration, tamper resistance, and verifiability are planned for future work. This is a research proof of concept.
