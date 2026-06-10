---
title: "Schaken"
date: 2023-05-22
description: "Browser-based chess game built with HTML, CSS, and JavaScript."
tags: ["javascript", "html", "css", "chess"]
---

{{< github repo="wiebe-vandendriessche/schaken" showThumbnail=false >}}

A team-based first programming project built during my second bachelor. The application is a full web-based chess platform supporting player vs player matches, bot opponents, and puzzle solving. It features a custom-built chess engine in JavaScript with full game-state handling, including legal move generation, check and checkmate detection, castling, and pawn promotion.

The chess bot is implemented using [Minimax](https://en.wikipedia.org/wiki/Minimax) with [alpha-beta pruning](https://en.wikipedia.org/wiki/Alpha%E2%80%93beta_pruning) for optimized search performance. Board evaluation combines material scoring, piece-square tables, and checkmate heuristics. Heavy computations run asynchronously using [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API), keeping the UI responsive. Game states and puzzles are handled using [FEN notation](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation), enabling serialization, undo functionality, and puzzle integration via a mock API.

