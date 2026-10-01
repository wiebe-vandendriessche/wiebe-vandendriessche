---
title: "AIBoMGen v1"
date: 2025-05-28
description: "Een proof-of-concept platform dat CycloneDX AIBOMs genereert tijdens gedistribueerde AI-modeltraining, met een Next.js-frontend en een Python-backend."
tags: ["python", "typescript", "next.js", "aibom", "cyclonedx", "distributed-training", "docker", "masters-thesis"]
categories: ["software-project"]
draft: false
---

{{< github repo="idlab-discover/AIBoMGen" showThumbnail=false >}}

Origineel AIBoMGen-platform (v1.0-stable), ontwikkeld als onderdeel van mijn masterproef aan de Universiteit Gent binnen het [CRACY-project](https://cra-cy.eu/).

Het genereert [CycloneDX](https://cyclonedx.org/) AI Bills of Materials rechtstreeks tijdens het trainen van AI-modellen en legt metadata vast zoals trainingsconfiguratie, modelartefacten en datasetgebruik op het moment dat ze ontstaan. Het systeem bestaat uit een Python-backend voor de orkestratie van gedistribueerde training en AIBOM-generatie, en een [Next.js](https://nextjs.org/)-frontend voor monitoring en interactie.

Deze versie focust op het vastleggen van modelherkomst tijdens de training en dient als vroege onderzoeksbasis om te begrijpen welke metadata betrouwbaar kan worden verzameld tijdens modelontwikkeling. Ze vormt de basis voor latere uitbreidingen richting volledige opvolging van de levenscyclus via integratie met [ML Metadata (MLMD)](https://github.com/google/ml-metadata) en [Kubeflow](https://www.kubeflow.org/).
