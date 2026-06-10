---
title: "AIBoMGen CLI Action"
date: 2026-04-21
description: "Een GitHub Action die automatisch een CycloneDX AIBOM genereert voor Hugging Face-modellen in een repository, met behulp van AIBoMGen CLI."
tags: ["typescript", "github-actions", "aibom", "cyclonedx", "hugging-face", "ci-cd", "security"]
draft: false
---

{{< github repo="CRA-tools/AIBoMGen-cli-action" showThumbnail=false >}}

GitHub Action wrapper rond AIBoMGen CLI voor gebruik in CI/CD pipelines. Laat toe om automatisch [CycloneDX](https://cyclonedx.org/) AIBOMs te genereren, valideren, enrichen en samen te voegen tijdens builds. Ontwikkeld binnen het [CRACY Project](https://cra-cy.eu/) om AI/ML supply chain transparantie toegankelijk te maken zonder manuele tooling.