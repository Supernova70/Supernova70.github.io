---
title: HackTheBox Labs
description: HTB writeups — Starting Point tier and similar boxes.
---

# HackTheBox Labs

Seven Starting Point boxes documenting the most common foothold categories:
SQL injection, anonymous FTP credential exposure, SSH pivoting, unauth MongoDB, rsync misconfig, a Jenkins RCE, and Windows SMB with blank admin creds.

<Grid>
  <Card title="HTB Appointment" href="/writeups/htb-appointment" badge="Very Easy" date="Jun 24 2026">
    SQLi login bypass via Burp on a simple PHP auth flow.
  </Card>
  <Card title="HTB Crocodile" href="/writeups/htb-crocodile" badge="Very Easy" date="Jun 25 2026">
    Anonymous FTP loot → web login → admin creds → flag.
  </Card>
  <Card title="HTB Funnel" href="/writeups/htb-funnel" badge="Very Easy" date="Jul 4 2026">
    FTP password policy → SSH christine → local port-forward → Postgres → flag.
  </Card>
  <Card title="HTB Mongod" href="/writeups/htb-mongod" badge="Very Easy" date="Jun 23 2026">
    Unauthenticated MongoDB on 27017 → enumerate DB/collection → flag.
  </Card>
  <Card title="HTB Pennyworth" href="/writeups/htb-pennyworth" badge="Very Easy" date="Jul 13 2026">
    Jenkins weak login → Groovy Script Console reverse shell → already root → flag.
  </Card>
  <Card title="HTB Synced" href="/writeups/htb-synced" badge="Very Easy" date="Jun 22 2026">
    Rsync anonymous share → retrieve flag.txt.
  </Card>
  <Card title="HTB Tactics" href="/writeups/htb-tactics" badge="Very Easy" date="Jul 16 2026">
    Windows SMB → blank-password Administrator → C$ share / psexec.py shell → flag.
  </Card>
</Grid>
