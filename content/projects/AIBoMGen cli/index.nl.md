---
title: "AIBoMGen CLI"
date: 2025-01-01
description: "Een Go CLI-tool die een repository scant op Hugging Face-modelgebruik en CycloneDX AI Bills of Materials (AIBOMs) genereert."
tags: ["go", "aibom", "cyclonedx", "hugging-face", "sbom", "security", "cli"]
draft: false
---

{{< github repo="idlab-discover/AIBoMGen-cli" showThumbnail=false >}}

AIBoMGen CLI is een op Go gebaseerde command-line tool en bibliotheek die een broncoderepository scant op AI-modelreferenties—voornamelijk Hugging Face-model-ID's—en CycloneDX AI Bill of Materials (AIBOM)-bestanden genereert. Het maakt deel uit van het bredere AIBoMGen-onderzoeksproject rond vertrouwde AIBOM-generatie, uitgevoerd bij [IDLab – DISCOVER, Universiteit Gent – imec](https://idlab.ugent.be/research-teams/discover).

## Commando's

- **`scan`**: Doorloopt een directory, detecteert Hugging Face-model-ID's via regex-matching en genereert één AIBOM per gevonden model.
- **`generate`**: Genereert een AIBOM rechtstreeks vanuit één of meerdere Hugging Face-model-ID's, of via een interactieve browser.
- **`validate`**: Valideert een bestaand AIBOM-bestand en voert compleetheidscontroles uit; ondersteunt strikte modus met configureerbare scoredrempels.
- **`completeness`**: Berekent een gewogen volledigheidscore (0–1) voor een bestaand AIBOM op basis van het interne metadataveldregister.
- **`enrich`**: Vult ontbrekende metadatavelden in een bestaand AIBOM aan, interactief of vanuit een YAML-configuratiebestand; kan data opnieuw ophalen van de Hugging Face Hub.
- **`merge`** *(beta)*: Samenvoegen van één of meerdere AIBOMs met een SBOM van een tool zoals Syft of Trivy tot één uitgebreide BOM, met deduplicatie en samenvoeging van de afhankelijkheidsgraph.

## Architectuur

De tool is opgebouwd uit gefocuste Go-pakketten: `internal/scanner` voor op regex gebaseerde Hugging Face-detectie, `internal/fetcher` voor het ophalen van Hugging Face Hub-API en model cards, `internal/metadata` als centraal veldregister voor zowel BOM-populatie als volledigheidsscoring, `internal/builder` en `internal/generator` voor BOM-constructie, `internal/enricher` voor interactieve of bestandsgebaseerde verrijking, `internal/validator` voor structurele en compleetheidsvalidatie, `internal/merger` voor het samenvoegen van AIBOM en SBOM, en `internal/ui` voor een uitgebreide TUI gebouwd met Charm (Lipgloss + Bubbletea).

Ondersteunde uitvoerformaten zijn CycloneDX JSON en XML, met configureerbare spec-versie (1.4 / 1.5 / 1.6).
