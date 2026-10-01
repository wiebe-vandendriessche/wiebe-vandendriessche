---
title: "Bibliotheekcatalogus (TypeORM)"
date: 2023-09-10
description: "Een webapplicatie voor een bibliotheekcatalogus gebouwd met TypeORM, TypeScript en Express, met beheer van boeken, artikels en auteurs."
tags: ["typescript", "typeorm", "node.js", "express"]
---

{{< github repo="wiebe-vandendriessche/typeORM" showThumbnail=false >}}

Een project voor het vak Frameworks in het tweede jaar, waarin een bibliotheekcatalogus werd ge&iuml;mplementeerd met [TypeORM](https://typeorm.io/). Het project modelleert een relationeel domein met entiteiten zoals BibItem, Book, Article, Author, Genre en ItemLocation, inclusief overerving (Book en Article breiden BibItem uit) en verschillende soorten relaties (1-1, 1-n en n-n). Het toont praktisch ORM-ontwerp met cascaderende verwijderingen, relationele integriteit en gestructureerde domeinmodellering in een TypeScript-backend met een relationele database.

De applicatie biedt een REST API voor volledig beheer van de catalogus, met CRUD-operaties en zoekopdrachten gefilterd op auteur, genre en titel. Er zijn ook administratieve endpoints om data toe te voegen en te verwijderen, met validatie die referenti&euml;le consistentie garandeert, zoals het vereisen van bestaande auteurs en het automatisch cascaderen van verwijderingen naar gerelateerde boeken. Het project toont het praktische gebruik van ORM-abstracties voor het beheer van complexe relationele structuren.
