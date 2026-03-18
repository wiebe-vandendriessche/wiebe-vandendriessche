---
title: "AIBoMGen v1"
date: 2024-09-01
description: "Een proof-of-concept platform dat CycloneDX AIBOMs genereert tijdens gedistribueerde AI-modeltraining, met een Next.js-frontend en een Python-backend."
tags: ["python", "typescript", "nextjs", "aibom", "cyclonedx", "distributed-training", "docker"]
draft: false
---

{{< github repo="idlab-discover/AIBoMGen" showThumbnail=false >}}

AIBoMGen v1 is het originele AIBoMGen-platform (`v1.0-stable`), een proof-of-concept systeem dat AI Bills of Materials (AIBOMs) genereert tijdens het trainen van AI-modellen. Het werd ontwikkeld bij [IDLab – DISCOVER, Universiteit Gent – imec](https://idlab.ugent.be/research-teams/discover) als onderdeel van het CRACY-project, mede gefinancierd door het Digitaal Europa Programma van de Europese Unie.

## Componenten

- **AIBoMGen Platform**: Het backendsysteem dat verantwoordelijk is voor het orkestreren van gedistribueerde AI-trainingsjobs en het genereren van CycloneDX AIBOM-bestanden terwijl modellen worden getraind. Gebouwd in Python.
- **AIBoMGen Frontend**: Een Next.js-webapplicatie die een gebruikersinterface biedt voor het beheren en monitoren van het AIBoMGen-platform.

## Context

Deze versie legt AIBOM-metadata vast op het moment van training—het moment waarop modelherkomst, trainingsdata en configuratie het best beschikbaar zijn. Het dient als onderzoeksbasislijn om te evalueren welke informatie in een AIBOM moet worden vastgelegd over de volledige AI-levenscyclus heen.

Experimentele subbranches onder `aibomgen-v1/...` bewaren eerdere ontwerp-iteraties. Voor het volgende-generatiesysteem geïntegreerd met Kubeflow ML Metadata, zie AIBoMGen Kubeflow Integration (v2).
