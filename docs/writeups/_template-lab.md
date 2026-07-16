---
title: "HTB Box Name"
date: 2026-07-08
tags: [htb, htb-very-easy]
platform: htb
description: "One-line summary of the box / technique."
outline: [2, 3]
---

# HTB `<Box Name>`

One-paragraph framing: what the box is and the high-level solve path.

## Recon

Nmap scan of the target.

```bash
nmap -sV -sC TARGET_IP
```

Findings: ports, services, versions worth noting.

## Enumeration

Service-specific digging — gobuster, anonymous FTP login, rsync listing, etc.

```bash
gobuster dir -u http://TARGET_IP -w /usr/share/seclists/Discovery/Web-Content/common.txt
```

## Exploitation

The actual exploit path, step by step.

## Flag

The retrieved flag / credential / outcome.

::: info Note
This is a template — copy it, fill it in. Keep sections in this order; drop any that don't apply. Difficulty goes in `tags` (e.g. `htb-very-easy`, `htb-easy`, `htb-medium`), not in a separate field.
:::
