---
title: "SBOM Workshop"
date: 2026-01-27
description: "Hands-on workshop on Software Bill of Materials: generate, sign, scan, and visualize SBOMs for supply chain security."
tags: ["go", "sbom", "security", "github-actions", "workshop"]
---

{{< github repo="wiebe-vandendriessche/sbom-workshop-short" showThumbnail=false >}}

A hands-on workshop on Software Bill of Materials ([SBOM](https://www.ntia.gov/sbom)) developed for the [CRACY project](https://cra-cy.eu/) and events. The workshop is built around a deliberately vulnerable [Go](https://go.dev/) application to demonstrate real-world software supply chain risks. Participants learn how to generate [SBOMs](https://www.ntia.gov/sbom) from Go applications using [Syft](https://github.com/anchore/syft), sign them cryptographically with [Cosign](https://github.com/sigstore/cosign), detect vulnerabilities with [Grype](https://github.com/anchore/grype), automate the workflow with [GitHub Actions](https://github.com/features/actions), and visualize results with [Sunshine](https://github.com/chainloop-dev/sunshine).

The workshop demonstrates end-to-end SBOM-based security practices in the context of the [CRACY project](https://cra-cy.eu/), focusing on software supply chain security and reproducible security workflows.

