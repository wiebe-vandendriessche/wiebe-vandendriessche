---
title: "AIBoMGen CLI"
date: 2026-04-21
description: "A Go CLI tool that scans a repository for Hugging Face model usage and emits CycloneDX AI Bills of Materials (AIBOMs)."
tags: ["go", "aibom", "cyclonedx", "hugging-face", "sbom", "security", "cli"]
draft: false
---

{{< github repo="idlab-discover/AIBoMGen-cli" showThumbnail=false >}}

Go-based command-line tool that scans source code and ML artifacts to generate [CycloneDX](https://cyclonedx.org/) AI Bills of Materials (AIBOMs). Developed as part of the [CRACY Project](https://cra-cy.eu/) to provide SMEs with an easy-to-use way to create enhanced [SBOMs](https://www.ntia.gov/sbom) that include AI/ML components and metadata. Supports multiple workflows including scanning repositories, generating from model IDs, validation, enrichment, and vulnerability analysis.