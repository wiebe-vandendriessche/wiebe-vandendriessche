---
title: "Cardiovascular Visualization"
date: 2025-04-01
description: "Browser-based 3D visualization of cardiovascular data using VTK.js, featuring virtual endoscopy, cross-section views, and MIP slicing."
tags: ["javascript", "vtk", "medical", "visualization", "3d"]
---

{{< github repo="wiebe-vandendriessche/cardiovascular-visualization" showThumbnail=false >}}

A browser-based 3D visualization tool for cardiovascular datasets built with VTK.js and Vite. The project implements several vascular visualization techniques:

- **Virtual Endoscopy**: navigate a vessel tree using keyboard controls with branch selection at junctions.
- **Cross-section views**: traverse the skeleton graph and inspect perpendicular cross-sections.
- **Maximum Intensity Projection (MIP) slicing**: export MIP slices in all three axes for further analysis.

The application loads `.vti` segmentation and skeleton files and renders them interactively in the browser, making it useful for medical research and education.
