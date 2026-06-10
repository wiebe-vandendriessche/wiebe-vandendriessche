---
title: "AIBoMGen v1"
date: 2025-05-28
description: "A proof-of-concept platform that generates CycloneDX AIBOMs during distributed AI model training, with a Next.js frontend and a Python backend."
tags: ["python", "typescript", "nextjs", "aibom", "cyclonedx", "distributed-training", "docker", "master thesis"]
draft: false
---

{{< github repo="idlab-discover/AIBoMGen" showThumbnail=false >}}

Original AIBoMGen platform (v1.0-stable), developed as part of my master thesis at Ghent University within the [CRACY Project](https://cra-cy.eu/).

It generates [CycloneDX](https://cyclonedx.org/) AI Bills of Materials directly during AI model training, capturing metadata such as training configuration, model artifacts, and dataset usage at the point of creation. The system consists of a Python backend for distributed training orchestration and AIBOM generation, and a [Next.js](https://nextjs.org/) frontend for monitoring and interaction.

This version focuses on in-training capture of model provenance, serving as an early research baseline for understanding what metadata can be reliably extracted during model development. It forms the foundation for later extensions that move toward full lifecycle tracking via [ML Metadata (MLMD)](https://github.com/google/ml-metadata) and [Kubeflow](https://www.kubeflow.org/) integration.
