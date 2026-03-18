---
title: "AIBoMGen CLI Action"
date: 2025-02-01
description: "Een GitHub Action die automatisch een CycloneDX AIBOM genereert voor Hugging Face-modellen in een repository, met behulp van AIBoMGen CLI."
tags: ["typescript", "github-actions", "aibom", "cyclonedx", "hugging-face", "ci-cd", "security"]
draft: false
---

{{< github repo="CRA-tools/AIBoMGen-cli-action" showThumbnail=false >}}

AIBoMGen CLI Action is een GitHub Action die [AIBoMGen CLI](https://github.com/idlab-discover/AIBoMGen-cli) integreert in CI/CD-pipelines. Het scant automatisch een repository op Hugging Face-modelreferenties en genereert een CycloneDX AI Bill of Materials (AIBOM), waarna het resultaat wordt geüpload als workflow-artefact en optioneel wordt toegevoegd aan een GitHub-release.

## Functies

- Downloadt een vastgepinde of de recentste versie van de AIBoMGen CLI-binary vanuit GitHub Releases (of bouwt vanuit broncode als een Go-archief-URL wordt opgegeven).
- Voert het `scan`-commando uit op een configureerbare invoerdirectory.
- Ondersteunt alle AIBoMGen CLI-uitvoermogelijkheden: formaat (`json` / `xml` / `auto`), CycloneDX spec-versie, Hugging Face-token voor privé- of beveiligde modellen, en logverbositeit.
- Uploadt de gegenereerde AIBOM als downloadbaar workflow-artefact met configureerbare retentieduur.
- Voegt de AIBOM toe aan een GitHub-release wanneer de workflow wordt geactiveerd door een release- of tag-push-event (vereist `contents: write`-rechten).
- Biedt een `download-aibomgen`-modus die alleen de CLI-binary downloadt en de `cmd`-output instelt, voor gevorderde gebruiksscenario's.

## Gebruik

```yaml
- uses: CRA-tools/AIBoMGen-cli-action@main
  with:
    path: .
    format: json
    spec-version: "1.6"
    hf-token: ${{ secrets.HF_TOKEN }}
    upload-artifact: "true"
    upload-release-assets: "true"
  permissions:
    contents: write
```

Gebouwd met TypeScript en gedistribueerd als gecompileerde JavaScript-action.
