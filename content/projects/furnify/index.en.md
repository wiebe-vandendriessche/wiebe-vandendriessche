---
title: "Furnify"
date: 2024-01-01
description: "Interactive 3D room configurator built with React Three Fiber and Vite, allowing users to design and furnish rooms with Furnify modules."
tags: ["javascript", "typescript", "react", "three.js", "3d"]
---

{{< github repo="wiebe-vandendriessche/furnify" showThumbnail=false >}}

Furnify is an interactive 3D room design application built with React Three Fiber (R3F), Vite, and Node.js. Users can configure a room step by step through a questionnaire and place furniture modules in a real-time 3D environment.

Features include:
- 2D floor plan editor with freeform drawing or rectangular rooms
- Real-time 3D room rendering on a canvas
- Furniture and obstacle placement with drag support
- Automatic module suggestion based on room dimensions, aspects (windows, doors, lights), and desired functions
- Overlap detection and publishing flow
- MongoDB backend for storing room configurations
