---
title: "AIBoMGen CLI Action"
date: 2025-02-01
description: "A GitHub Action that automatically generates a CycloneDX AIBOM for Hugging Face models referenced in a repository, using AIBoMGen CLI."
tags: ["typescript", "github-actions", "aibom", "cyclonedx", "hugging-face", "ci-cd", "security"]
draft: false
---

{{< github repo="CRA-tools/AIBoMGen-cli-action" showThumbnail=false >}}

AIBoMGen CLI Action is a GitHub Action that integrates [AIBoMGen CLI](https://github.com/idlab-discover/AIBoMGen-cli) into CI/CD pipelines. It automatically scans a repository for Hugging Face model references and generates a CycloneDX AI Bill of Materials (AIBOM), then uploads it as a workflow artifact and optionally attaches it to a GitHub release.

## Features

- Downloads a pinned or latest version of the AIBoMGen CLI binary from GitHub Releases (or builds from source if a Go archive URL is provided).
- Runs the `scan` command against a configurable input directory.
- Supports all AIBoMGen CLI output options: format (`json` / `xml` / `auto`), CycloneDX spec version, Hugging Face token for private/gated models, and log verbosity.
- Uploads the generated AIBOM as a downloadable workflow artifact with configurable retention.
- Attaches the AIBOM to a GitHub release when the workflow is triggered by a release or tag push event (requires `contents: write` permission).
- Exposes a `download-aibomgen` mode that only downloads the CLI binary and sets the `cmd` output, for advanced use cases.

## Usage

```yaml
- uses: CRA-tools/AIBoMGen-cli-action@main
  with:
    path: .
    format: json
    spec-version: "1.6"
    hf-token: ${{ secrets.HF_TOKEN }}
    upload-artifact: "true"
    upload-release-assets: "true"
  permissions:
    contents: write
```

Built with TypeScript and distributed as a compiled JavaScript action.
