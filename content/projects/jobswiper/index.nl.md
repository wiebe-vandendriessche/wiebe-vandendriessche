---
title: "JobSwiper"
date: 2024-12-20
description: "Tinder-stijl job matching applicatie met microservices, een API gateway, JWT-authenticatie, ElasticSearch-aanbevelingen en een SAGA-patroon voor gedistribueerde transacties."
tags: ["python", "javascript", "java", "microservices", "docker", "elasticsearch", "rabbitmq"]
---

{{< github repo="wiebe-vandendriessche/jobswiper" showThumbnail=false >}}

Dit project is een jobmatchingplatform op basis van microservices, gebouwd voor het vak Systeemontwerp in mijn master. Het simuleert een schaalbaar rekruteringssysteem met services voor authenticatie, profielbeheer, jobbeheer, matching en aanbevelingen. De architectuur gebruikt [Docker Compose](https://docs.docker.com/compose/) voor orkestratie, met een API-gateway gebouwd in [FastAPI](https://fastapi.tiangolo.com/) en asynchrone communicatie via [RabbitMQ](https://www.rabbitmq.com/). De aanbevelingsengine gebruikt [Elasticsearch](https://www.elastic.co/elasticsearch/) om jobmatches te berekenen. Gedistribueerde workflows worden geco&ouml;rdineerd met een [Saga](https://microservices.io/patterns/data/saga.html)-patroon om consistentie tussen services te garanderen bij processen in meerdere stappen, zoals het aanmaken van jobs en betalingsflows.
