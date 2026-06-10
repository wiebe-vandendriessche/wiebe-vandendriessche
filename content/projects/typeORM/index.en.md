---
title: "Library Catalog (TypeORM)"
date: 2023-09-10
description: "A library catalog web application built with TypeORM, TypeScript, and Express, featuring book, article, and author management."
tags: ["typescript", "typeorm", "nodejs", "express"]
---

{{< github repo="wiebe-vandendriessche/typeORM" showThumbnail=false >}}


A second-year frameworks course project implementing a library catalog system using [TypeORM](https://typeorm.io/). The project models a relational domain with entities such as BibItem, Book, Article, Author, Genre, and ItemLocation, including inheritance (Book and Article extending BibItem) and multiple relationship types (1-1, 1-n, and n-n). It demonstrates practical ORM design with cascading deletes, relational integrity, and structured domain modeling in a TypeScript backend using a relational database.

The application exposes a REST API for full catalog management, supporting CRUD operations and queries filtered by author, genre, and title. It includes administrative endpoints for inserting and deleting data, with validation ensuring referential consistency, such as requiring existing authors and automatically cascading deletions across related books. The project highlights practical use of ORM abstractions for managing complex relational structures.

