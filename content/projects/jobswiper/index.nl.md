---
title: "JobSwiper"
date: 2024-01-01
description: "Tinder-stijl job matching applicatie met microservices, een API gateway, JWT-authenticatie, ElasticSearch-aanbevelingen en een SAGA-patroon voor gedistribueerde transacties."
tags: ["python", "javascript", "java", "microservices", "docker", "elasticsearch", "rabbitmq"]
---

{{< github repo="wiebe-vandendriessche/jobswiper" showThumbnail=false >}}

JobSwiper is een Tinder-achtig jobmatchingplatform geïmplementeerd als een microservicesarchitectuur, georchestreerd met Docker Compose. Werkzoekenden en recruiters kunnen op elkaars profielen swipen; een wederzijdse swipe levert een match op.

Het systeem bestaat uit zes services:
- **API Gateway** (FastAPI): fungeert als reverse proxy, drievoudig load-balanced achter Nginx, met per-instantie Redis-caching, retry-strategieën met exponentiële backoff en een circuit breaker.
- **JWT Auth Service**: beheert gebruikersregistratie, login en tokenverificatie.
- **Profielbeheer**: CRUD-operaties voor profielen van werkzoekenden en recruiters, ondersteund door MySQL.
- **Jobenbeheer**: CRUD-operaties voor vacatures met publisher-events naar de aanbevelingsservice.
- **Matchingservice**: verwerkt swipe-acties via RabbitMQ en identificeert wederzijdse matches.
- **Aanbevelingsservice** (Java/ElasticSearch): verwerkt profiel- en jobupdates, voert ElasticSearch-queries uit om de beste matches te vinden en slaat resultaten op in MySQL.

Opmerkelijke patronen: SAGA voor gedistribueerde transacties, circuit breaker + retry voor fouttolerantie, event-gedreven communicatie via RabbitMQ.
