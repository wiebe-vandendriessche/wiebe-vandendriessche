---
title: "Library Catalog (TypeORM)"
date: 2023-01-01
description: "A library catalog web application built with TypeORM, TypeScript, and Express, featuring book, article, and author management."
tags: ["typescript", "typeorm", "nodejs", "express"]
---

{{< github repo="wiebe-vandendriessche/typeORM" showThumbnail=false >}}

A library catalog application that demonstrates the use of TypeORM for object-relational mapping. The system models a classic library domain with books, articles, authors, genres, and item locations.

Key entities and relationships:
- `BibItem` (base), `Book` and `Article` as derived types
- One-to-one between `BibItem` and `ItemLocation`
- One-to-many between `Author` and `Book`
- Many-to-many between `Book` and `Genre`

The web interface supports searching the catalog by title or author, filtering by genre, and an admin panel for adding and removing items. Cascade deletion is implemented for author removal.
