---
title: "Cardiovascular Visualization"
date: 2025-04-01
description: "Browser-gebaseerde 3D-visualisatie van cardiovasculaire data met VTK.js, inclusief virtuele endoscopie, doorsnede-weergaven en MIP-slicing."
tags: ["javascript", "vtk", "medical", "visualization", "3d"]
---

{{< github repo="wiebe-vandendriessche/cardiovascular-visualization" showThumbnail=false >}}

Een browser-gebaseerde 3D-visualisatietool voor cardiovasculaire datasets, gebouwd met VTK.js en Vite. Het project implementeert verschillende vasculaire visualisatietechnieken:

- **Virtuele endoscopie**: navigeer door een vaatboom met toetsenbordcontroles en takkeuzefunctionaliteit bij vertakkingen.
- **Doorsnede-weergaven**: doorloop de skeletgraph en inspecteer loodrechte doorsneden.
- **Maximum Intensity Projection (MIP) slicing**: exporteer MIP-slices in alle drie de assen voor verdere analyse.

De applicatie laadt `.vti`-segmentatie- en skeletbestanden en rendert deze interactief in de browser, wat het nuttig maakt voor medisch onderzoek en onderwijs.
