---
title: "JobSwiper"
date: 2024-01-01
description: "Tinder-style job matching microservices application with an API gateway, JWT auth, ElasticSearch recommendations, and a SAGA pattern for distributed transactions."
tags: ["python", "javascript", "java", "microservices", "docker", "elasticsearch", "rabbitmq"]
---

{{< github repo="wiebe-vandendriessche/jobswiper" showThumbnail=false >}}

JobSwiper is a Tinder-like job matching platform implemented as a microservices architecture orchestrated with Docker Compose. Job seekers and recruiters can swipe on each other's profiles; a mutual swipe creates a match.

The system consists of six services:
- **API Gateway** (FastAPI): acts as a reverse proxy, load-balanced threefold behind Nginx, with per-instance Redis caching, retry strategies with exponential backoff, and a circuit breaker.
- **JWT Auth Service**: handles user registration, login, and token verification.
- **Profile Management**: CRUD operations for job seeker and recruiter profiles, backed by MySQL.
- **Job Management**: CRUD operations for job postings with publisher events to the recommendation service.
- **Matching Service**: processes swipe actions from RabbitMQ and identifies mutual matches.
- **Recommendation Service** (Java/ElasticSearch): consumes profile and job updates, runs ElasticSearch queries to find best matches, and stores results in MySQL.

Notable patterns: SAGA for distributed transactions, circuit breaker + retry for fault tolerance, event-driven communication via RabbitMQ.
