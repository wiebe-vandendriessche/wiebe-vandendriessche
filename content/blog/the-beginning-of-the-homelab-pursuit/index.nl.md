---
title: "Het begin van de homelab microbe"
date: 2026-11-24
description: "Het begin van de homelab microbe"
categories: ["blog-post"]
draft: false
---

> **Homelabbing volgens Reddit:**
>
> Een hobby waarbij je belachelijk veel betaalt voor 2dehands hardware om apps te self-hosten die je waarschijnlijk ook gewoon gratis kon gebruiken. Bonuspunten voor LEDs en perfect weggewerkte kabels.

Ik heb me nu al ongeveer een jaar vastgebeten in deze hobby. Het begon allemaal toen ik in mijn onderzoeksgroep terechtkwam en plots omringd werd door Linux-evangelisten. Rond diezelfde tijd begon een goede vriend van me zijn NAS om te bouwen tot een volledige [Arr-stack](https://trash-guides.info/). 

De echte doorslag gebeurde iets later. Midden in de AI-hype dook het ene datalek na het andere op, en besefte ik dat het echt tijd werd om over te stappen op een degelijke wachtwoordmanager, in plaats van overal maar hetzelfde wachtwoord te hergebruiken.

## Een stoffige laptop

Ik rommelde wat in mijn kast en toen viel mijn frank (zoals we in Belgi&euml; zeggen). Mijn oude [HP ProBook uit 2014](https://support.hp.com/ee-en/product/product-specs/hp-probook-450-g2-notebook-pc/6943826) met een Intel Core i5-4210U lag daar gewoon stof te verzamelen. Geen krachtpatser, maar meer dan genoeg om mee te starten.

{{<figure 
src="probook.png" 
alt="HP ProBook"
 caption="Foto: [HP](https://support.hp.com/ee-en/product/product-specs/hp-probook-450-g2-notebook-pc/6943826)"
>}}

## De eerste apps

Eerste app: [Vaultwarden](https://vaultwarden.com/), een lichtgewicht, open-source wachtwoordmanager in [Rust](https://rust-lang.org/) die naadloos samenwerkt met de offici&euml;le Bitwarden-apps. Een absolute aanrader: hij staat in een mum van tijd live en slokt de minste resources op van heel mijn server. Daarbovenop is het ook nog eens mijn meest gebruikte service.

{{<figure 
src="vaultwarden.svg" 
alt="Vaultwarden Icon"
 caption="Logo via [GitHub](https://github.com/dani-garcia/vaultwarden/blob/main/resources/vaultwarden-logo-auto.svg)"
 class="w-80 mx-auto"
>}}

En de bal begon te rollen. Volgende app: [Immich](https://immich.app/), een open-source alternatief voor Google Photos dat je volledig op je eigen server draait. Via de mobiele app worden al mijn foto's en video's automatisch op de achtergrond geback-upt, compleet met gezichtsherkenning en slimme zoekfuncties zonder dat mijn beelden op een externe cloud belanden.

{{<figure 
src="immich.svg" 
alt="Immich Icon"
 caption="Logo via [GitHub](https://github.com/immich-app/immich)"
 class="w-36 mx-auto"
>}}

## Even sleutelen

Alleen merkte ik al snel dat de ProBook hier tegen zijn limieten aanliep. Tijd dus om de schroevendraaier boven te halen en de laptop onder handen te nemen. Ik prikte er zelf extra DDR3L-geheugen bij zodat de machine nu op 12 GB RAM draait (handig voor Immichs machine-learning containers). En die dvd-speler gebruikte ik toch al jaren niet meer: die vloog eruit om plaats te maken voor een HDD-caddy met een oude schijf van 1 TB voor al mijn foto's.

{{<figure 
src="featured.jpg" 
alt="Hardware upgrade van de HP ProBook"
 caption="RAM-uitbreiding en installatie van de HDD-caddy"
>}}

Met die extra opslag en wat meer werkgeheugen draait deze afgeschreven laptop plots vlot mee als volwaardige thuisserver, zonder dat ik er nieuwe hardware voor moest kopen. Zelfs mijn familieleden uploaden nu hun foto's naar Immich.

Een oude laptop als server heeft trouwens ook zijn voordelen. Hij verbruikt zeer weinig stroom, zeker omdat het scherm altijd uit staat. Hij komt ook nog uit de tijd dat je zelf makkelijk onderdelen kon upgraden en vervangen, zoals je hierboven al zag met het RAM-geheugen en de dvd-speler. En de batterij klik je er gewoon uit. Dat heb ik dan ook gedaan: een batterij die dag en nacht aan de lader hangt, kan na verloop van tijd opzwellen, dus zonder is het een pak veiliger.

## Van buitenaf bereikbaar

Bleef nog een probleem over: hoe geraak ik van buitenaf aan mijn services? Proximus (mijn internetprovider) geeft mij een dynamisch IP-adres, dat dus af en toe verandert. Een vast publiek IP-adres kan wel, maar dat is belachelijk duur.

Ik bekeek een paar alternatieven:

- **Dynamic DNS** via [DuckDNS](https://www.duckdns.org/): een gratis domeinnaam die automatisch je wisselende IP-adres volgt. Toch niet de ideale oplossing: ik zou zelf poorten moeten openzetten op mijn router, en Proximus zet ook vaste lijnen soms achter [CGNAT](https://en.wikipedia.org/wiki/Carrier-grade_NAT). Dan deel je je publieke IP-adres met andere klanten en lukt port forwarding gewoon niet.
- **[Tailscale](https://tailscale.com/)**: een privaat netwerk op basis van [WireGuard](https://www.wireguard.com/) tussen al je toestellen, zonder poorten open te zetten. Elk toestel krijgt een eigen IP-adres binnen je tailnet, en de toestellen maken rechtstreeks een versleutelde verbinding met elkaar, ook achter CGNAT.
- **[Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/)**: een kleine service op je server legt een uitgaande verbinding naar Cloudflare, zodat je services publiek bereikbaar zijn via je eigen domein.

Uiteindelijk werd het een combinatie van de laatste twee: Tailscale voor private services zoals Vaultwarden, en Cloudflare voor publieke services zoals Immich.

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

Daarbij maakte ik handig gebruik van de gratis tier van [Cloudflare Zero Trust](https://developers.cloudflare.com/cloudflare-one/). Met [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/) bouwde ik zo een extra beveiligingslaag rond mijn server: via een Access policy kunnen enkel vertrouwde e-mailadressen inloggen met hun Google-account, en alleen op die manier is Immich vanaf het publieke internet bereikbaar. Mijn familie kan er dus gewoon op, zonder Tailscale te installeren.

Achter dit alles draait [Nginx Proxy Manager](https://nginxproxymanager.com/) als reverse proxy. Zowel mijn private Tailscale-services als mijn publieke Cloudflare-tunnels komen daar binnen, en Nginx Proxy Manager stuurt elk verzoek door naar de juiste service.

{{<figure 
src="nginx-proxy-manager.svg" 
alt="Nginx Proxy Manager Logo"
 caption="Logo via [GitHub](https://github.com/NginxProxyManager/nginx-proxy-manager/blob/develop/docs/src/public/logo.svg)"
 class="w-36 mx-auto"
>}}

## Waar het nu staat

Wat begon met een wachtwoordmanager op een vergeten laptop, is ondertussen flink uit de hand gelopen. Op dit schema zie je hoe alles vandaag in elkaar zit. Al het verkeer komt binnen via Cloudflare of Tailscale en passeert dan langs Nginx Proxy Manager, die het op basis van de hostname naar de juiste container stuurt. Publiek staan enkel Immich en [OpenCloud](https://opencloud.eu/en) voor mijn bestanden, met [Keycloak](https://www.keycloak.org/) als single sign-on. Al de rest blijft privaat achter Tailscale: van een RSS-lezer en [n8n](https://n8n.io/)-automatisaties tot [Frigate](https://frigate.video/) als NVR voor mijn Reolink-camera's. Alle data staat op een aparte schijf, en het belangrijkste gaat als versleutelde [restic](https://restic.net/)-backups ook naar een off-site locatie.

{{<figure 
src="homelab.drawio.png" 
alt="Schema van mijn homelab"
 caption="Mijn homelab vandaag"
>}}

Niet slecht voor een laptop die jarenlang stof lag te verzamelen in de kast.
