---
title: "AIBoMGen CLI"
date: 2026-04-21
description: "Een Go CLI-tool die een repository scant op Hugging Face-modelgebruik en CycloneDX AI Bills of Materials (AIBOMs) genereert."
tags: ["go", "aibom", "cyclonedx", "hugging-face", "sbom", "security", "cli"]
draft: false
---

{{< github repo="idlab-discover/AIBoMGen-cli" showThumbnail=false >}}

Go-gebaseerde commandline tool die source code en ML-artifacts doorzoekt om [CycloneDX](https://cyclonedx.org/) AI Bills of Materials (AIBOMs) te genereren. Ontwikkeld binnen het [CRACY Project](https://cra-cy.eu/) om kmo’s een eenvoudige manier te geven om uitgebreide [SBOMs](https://www.ntia.gov/sbom) te maken met AI/ML componenten en metadata. Ondersteunt verschillende workflows zoals het scannen van repositories, genereren op basis van model IDs, validatie, enriching en vulnerability scans.