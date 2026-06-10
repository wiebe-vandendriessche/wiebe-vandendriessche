---
title: "JobSwiper"
date: 2024-12-20
description: "Tinder-stijl job matching applicatie met microservices, een API gateway, JWT-authenticatie, ElasticSearch-aanbevelingen en een SAGA-patroon voor gedistribueerde transacties."
tags: ["python", "javascript", "java", "microservices", "docker", "elasticsearch", "rabbitmq"]
---

{{< github repo="wiebe-vandendriessche/jobswiper" showThumbnail=false >}}

Dit project is een microservices-gebaseerd job matching platform ontwikkeld als onderdeel van het System Design vak tijdens mijn master. Het simuleert een schaalbaar recruitment systeem met services voor authenticatie, profielbeheer, jobbeheer, matching en aanbevelingen. De architectuur draait op [Docker Compose](https://docs.docker.com/compose/), met een API Gateway gebouwd in [FastAPI](https://fastapi.tiangolo.com/) en asynchrone communicatie via [RabbitMQ](https://www.rabbitmq.com/). De recommendation service gebruikt [Elasticsearch](https://www.elastic.co/elasticsearch/) om job matches te berekenen. Gedistribueerde workflows worden gecoördineerd via een [Saga](https://microservices.io/patterns/data/saga.html) pattern om consistentie te garanderen bij multi-step processen zoals job creatie en betalingsflows.
