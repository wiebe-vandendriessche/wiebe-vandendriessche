---
title: "Schaken"
date: 2023-05-22
description: "Browser-gebaseerd schaakspel gebouwd met HTML, CSS en JavaScript."
tags: ["javascript", "html", "css", "chess"]
---

{{< github repo="wiebe-vandendriessche/schaken" showThumbnail=false >}}

Een teamgebaseerd eerste programmeerproject uit de tweede bachelor. Het project is een volledig webgebaseerd schaakplatform met ondersteuning voor speler-tegen-speler, bots en schaakpuzzels. Het bevat een zelfgebouwde JavaScript chess engine met legale zetgeneratie, schaak- en matdetectie, rokeren en promotie.

De schaakbot is opgebouwd rond [Minimax](https://en.wikipedia.org/wiki/Minimax) met [alpha-beta pruning](https://en.wikipedia.org/wiki/Alpha%E2%80%93beta_pruning) voor efficiënte zoekoptimalisatie. De evaluatie combineert stukwaarden, piece-square tables en schaakmatheuristieken. Zware berekeningen draaien asynchroon via [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API), waardoor de UI responsief blijft. Spelstatus en puzzels worden beheerd via [FEN-notatie](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation), wat serialisatie, undo-functionaliteit en integratie van externe puzzeldata via een mock API mogelijk maakt.
