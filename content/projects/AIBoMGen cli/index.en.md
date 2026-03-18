---
title: "AIBoMGen CLI"
date: 2025-01-01
description: "A Go CLI tool that scans a repository for Hugging Face model usage and emits CycloneDX AI Bills of Materials (AIBOMs)."
tags: ["go", "aibom", "cyclonedx", "hugging-face", "sbom", "security", "cli"]
draft: false
---

{{< github repo="idlab-discover/AIBoMGen-cli" showThumbnail=false >}}

AIBoMGen CLI is a Go-based command-line tool and library that scans a source repository for AI model references—primarily Hugging Face model IDs—and generates CycloneDX AI Bill of Materials (AIBOM) files. It is part of the broader AIBoMGen research project on trusted AIBOM generation, carried out at [IDLab – DISCOVER, Ghent University – imec](https://idlab.ugent.be/research-teams/discover).

## Commands

- **`scan`**: Walks a directory, detects Hugging Face model IDs via regex matching, and emits one AIBOM per discovered model.
- **`generate`**: Generates an AIBOM directly from one or more Hugging Face model IDs, or via an interactive browser.
- **`validate`**: Validates an existing AIBOM file and runs completeness checks; supports strict mode with configurable score thresholds.
- **`completeness`**: Computes a weighted completeness score (0–1) for an existing AIBOM using the internal metadata field registry.
- **`enrich`**: Fills missing metadata fields in an existing AIBOM, either interactively or from a YAML config file; can refetch data from the Hugging Face Hub.
- **`merge`** *(beta)*: Merges one or more AIBOMs with an SBOM from a tool like Syft or Trivy into a single comprehensive BOM, with deduplication and dependency graph merging.

## Architecture

The tool is structured as a collection of focused Go packages: `internal/scanner` for regex-based Hugging Face detection, `internal/fetcher` for Hugging Face Hub API and model card retrieval, `internal/metadata` as a central field registry driving both BOM population and completeness scoring, `internal/builder` and `internal/generator` for BOM construction, `internal/enricher` for interactive/file-based enrichment, `internal/validator` for structural and completeness validation, `internal/merger` for AIBOM+SBOM merging, and `internal/ui` for a rich TUI built with Charm (Lipgloss + Bubbletea).

Supported output formats are CycloneDX JSON and XML, with configurable spec version (1.4 / 1.5 / 1.6).
