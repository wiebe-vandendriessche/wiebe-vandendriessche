---
title: "AIBoMGen v1"
date: 2024-09-01
description: "A proof-of-concept platform that generates CycloneDX AIBOMs during distributed AI model training, with a Next.js frontend and a Python backend."
tags: ["python", "typescript", "nextjs", "aibom", "cyclonedx", "distributed-training", "docker"]
draft: false
---

{{< github repo="idlab-discover/AIBoMGen" showThumbnail=false >}}

AIBoMGen v1 is the original AIBoMGen platform (`v1.0-stable`), a proof-of-concept system that generates AI Bills of Materials (AIBOMs) during the training of AI models. It was developed at [IDLab – DISCOVER, Ghent University – imec](https://idlab.ugent.be/research-teams/discover) as part of the CRACY project, co-funded by the European Union's Digital Europe Programme.

## Components

- **AIBoMGen Platform**: The backend system responsible for orchestrating distributed AI training jobs and generating CycloneDX AIBOM files as models are trained. Built in Python.
- **AIBoMGen Frontend**: A Next.js web application that provides a user interface for managing and monitoring the AIBoMGen platform.

## Context

This version captures AIBOM metadata at training time—at the point where model provenance, training data, and configuration are most readily available. It serves as a research baseline for evaluating what information can and should be captured in an AIBOM across the AI lifecycle.

Experimental sub-branches under `aibomgen-v1/...` preserve earlier design iterations. For the next-generation system integrated with Kubeflow ML Metadata, see AIBoMGen Kubeflow Integration (v2).
