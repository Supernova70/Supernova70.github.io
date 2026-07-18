---
title: Self-Hosted Home Infrastructure Server
date: 2026-07-19
tags: [homelab, self-hosting, docker, linux, networking]
description: Turning a spare machine into a full home server — media automation with the Servarr stack, network-wide ad blocking with Pi-hole, photo backup, a Minecraft server, and a growing set of self-hosted security labs.
repo: https://github.com/Supernova70/home-server
outline: [2, 3]
---

# Self-Hosted Home Infrastructure Server

## Overview

This started as "I want Plex on my TV" and slowly turned into a machine that runs half my
digital life. It's a home server built on **Ubuntu Server 24.04** with **CasaOS** on top,
hosting everything as Docker containers: a fully automated media pipeline, network-wide ad
blocking, photo backup, a Minecraft server for friends, and vulnerable-by-design web apps
I use as hacking practice targets.

The repo documents the whole build — what I picked, why I picked it, and the stuff that
broke along the way.

## The stack at a glance

<svg viewBox="0 0 780 500" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Home server architecture: internet to router to Ubuntu server running eight Docker services, serving all home devices" style="max-width:780px;width:100%;height:auto;font-family:Virgil,'Segoe Print','Comic Sans MS',cursive;">
  <defs>
    <marker id="hs-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 1 L 9 5 L 0 9" fill="none" style="stroke:var(--vp-c-text-2)" stroke-width="1.6" stroke-linecap="round"/>
    </marker>
  </defs>
  <ellipse cx="390" cy="42" rx="80" ry="28" style="fill:var(--vp-c-bg-soft);stroke:var(--vp-c-text-2)" stroke-width="1.7" transform="rotate(-1 390 42)"/>
  <text x="390" y="48" text-anchor="middle" font-size="15" style="fill:var(--vp-c-text-1)">internet</text>
  <path d="M390,72 C388,84 392,92 390,104" fill="none" style="stroke:var(--vp-c-text-2)" stroke-width="1.7" stroke-linecap="round" marker-end="url(#hs-arrow)"/>
  <g transform="rotate(-0.7 390 130)">
    <rect x="318" y="108" width="144" height="44" rx="7" style="fill:var(--vp-c-bg-soft);stroke:var(--vp-c-text-1)" stroke-width="1.7"/>
    <text x="390" y="136" text-anchor="middle" font-size="15" style="fill:var(--vp-c-text-1)">router</text>
  </g>
  <path d="M390,152 C391,160 389,168 390,176" fill="none" style="stroke:var(--vp-c-text-2)" stroke-width="1.7" stroke-linecap="round" marker-end="url(#hs-arrow)"/>
  <g transform="rotate(0.3 390 290)">
    <rect x="58" y="178" width="664" height="224" rx="10" style="fill:var(--vp-c-bg-soft);stroke:var(--vp-c-text-1)" stroke-width="1.9"/>
    <text x="80" y="206" font-size="15" style="fill:var(--vp-c-text-1)">home server — ubuntu 24.04 + casaos</text>
    <text x="700" y="206" text-anchor="end" font-size="12.5" style="fill:var(--vp-c-text-3)">everything in docker</text>
  </g>
  <text x="80" y="230" font-size="11.5" style="fill:var(--vp-c-text-3)">media pipeline →</text>
  <g transform="rotate(-0.6 153 264)">
    <rect x="80" y="236" width="146" height="56" rx="6" style="fill:var(--vp-c-bg);stroke:var(--vp-c-brand-1)" stroke-width="1.6"/>
    <text x="153" y="260" text-anchor="middle" font-size="14" style="fill:var(--vp-c-text-1)">radarr</text>
    <text x="153" y="278" text-anchor="middle" font-size="11.5" style="fill:var(--vp-c-text-3)">movie automation</text>
  </g>
  <path d="M228,264 L238,264" style="stroke:var(--vp-c-text-3)" stroke-width="1.5" marker-end="url(#hs-arrow)"/>
  <g transform="rotate(0.5 313 264)">
    <rect x="240" y="236" width="146" height="56" rx="6" style="fill:var(--vp-c-bg);stroke:var(--vp-c-brand-1)" stroke-width="1.6"/>
    <text x="313" y="260" text-anchor="middle" font-size="14" style="fill:var(--vp-c-text-1)">prowlarr</text>
    <text x="313" y="278" text-anchor="middle" font-size="11.5" style="fill:var(--vp-c-text-3)">indexer search</text>
  </g>
  <path d="M388,264 L398,264" style="stroke:var(--vp-c-text-3)" stroke-width="1.5" marker-end="url(#hs-arrow)"/>
  <g transform="rotate(-0.4 473 264)">
    <rect x="400" y="236" width="146" height="56" rx="6" style="fill:var(--vp-c-bg);stroke:var(--vp-c-brand-1)" stroke-width="1.6"/>
    <text x="473" y="260" text-anchor="middle" font-size="14" style="fill:var(--vp-c-text-1)">qbittorrent</text>
    <text x="473" y="278" text-anchor="middle" font-size="11.5" style="fill:var(--vp-c-text-3)">downloads</text>
  </g>
  <path d="M548,264 L558,264" style="stroke:var(--vp-c-text-3)" stroke-width="1.5" marker-end="url(#hs-arrow)"/>
  <g transform="rotate(0.6 633 264)">
    <rect x="560" y="236" width="146" height="56" rx="6" style="fill:var(--vp-c-bg);stroke:#e8590c" stroke-width="1.6"/>
    <text x="633" y="260" text-anchor="middle" font-size="14" style="fill:var(--vp-c-text-1)">plex</text>
    <text x="633" y="278" text-anchor="middle" font-size="11.5" style="fill:var(--vp-c-text-3)">media streaming</text>
  </g>
  <g transform="rotate(0.5 153 342)">
    <rect x="80" y="314" width="146" height="56" rx="6" style="fill:var(--vp-c-bg);stroke:#e03131" stroke-width="1.6"/>
    <text x="153" y="338" text-anchor="middle" font-size="14" style="fill:var(--vp-c-text-1)">pi-hole</text>
    <text x="153" y="356" text-anchor="middle" font-size="11.5" style="fill:var(--vp-c-text-3)">network dns · ad-block</text>
  </g>
  <g transform="rotate(-0.5 313 342)">
    <rect x="240" y="314" width="146" height="56" rx="6" style="fill:var(--vp-c-bg);stroke:#1c7ed6" stroke-width="1.6"/>
    <text x="313" y="338" text-anchor="middle" font-size="14" style="fill:var(--vp-c-text-1)">photoprism</text>
    <text x="313" y="356" text-anchor="middle" font-size="11.5" style="fill:var(--vp-c-text-3)">photo backup</text>
  </g>
  <g transform="rotate(0.4 473 342)">
    <rect x="400" y="314" width="146" height="56" rx="6" style="fill:var(--vp-c-bg);stroke:#2f9e44" stroke-width="1.6"/>
    <text x="473" y="338" text-anchor="middle" font-size="14" style="fill:var(--vp-c-text-1)">crafty</text>
    <text x="473" y="356" text-anchor="middle" font-size="11.5" style="fill:var(--vp-c-text-3)">minecraft server</text>
  </g>
  <g transform="rotate(-0.6 633 342)">
    <rect x="560" y="314" width="146" height="56" rx="6" style="fill:var(--vp-c-bg);stroke:#9c36b5" stroke-width="1.6"/>
    <text x="633" y="338" text-anchor="middle" font-size="14" style="fill:var(--vp-c-text-1)">juice shop</text>
    <text x="633" y="356" text-anchor="middle" font-size="11.5" style="fill:var(--vp-c-text-3)">security lab</text>
  </g>
  <path d="M390,402 C389,412 391,420 390,430" fill="none" style="stroke:var(--vp-c-text-2)" stroke-width="1.7" stroke-linecap="round" marker-end="url(#hs-arrow)"/>
  <g transform="rotate(-0.5 390 458)">
    <rect x="225" y="434" width="330" height="48" rx="7" style="fill:var(--vp-c-bg-soft);stroke:var(--vp-c-text-1)" stroke-width="1.7"/>
    <text x="390" y="464" text-anchor="middle" font-size="14" style="fill:var(--vp-c-text-1)">phones · tv · laptops · consoles</text>
  </g>
</svg>

## Why Ubuntu Server + CasaOS

I looked at the usual suspects (Proxmox, TrueNAS, plain Debian) and landed on
**Ubuntu Server 24.04** for a boring reason: it's stable, it's secure, and it just works.
When the server is running your DNS and your media, boring is a feature.

On top of that sits **[CasaOS](https://casaos.io/)** — a lightweight dashboard that gives
you a clean web UI and one-click Docker app installs. One command and you're done:

```bash
wget -qO- https://get.casaos.io | sudo bash
```

I still drop to the terminal for anything non-trivial, but for day-to-day "is everything
up?" checks, having a dashboard beats SSH-ing in every time.

## The media pipeline

This is the part I'm most happy with. I don't manually download anything anymore — I add
a movie to a list, and some time later it shows up in Plex, properly named and sorted.

<svg viewBox="0 0 828 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Media pipeline: you add a movie, Radarr manages it, Prowlarr searches indexers, qBittorrent downloads, Radarr sorts the file, Plex streams it" style="max-width:828px;width:100%;height:auto;font-family:Virgil,'Segoe Print','Comic Sans MS',cursive;">
  <defs>
    <marker id="mp-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 1 L 9 5 L 0 9" fill="none" style="stroke:var(--vp-c-text-2)" stroke-width="1.6" stroke-linecap="round"/>
    </marker>
  </defs>
  <g transform="rotate(-0.7 90 80)">
    <rect x="24" y="52" width="132" height="56" rx="6" style="fill:var(--vp-c-bg-soft);stroke:var(--vp-c-text-2)" stroke-width="1.6"/>
    <text x="90" y="76" text-anchor="middle" font-size="14" style="fill:var(--vp-c-text-1)">you</text>
    <text x="90" y="94" text-anchor="middle" font-size="11.5" style="fill:var(--vp-c-text-3)">"i want this movie"</text>
  </g>
  <path d="M158,80 C166,78 176,82 184,80" fill="none" style="stroke:var(--vp-c-text-2)" stroke-width="1.6" stroke-linecap="round" marker-end="url(#mp-arrow)"/>
  <g transform="rotate(0.6 252 80)">
    <rect x="186" y="52" width="132" height="56" rx="6" style="fill:var(--vp-c-bg);stroke:var(--vp-c-brand-1)" stroke-width="1.6"/>
    <text x="252" y="76" text-anchor="middle" font-size="14" style="fill:var(--vp-c-text-1)">radarr</text>
    <text x="252" y="94" text-anchor="middle" font-size="11.5" style="fill:var(--vp-c-text-3)">watches · picks quality</text>
  </g>
  <path d="M320,80 C328,82 338,78 346,80" fill="none" style="stroke:var(--vp-c-text-2)" stroke-width="1.6" stroke-linecap="round" marker-end="url(#mp-arrow)"/>
  <g transform="rotate(-0.5 414 80)">
    <rect x="348" y="52" width="132" height="56" rx="6" style="fill:var(--vp-c-bg);stroke:var(--vp-c-brand-1)" stroke-width="1.6"/>
    <text x="414" y="76" text-anchor="middle" font-size="14" style="fill:var(--vp-c-text-1)">prowlarr</text>
    <text x="414" y="94" text-anchor="middle" font-size="11.5" style="fill:var(--vp-c-text-3)">searches indexers</text>
  </g>
  <path d="M482,80 C490,78 500,82 508,80" fill="none" style="stroke:var(--vp-c-text-2)" stroke-width="1.6" stroke-linecap="round" marker-end="url(#mp-arrow)"/>
  <g transform="rotate(0.5 576 80)">
    <rect x="510" y="52" width="132" height="56" rx="6" style="fill:var(--vp-c-bg);stroke:var(--vp-c-brand-1)" stroke-width="1.6"/>
    <text x="576" y="76" text-anchor="middle" font-size="14" style="fill:var(--vp-c-text-1)">qbittorrent</text>
    <text x="576" y="94" text-anchor="middle" font-size="11.5" style="fill:var(--vp-c-text-3)">downloads it</text>
  </g>
  <path d="M644,80 C652,82 662,78 670,80" fill="none" style="stroke:var(--vp-c-text-2)" stroke-width="1.6" stroke-linecap="round" marker-end="url(#mp-arrow)"/>
  <g transform="rotate(-0.6 738 80)">
    <rect x="672" y="52" width="132" height="56" rx="6" style="fill:var(--vp-c-bg);stroke:#e8590c" stroke-width="1.6"/>
    <text x="738" y="76" text-anchor="middle" font-size="14" style="fill:var(--vp-c-text-1)">plex</text>
    <text x="738" y="94" text-anchor="middle" font-size="11.5" style="fill:var(--vp-c-text-3)">streams anywhere</text>
  </g>
  <path d="M570,112 C510,168 320,168 258,114" fill="none" style="stroke:var(--vp-c-text-3)" stroke-width="1.5" stroke-dasharray="5 4" stroke-linecap="round" marker-end="url(#mp-arrow)"/>
  <text x="414" y="166" text-anchor="middle" font-size="12" style="fill:var(--vp-c-text-3)">radarr renames + sorts it into the library</text>
</svg>

- **[Radarr](https://radarr.video/)** is the brain — it monitors RSS feeds for movies,
  talks to the indexer and the download client, renames everything, and will even swap a
  file out automatically when a better-quality release appears.
- **[Prowlarr](https://prowlarr.com/)** handles indexing so I configure my sources once
  instead of once-per-app.
- **[qBittorrent](https://www.qbittorrent.org/)** does the downloading. No deep reason —
  it's the client I've used for years and I trust it.
- **[Plex](https://www.plex.tv/)** is the front-end. Great UI, works on everything I own.
  (**Jellyfin** is the FOSS alternative if you'd rather avoid Plex's account model.)

The [Servarr wiki](https://wiki.servarr.com/) was my map for wiring all of this together.

::: tip Lessons from running it
Two things I learned the slightly annoying way:

- **ISPs notice torrent traffic.** Binding qBittorrent and Prowlarr to a proxy solved
  the throttling issues I was seeing.
- **Usenet is genuinely better** than torrents for this — faster, no seeding, no ISP
  drama. [r/usenet](https://www.reddit.com/r/usenet/) is the place to start if you're
  curious.
:::

Right now the pipeline only handles movies — books (Readarr) are next on the list.

## Network-wide ad blocking

**[Pi-hole](https://pi-hole.net/)** runs as the DNS server for the whole network, which
means every device — phones, the TV, guests' laptops — gets ad blocking without
installing anything. Ads in mobile apps and smart-TV interfaces just quietly disappear.

The default blocklists are okay, but the real improvement came from adding curated lists
from **[Firebog](https://firebog.net/)** and
**[hagezi/dns-blocklists](https://github.com/hagezi/dns-blocklists)**. The dashboard
showing "X% of your DNS queries were blocked" is weirdly satisfying to check.

## Photo backup

**[PhotoPrism](https://www.photoprism.app/)** handles photo backup — phones sync to the
server instead of paying for cloud storage tiers forever.

Honest note: if your hardware has the specs for it, **[Immich](https://immich.app/)** is
the better pick today — nicer UI, more features, and its mobile app feels closest to the
Google Photos experience. PhotoPrism was the right fit for this machine.

## Minecraft server

**[Crafty](https://github.com/RMDC-Crafty/crafty)** runs a Minecraft server in the
background with a web panel for administration — start/stop, backups, console access, all
from the browser.

This one fought back. The CasaOS one-click install had problems with port mapping and
storage mounts, so I ended up building and importing the Docker container manually. Not
elegant, but it's been stable since, and I got a much better understanding of how CasaOS
wraps Docker out of it.

## Security labs

Since I'm learning offensive security, the server doubles as a practice range. The first
target deployed is **[OWASP Juice Shop](https://owasp.org/www-project-juice-shop/)** — a
deliberately vulnerable web app that covers the entire OWASP Top Ten. Having it on my own
network means I can attack it as aggressively as I want, legally, at any hour.

The plan is to grow this into a proper lab segment with more vulnerable machines — the
same kind of targets as HTB/THM boxes, but self-hosted.

## What's next

- **Readarr** to extend the media pipeline to books
- More vulnerable containers for the security lab (DVWA, VulnHub imports)
- Proper network segmentation so the lab targets can't see the rest of the LAN
- Monitoring — uptime and disk alerts before things fail, not after

## Takeaways

- **Start with one service.** Everything here was added one container at a time; the
  stack looks big only in hindsight.
- **Docker makes experiments cheap.** Every problem above was contained to one container
  — nothing ever took the whole server down.
- **Self-hosting teaches networking for free.** DNS, port mapping, proxies, volume
  mounts — I learned more about how networks actually behave from running this box than
  from any course.
