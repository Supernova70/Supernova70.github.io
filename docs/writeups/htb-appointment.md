---
title: "HTB Appointment"
date: 2026-06-24
tags: [htb, very-easy, linux, sqli, burp]
platform: htb
description: "Single-port Apache box; SQLi login bypass over Burp Suite."
outline: [2, 3]
---

# HTB Appointment

Very Easy Starting Point box. Only port 80 open — a PHP login form vulnerable to SQL injection. Bypass auth with a manual payload in Burp Suite and grab the flag from the post-login page.

## Recon

```bash
nmap -sV 10.129.20.245
```

```
PORT   STATE SERVICE VERSION
80/tcp open  http    Apache httpd 2.4.38 ((Debian))
```

Single port — Apache on Debian, nothing else to chase.

## Enumeration

Browse to `http://10.129.20.245` — a standard login form (username + password). HTB's lab hints flag this as a SQL injection target, so skip directory brute-forcing and go straight to auth bypass.

## Exploitation

Intercept the login POST in Burp Suite. Replace the `username` field with a classic auth-bypass payload:

```
admin' OR '1'='1
```

Leave the password field empty (or any value). Forward the request — the backend runs something like:

```sql
SELECT * FROM users WHERE username='admin' OR '1'='1' AND password='...'
```

`'1'='1'` is always true, so the WHERE clause matches every row and the app logs us in as the first user.

## Flag

After the bypass, the dashboard renders the flag — submit it on the HTB Starting Point tile and the box is done.
