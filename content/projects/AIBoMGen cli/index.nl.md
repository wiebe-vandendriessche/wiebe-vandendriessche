---
title: "AIBoMGen CLI"
date: 2026-04-21
description: "Een Go CLI-tool die een repository scant op Hugging Face-modelgebruik en CycloneDX AI Bills of Materials (AIBOMs) genereert."
tags: ["go", "aibom", "cyclonedx", "hugging-face", "sbom", "security", "cli"]
draft: false
---

{{< github repo="idlab-discover/AIBoMGen-cli" showThumbnail=false >}}

Commandlinetool in Go die broncode en ML-artefacten scant om [CycloneDX](https://cyclonedx.org/) AI Bills of Materials (AIBOMs) te genereren. Ontwikkeld binnen het [CRACY-project](https://cra-cy.eu/) om kmo's een eenvoudige manier te bieden om uitgebreide [SBOMs](https://www.ntia.gov/sbom) te maken die ook AI/ML-componenten en metadata bevatten. Ondersteunt verschillende workflows, waaronder het scannen van repositories, genereren op basis van model-ID's, validatie, verrijking en kwetsbaarheidsanalyse.
