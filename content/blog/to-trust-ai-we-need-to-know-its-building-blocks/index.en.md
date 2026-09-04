---
title: "To trust AI, we need to know its building blocks"
date: 2026-08-19
description: "To trust AI, we need to know its building blocks"
draft: false
---

> This opinion piece was originally published (in Dutch) on 19 August 2026 in **De Tijd**: [Om AI te vertrouwen moeten we de bouwstenen kennen](https://www.tijd.be/opinie/algemeen/om-ai-te-vertrouwen-moeten-we-de-bouwstenen-kennen/10682705.html).

{{< lead >}}
Just as we expect food producers to disclose what's in their products, we should also expect AI developers to be transparent about the building blocks on which their systems are based.
{{< /lead >}}

> **The essentials**
>
> - **The author**: Wiebe Vandendriessche is a PhD researcher at IDLab (Ghent University and imec). This opinion piece is based on his PhD in industrial sciences (computer science).
> - **The issue**: Behind every AI model lies a tangled supply chain of open-source software, datasets, tools, and cloud infrastructure. If a single link is compromised, it can affect every application that relies on it.
> - **The conclusion**: AI developers must be transparent about the building blocks on which their systems are based.

The public debate on AI focuses almost exclusively on AI models at the end of the process. Are the answers correct? Are they ethical? These are valid questions, but they stem from the misconception that the model is the only link that matters.

Imagine a bank using an AI system to detect fraud. The system appears reliable and helps identify suspicious transactions every day. But without anyone noticing, the dataset used to train the system is contaminated with erroneous examples. As a result, fraudsters manage to slip transactions through unnoticed, while the system continues to function normally on the surface. The risk lies not only in the model itself, but also in the many invisible building blocks that determine how it is created.

Behind every model lies a complex, often convoluted supply chain of open-source software, datasets, tools, and cloud infrastructure. Together, these determine how a model is built, trained, tested, and ultimately used. Think of it like a car: the reliability of the engine means little if the brakes, tires, or software aren't safe.

If a single link in that chain is compromised, it can affect all the applications that rely on it. Cybercriminals are increasingly exploiting this vulnerability and targeting the software components used by thousands of organizations at once. Such supply chain attacks are among the greatest threats to cybersecurity.

## AI Bill of Materials

The software industry has learned hard lessons from this in recent years. Companies are increasingly demanding a "bill of materials" for their software, a Software Bill of Materials, so that, in the event of a breach, they immediately know which components have been affected.

With AI, that transparency is often still lacking. Developers combine open-source models with dozens of software libraries and train them on datasets whose origins are often unclear. While this accelerates innovation, it also makes it difficult to know which components are being used, where they come from, and whether they are still reliable. Many organizations lack sufficient insight into the building blocks behind their AI systems.

That blind trust is irresponsible. Trust in AI begins with transparency across the entire underlying chain. Companies that integrate AI must require their suppliers to provide a comprehensive list of components, an AI equivalent of the Software Bill of Materials.

> Developers combine open-source models with dozens of software libraries and train them on datasets whose origins are often unclear.

The European legislature is already taking a first step with the AI Act: as of August 2, companies with high-risk AI systems must be able to submit technical documentation to the regulator. That documentation describes the system on paper but does not automatically trace the origin of every building block. The legislation needs to go a step further in this regard, so that every link in the chain becomes verifiable.

Fortunately, this transparency is already technically feasible. Our own research shows that an AI Bill of Materials can be generated automatically, without noticeably slowing down the development or training of AI systems. Transparency, therefore, does not have to become an additional administrative burden but can be largely built into the development process automatically.

That automatic nature is crucial. Transparency must not depend on what a supplier claims about its AI system. An AI Bill of Materials must be automatically generated and remain verifiable afterward. Cryptographic techniques such as digital signatures can be used to verify that the information is authentic and cannot be altered undetected afterward. Furthermore, these ingredient lists were tested in the study against potential manipulation attempts. Conclusion: they remained reliable, even under the pressure of attacks.

AI building blocks can indeed be transparent, as my doctoral research demonstrates. There is therefore no reason why that transparency should not become the norm.
