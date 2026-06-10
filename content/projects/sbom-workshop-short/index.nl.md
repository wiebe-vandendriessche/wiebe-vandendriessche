---
title: "SBOM Workshop"
date: 2026-01-27
description: "Hands-on workshop over Software Bill of Materials: genereer, onderteken, scan en visualiseer SBOMs voor supply chain beveiliging."
tags: ["go", "sbom", "security", "github-actions", "workshop"]
---

{{< github repo="wiebe-vandendriessche/sbom-workshop-short" showThumbnail=false >}}

Een hands-on workshop over Software Bill of Materials ([SBOM](https://www.ntia.gov/sbom)), ontwikkeld voor het [CRACY project](https://cra-cy.eu/) en evenementen. De workshop is gebouwd rond een bewust kwetsbare [Go](https://go.dev/) applicatie om realistische software supply chain risico’s te demonstreren. Deelnemers leren hoe ze [SBOMs](https://www.ntia.gov/sbom) genereren uit Go applicaties met [Syft](https://github.com/anchore/syft), ze cryptografisch ondertekenen met [Cosign](https://github.com/sigstore/cosign), kwetsbaarheden detecteren met [Grype](https://github.com/anchore/grype), de workflow automatiseren met [GitHub Actions](https://github.com/features/actions) en resultaten visualiseren met [Sunshine](https://github.com/chainloop-dev/sunshine).

De workshop toont end-to-end SBOM-gebaseerde security praktijken binnen de context van het [CRACY project](https://cra-cy.eu/), met focus op software supply chain security en reproduceerbare beveiligingsworkflows.
