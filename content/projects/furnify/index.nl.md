---
title: "Furnify"
date: 2024-01-01
description: "Interactieve 3D-kamerinrichter gebouwd met React Three Fiber en Vite, waarmee gebruikers kamers kunnen ontwerpen en inrichten met Furnify-modules."
tags: ["javascript", "typescript", "react", "three.js", "3d"]
---

{{< github repo="wiebe-vandendriessche/furnify" showThumbnail=false >}}

Furnify is een interactieve 3D-kamerinrichtingsapplicatie gebouwd met React Three Fiber (R3F), Vite en Node.js. Gebruikers kunnen stap voor stap een kamer configureren via een vragenlijst en meubelmodules plaatsen in een realtime 3D-omgeving.

Functionaliteiten:
- 2D-vloerplaneditor met vrije tekening of rechthoekige kamers
- Realtime 3D-kamerrendering op een canvas
- Meubel- en obstakelplaatsing met sleepfunctie
- Automatische modulesuggestie op basis van kamerafmetingen, aspecten (ramen, deuren, verlichting) en gewenste functies
- Overlapsdetectie en publicatieflow
- MongoDB-backend voor het opslaan van kamerconfiguraties
