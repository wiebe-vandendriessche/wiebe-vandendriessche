---
title: "JobSwiper"
date: 2024-12-20
description: "Tinder-style job matching microservices application with an API gateway, JWT auth, ElasticSearch recommendations, and a SAGA pattern for distributed transactions."
tags: ["python", "javascript", "java", "microservices", "docker", "elasticsearch", "rabbitmq"]
---

{{< github repo="wiebe-vandendriessche/jobswiper" showThumbnail=false >}}

This project is a microservices-based job matching platform built as part of the System Design course in my master’s program. It simulates a scalable recruitment system with services for authentication, profile management, job management, matching, and recommendations. The architecture uses [Docker Compose](https://docs.docker.com/compose/) for orchestration, with an API Gateway built in [FastAPI](https://fastapi.tiangolo.com/) and asynchronous communication via [RabbitMQ](https://www.rabbitmq.com/). The recommendation engine uses [Elasticsearch](https://www.elastic.co/elasticsearch/) to compute job matching. Distributed workflows are coordinated using a [Saga](https://microservices.io/patterns/data/saga.html) pattern to ensure consistency across services in multi-step operations such as job creation and payment flows. 



