---
title: "AIBoMGen CLI Action"
date: 2026-04-21
description: "Een GitHub Action die automatisch een CycloneDX AIBOM genereert voor Hugging Face-modellen in een repository, met behulp van AIBoMGen CLI."
tags: ["typescript", "github-actions", "aibom", "cyclonedx", "hugging-face", "ci-cd", "security"]
draft: false
---

{{< github repo="CRA-tools/AIBoMGen-cli-action" showThumbnail=false >}}

GitHub Action-wrapper rond de AIBoMGen CLI voor CI/CD-pipelines. Maakt het mogelijk om [CycloneDX](https://cyclonedx.org/) AIBOMs automatisch te genereren, valideren, verrijken en samen te voegen tijdens builds. Ontwikkeld in het kader van het [CRACY-project](https://cra-cy.eu/) om transparantie in de AI/ML-supply chain toegankelijk te maken voor kmo's, zonder dat daar manuele tooling voor nodig is.
