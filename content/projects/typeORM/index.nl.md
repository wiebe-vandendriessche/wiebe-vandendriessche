---
title: "Bibliotheekscatalogus (TypeORM)"
date: 2023-09-10
description: "Een webapplicatie voor een bibliotheekscatalogus gebouwd met TypeORM, TypeScript en Express, met beheer van boeken, artikels en auteurs."
tags: ["typescript", "typeorm", "nodejs", "express"]
---

{{< github repo="wiebe-vandendriessche/typeORM" showThumbnail=false >}}

Een tweedejaars frameworks project waarin een bibliotheekcatalogus werd ontwikkeld met [TypeORM](https://typeorm.io/). Het project modelleert een relationeel domein met entiteiten zoals BibItem, Book, Article, Author, Genre en ItemLocation, inclusief overerving (Book en Article die BibItem uitbreiden) en verschillende relaties (1-1, 1-n en n-n). Het toont praktisch gebruik van ORM-ontwerp met cascade deletes, relationele integriteit en gestructureerde datamodellering in een TypeScript backend met een relationele database.

De applicatie biedt een REST API voor het beheren van de catalogus met CRUD-operaties en zoekfunctionaliteit op auteur, genre en titel. Er zijn ook administratieve endpoints voor het toevoegen en verwijderen van data, met validatie die relationele consistentie garandeert, zoals het vereisen van bestaande auteurs en het automatisch cascaderen van verwijderingen. Het project demonstreert het gebruik van ORM abstracties voor complexe relationele data structuren.
