---
title: "Bibliotheekscatalogus (TypeORM)"
date: 2023-01-01
description: "Een webapplicatie voor een bibliotheekscatalogus gebouwd met TypeORM, TypeScript en Express, met beheer van boeken, artikels en auteurs."
tags: ["typescript", "typeorm", "nodejs", "express"]
---

{{< github repo="wiebe-vandendriessche/typeORM" showThumbnail=false >}}

Een bibliotheekscatalogusapplicatie die het gebruik van TypeORM voor object-relationele mapping demonstreert. Het systeem modelleert een klassiek bibliotheekdomein met boeken, artikels, auteurs, genres en itemlocaties.

Belangrijkste entiteiten en relaties:
- `BibItem` (basis), `Book` en `Article` als afgeleide types
- Eén-op-één tussen `BibItem` en `ItemLocation`
- Eén-op-veel tussen `Author` en `Book`
- Veel-op-veel tussen `Book` en `Genre`

De webinterface ondersteunt het doorzoeken van de catalogus op titel of auteur, filteren op genre en een beheerpagina voor het toevoegen en verwijderen van items. Bij het verwijderen van een auteur worden ook alle bijhorende boeken verwijderd via cascade-verwijdering.
