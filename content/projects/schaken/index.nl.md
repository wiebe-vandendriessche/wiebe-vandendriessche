---
title: "Schaken"
date: 2023-05-22
description: "Browser-gebaseerd schaakspel gebouwd met HTML, CSS en JavaScript."
tags: ["javascript", "html", "css", "chess"]
---

{{< github repo="wiebe-vandendriessche/schaken" showThumbnail=false >}}

Een eerste programmeerproject in teamverband uit mijn tweede bachelor. De applicatie is een volledig webgebaseerd schaakplatform met partijen tussen spelers, bots als tegenstander en schaakpuzzels. Het bevat een zelfgebouwde schaakengine in JavaScript met volledig beheer van de spelstatus, inclusief het genereren van legale zetten, detectie van schaak en schaakmat, rokeren en promotie van pionnen.

De schaakbot is ge&iuml;mplementeerd met [Minimax](https://en.wikipedia.org/wiki/Minimax) met [alpha-beta pruning](https://en.wikipedia.org/wiki/Alpha%E2%80%93beta_pruning) voor geoptimaliseerde zoekprestaties. De bordevaluatie combineert materiaalscores, piece-square tables en schaakmatheuristieken. Zware berekeningen draaien asynchroon via [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API), waardoor de UI responsief blijft. Spelstatussen en puzzels worden verwerkt in [FEN-notatie](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation), wat serialisatie, een undo-functie en de integratie van puzzels via een mock API mogelijk maakt.
