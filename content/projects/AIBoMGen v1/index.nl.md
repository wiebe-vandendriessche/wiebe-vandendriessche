---
title: "AIBoMGen v1"
date: 2025-05-28
description: "Een proof-of-concept platform dat CycloneDX AIBOMs genereert tijdens gedistribueerde AI-modeltraining, met een Next.js-frontend en een Python-backend."
tags: ["python", "typescript", "nextjs", "aibom", "cyclonedx", "distributed-training", "docker"]
draft: false
---

{{< github repo="idlab-discover/AIBoMGen" showThumbnail=false >}}

Origineel AIBoMGen platform (v1.0-stable), ontwikkeld als onderdeel van mijn master thesis aan Universiteit Gent binnen het [CRACY Project](https://cra-cy.eu/).

Het systeem maakt [CycloneDX](https://cyclonedx.org/) AI Bills of Materials tijdens het trainen van AI modellen. Het verzamelt metadata zoals trainingsconfiguratie, modellen en datasets op het moment dat ze worden aangemaakt. Het bestaat uit een Python backend voor het uitvoeren van training en AIBOM generatie, en een [Next.js](https://nextjs.org/) frontend voor monitoring.

Deze versie focust op het verzamelen van metadata tijdens training en dient als basis om te onderzoeken welke informatie beschikbaar is tijdens modelontwikkeling. Het vormt de start van later werk rond [ML Metadata (MLMD)](https://github.com/google/ml-metadata) en [Kubeflow](https://www.kubeflow.org/) integratie.
