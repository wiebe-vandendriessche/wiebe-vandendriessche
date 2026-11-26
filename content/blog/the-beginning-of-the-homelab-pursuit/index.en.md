---
title: "The Beginning of the Homelab Bug"
date: 2026-11-24
description: "The Beginning of the Homelab Bug"
categories: ["blog-post"]
draft: false
---

> **Homelabbing according to Reddit:**
>
> A hobby where you pay a ridiculous amount for second-hand hardware to self-host apps you could probably have used for free anyway. Bonus points for LEDs and perfectly managed cables.

I have been hooked on this hobby for about a year now. It all started when I joined my research group and was suddenly surrounded by Linux evangelists. Around the same time, a good friend of mine started turning his NAS into a full [Arr stack](https://trash-guides.info/).

The real tipping point came a little later. In the middle of the AI hype, one data breach after another surfaced, and I realised it was high time to switch to a proper password manager instead of reusing the same password everywhere.

## A dusty laptop

I rummaged through my closet and the penny dropped (or as we say in Belgium, the franc dropped). My old [2014 HP ProBook](https://support.hp.com/ee-en/product/product-specs/hp-probook-450-g2-notebook-pc/6943826) with an Intel Core i5-4210U was just sitting there gathering dust. No powerhouse, but more than enough to get started.

{{<figure 
src="probook.png" 
alt="HP ProBook"
 caption="Photo: [HP](https://support.hp.com/ee-en/product/product-specs/hp-probook-450-g2-notebook-pc/6943826)"
>}}

## The first apps

First app: [Vaultwarden](https://vaultwarden.com/), a lightweight, open-source password manager written in [Rust](https://rust-lang.org/) that works seamlessly with the official Bitwarden apps. Highly recommended: it is up and running in no time and uses the fewest resources of anything on my server. On top of that, it is also my most-used service.

{{<figure 
src="vaultwarden.svg" 
alt="Vaultwarden Icon"
 caption="Logo via [GitHub](https://github.com/dani-garcia/vaultwarden/blob/main/resources/vaultwarden-logo-auto.svg)"
 class="w-80 mx-auto"
>}}

And the ball started rolling. Next app: [Immich](https://immich.app/), an open-source alternative to Google Photos that runs entirely on your own server. The mobile app automatically backs up all my photos and videos in the background, complete with face recognition and smart search, without my pictures ending up in an external cloud.

{{<figure 
src="immich.svg" 
alt="Immich Icon"
 caption="Logo via [GitHub](https://github.com/immich-app/immich)"
 class="w-36 mx-auto"
>}}

## A bit of tinkering

But I soon noticed the ProBook hitting its limits. Time to get out the screwdriver and give the laptop an overhaul. I added extra DDR3L memory myself, so the machine now runs on 12 GB of RAM (handy for Immich's machine-learning containers). And I had not used that DVD drive in years anyway: out it went, making room for an HDD caddy with an old 1 TB drive for all my photos.

{{<figure 
src="featured.jpg" 
alt="Hardware upgrade of the HP ProBook"
 caption="RAM upgrade and installation of the HDD caddy"
>}}

With that extra storage and a bit more memory, this written-off laptop suddenly runs smoothly as a fully fledged home server, without me having to buy any new hardware. Even my family members now upload their photos to Immich.

Running everything on an old laptop has its advantages, by the way. It uses very little power, especially since the screen is always off. It also comes from a time when you could easily upgrade and replace parts yourself, as you saw above with the RAM and the DVD drive. And you can simply click the battery out. That is exactly what I did: a battery that stays plugged in day and night can swell over time, so it is a lot safer without one.

## Reachable from outside

One problem remained: how do I reach my services from outside? Proximus (my internet provider) gives me a dynamic IP address, which changes every now and then. A static public IP address is possible, but ridiculously expensive.

I looked at a few alternatives:

- **Dynamic DNS** via [DuckDNS](https://www.duckdns.org/): a free domain name that automatically follows your changing IP address. Still not the ideal solution: I would have to forward ports on my router myself, and Proximus sometimes puts fixed lines behind [CGNAT](https://en.wikipedia.org/wiki/Carrier-grade_NAT) too. Then you share your public IP address with other customers and port forwarding simply does not work.
- **[Tailscale](https://tailscale.com/)**: a private network based on [WireGuard](https://www.wireguard.com/) between all your devices, without opening any ports. Every device gets its own IP address inside your tailnet, and the devices connect directly to each other over an encrypted connection, even behind CGNAT.
- **[Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/)**: a small service on your server sets up an outbound connection to Cloudflare, so your services are publicly reachable through your own domain.

In the end it became a combination of the last two: Tailscale for private services such as Vaultwarden, and Cloudflare for public-facing services such as Immich.

{{<figure 
src="tailscale.svg" 
alt="Tailscale Logo"
 caption="Logo via [GitHub](https://github.com/tailscale/tailscale/blob/main/client/web/src/assets/icons/tailscale-logo.svg)"
 class="w-80 mx-auto"
>}}

{{<figure 
src="cloudflare.svg" 
alt="Cloudflare Logo"
 caption="Logo via [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Cloudflare_Logo.svg)"
 class="w-36 mx-auto"
>}}

Here I made good use of the free tier of [Cloudflare Zero Trust](https://developers.cloudflare.com/cloudflare-one/). With [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/) I built an extra security layer around my server: through an Access policy, only trusted email addresses can log in with their Google account, and that is the only way to reach Immich from the public internet. So my family can use it without installing Tailscale.

Behind all of this runs [Nginx Proxy Manager](https://nginxproxymanager.com/) as a reverse proxy. Both my private Tailscale services and my public Cloudflare tunnels arrive there, and Nginx Proxy Manager forwards each request to the right service.

{{<figure 
src="nginx-proxy-manager.svg" 
alt="Nginx Proxy Manager Logo"
 caption="Logo via [GitHub](https://github.com/NginxProxyManager/nginx-proxy-manager/blob/develop/docs/src/public/logo.svg)"
 class="w-36 mx-auto"
>}}

## Where it stands now

What started as a password manager on a forgotten laptop has gotten quite out of hand since. This diagram shows how everything fits together today. All traffic comes in through Cloudflare or Tailscale and then passes through Nginx Proxy Manager, which routes it to the right container based on the hostname. Only Immich and [OpenCloud](https://opencloud.eu/en) for my files are public, with [Keycloak](https://www.keycloak.org/) as single sign-on. Everything else stays private behind Tailscale: from an RSS reader and [n8n](https://n8n.io/) automations to [Frigate](https://frigate.video/) as the NVR for my Reolink cameras. All data lives on a separate disk, and the most important things also go to an off-site location as encrypted [restic](https://restic.net/) backups.

{{<figure 
src="homelab.drawio.png" 
alt="Diagram of my homelab"
 caption="My homelab today"
>}}

Not bad for a laptop that spent years gathering dust in a closet.
