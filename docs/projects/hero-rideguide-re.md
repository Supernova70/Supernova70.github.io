---
title: Hero RideGuide BLE Reverse-Engineering
date: 2026-06-25
tags: [bluetooth, ble, reverse-engineering, android, motorcycle]
description: Reverse-engineering the Bluetooth Low Energy protocol the Hero RideGuide app uses to draw turn-by-turn navigation arrows on a Hero Xtreme 125R's instrument cluster — from HCI snoop captures to sending my own packets and watching the arrows appear.
repo: https://github.com/Supernova70/hero-rideguide-re
outline: [2, 3]
---

# Hero RideGuide BLE Reverse-Engineering

## Overview

Hero ships an official app — **Hero RideGuide** (`com.customerapp.hero`) — that pushes
turn-by-turn navigation arrows onto the instrument cluster of Hero motorcycles over
Bluetooth. On my **Hero Xtreme 125R** the app is buggy and thin on information, so I set
out to reverse-engineer exactly how it talks to the bike, with the goal of building a
better alternative navigation app.

This writeup covers the full journey: capturing the Bluetooth traffic, decoding the
protocol from raw packet bytes, correcting a wrong first analysis, and finally sending my
own packets to the bike and **watching navigation arrows appear on the cluster** — proof
the protocol was fully understood.

::: info Scope & ethics
This is black-box protocol analysis of traffic between *my own* phone and *my own* bike,
done to build an interoperable app. No firmware was extracted or modified, and no
authentication was bypassed. Device identifiers (MAC, device name, username) are redacted
below.
:::

::: tip Result
**Protocol fully confirmed.** I can send a byte string over BLE and make the bike draw a
straight / left / right / U-turn / sharp-turn arrow on demand, with distance and ETA
fields populated.
:::

## Approach

The bike is the peripheral; the phone is the central. There's no public documentation, so
everything came from observing real traffic.

1. **Capture** — enabled Android's *Bluetooth HCI snoop log* (Developer Options),
   connected the RideGuide app to the bike, and rode a real commute so the app would emit
   a full range of navigation instructions. Pulled the resulting `.cfa` snoop logs off the
   phone.
2. **Analyse** — parsed the btsnoop records with Python/PowerShell scripts, isolated the
   ATT layer, and correlated the ASCII payloads against what the cluster displayed during
   the ride.
3. **Verify** — replayed hand-crafted packets to the bike with **nRF Connect** (no custom
   app needed yet) and confirmed each direction character by watching the cluster.

### Capture setup

```text
Android phone ──BLE──> Hero Xtreme 125R cluster
     │
     └─ HCI Snoop Log (Developer Options) → bt_hci_*.cfa
```

Three captures anchored the analysis: a stationary session, a ~22-minute commute
(8,095 packets — the workhorse), and a short ride for cross-checking.

## The mistake that taught me the most

My **first** analysis concluded the bike used **Classic Bluetooth (BR/EDR)** with a custom
**L2CAP** channel (CID `0x0016`). 
Re-reading the raw bytes on the cleaner commute capture showed the truth: it's **BLE
(Bluetooth Low Energy)** running entirely over **standard GATT/ATT** on CID `0x0004`. The
phantom "custom L2CAP channel" was a **parsing bug** in my analysis script misreading the
CID field of the btsnoop records.

::: warning Lesson
A confident analysis built on one noisy capture can be completely wrong. The fix was more
data (a second, cleaner capture) and reading the *actual wire bytes* instead of trusting
my own parser's summary. This single correction turned the project from "hard" (custom
L2CAP sockets) to "easy" (the standard Android `BluetoothGatt` API).
:::

## The confirmed protocol

### BLE connection

| Property | Value |
|----------|-------|
| Device name | `ADJS1_<redacted>` |
| Device MAC | `XX:XX:XX:XX:XX:XX` |
| Service UUID | `e837d9a2-9c49-4493-9547-8e6918a59ca8` |
| **Write characteristic** | `64aecb40-849a-44f1-934f-addc4b316423` — **Write No Response** |
| Notify characteristic | `b792a4bb-db87-436a-9066-db63c5fb3f00` |
| MTU | 1025 bytes negotiated |

All protocol data flows over a single custom GATT characteristic. The phone writes with
**ATT Write Command** (opcode `0x52`, fire-and-forget); the bike answers with **ATT
Notifications** (opcode `0x1B`) and **Indications** (opcode `0x1D`).

### Wire framing

Every application payload is wrapped in `0x0A` (newline) on both sides and sent as an ATT
Write Command:

```text
52 20 00  0A [payload bytes] 0A
│  ├──┤    └──── payload ────┘
│  handle (auto-assigned per connection)
└─ ATT Write Command opcode
```

In nRF Connect you paste only `0A [payload] 0A` — the app adds the `52 20 00` ATT header
itself. (Including `20 00` yourself → no arrow. Omitting it → arrow. That cost me an
evening.)

### Navigation packet format

```text
1[DIR][SPEED]106P[ANGLE]M[MODE]
```

| Field | Len | Example | Meaning |
|-------|-----|---------|---------|
| `1` | 1 | `1` | Start marker (always `1`) |
| `DIR` | 1 | `i` | Direction character (table below) |
| `SPEED` | 5 | `00030` | Speed × 0.1 = km/h → `00030` = 3.0 km/h |
| `106P` | 4 | `106P` | Fixed separator |
| `ANGLE` | 2 | `28` | Compass heading, degrees |
| `M` | 1 | `M` | Fixed separator |
| `MODE` | 3 | `000` | `000` normal, `020` U-turn/special |

**Example:** `1i00030106P28M000` → straight-ahead arrow, 3.0 km/h, heading 28°.

::: tip Format gotcha
The current app uses the `106P` separator. An **older** app version used `09A`
(`1J00700109A37M000`) — captures from different app versions disagree, so version the
capture along with the packet.
:::

### Direction characters

| Char | Hex | Arrow | Speed band | Mode |
|------|-----|-------|-----------|------|
| `i` / `I` | `69`/`49` | ↑ Straight (slow / fast) | 0–20 / 20+ | `000` |
| `j` / `J` | `6A`/`4A` | ← Left (slow / fast) | 0–20 / 20+ | `000` |
| `g` / `G` | `67`/`47` | → Right (slow / fast) | 0–20 / 20+ | `000` |
| `u` / `U` | `75`/`55` | ↩ U-turn (slow / fast) | 0–12 / 12+ | **`020`** |
| `p` | `70` | ↱ Sharp turn | 0–20 | `000` |
| `v` / `V` | `76`/`56` | ↖ / ↗ Bear left / right | any | `000` |
| `C` | `43` | ⟳ Recalculating | any | `000` |
| `B` | `42` | 📍 Waypoint | any | `000` |

::: warning
U-turns use `u` / `U` **with MODE `020`** — not the `x` / `X` I originally guessed from
the older capture.
:::

### Session handshake

Before nav packets, the phone sends a user-ID packet:

```text
0A [PREFIX]<USER> 0A        # e.g. 324<USER>
```

`<USER>` is the account name baked into the app; `PREFIX` is a 3-digit number that changes
every app session (`314`, `324`, `334`, `343`, `344` all seen). In practice the bike
accepts nav packets even when the prefix doesn't match — the ID mostly unlocks the session.
Nav packets go out every ~800 ms, the user ID every ~3 s.

## Building packets in code

The whole nav format collapses into one small function — this is the core the future app
is built around:

```python
def build_nav_packet(direction: str, speed_kmh: float,
                     angle: int, uturn: bool = False) -> bytes:
    """Build a Hero cluster navigation BLE payload."""
    speed_str = f"{int(speed_kmh * 10):05d}"   # 3.0 km/h -> "00030"
    angle_str = f"{angle:02d}"                  # heading  -> "28"
    mode_str  = "020" if uturn else "000"       # U-turns get mode 020
    nav = f"1{direction}{speed_str}106P{angle_str}M{mode_str}"
    return b"\x0A" + nav.encode("ascii") + b"\x0A"

build_nav_packet("i", 3.0,  28)          # straight, slow
build_nav_packet("G", 21.0, 19)          # right, fast
build_nav_packet("U", 50.0, 24, True)    # U-turn, fast
```

The returned `bytes` is written verbatim to characteristic `64aecb40`.

## Outcome

- **Fully documented GATT map** — service/characteristic UUIDs, ATT framing, and the
  bike's notification responses (it reports firmware `e59` back over a notification).
- **Confirmed nav protocol** — every direction character verified live by sending packets
  with nRF Connect and photographing the resulting arrow on the cluster.
- **A clear path to the real goal:** because it's standard BLE GATT, the replacement app
  can use the plain Android `BluetoothGatt` API — no root, no custom drivers. Planned
  stack: Kotlin + Android BLE, MapLibre GL, Valhalla routing (motorcycle profile), offline
  OSM tiles. GPS → speed/heading → `build_nav_packet()` → cluster.

## What's still open

- What the `z` / `Z` direction characters render on the cluster.
- Whether the bike streams telemetry (speed, RPM, fuel) back via notifications.
- Which packet ends navigation on arrival at the destination.
- What MODE `020` means beyond "U-turn".

## Lessons learned

- **Verify on clean data, then verify on the device.** The device is ground truth — an
  arrow on the cluster beats any amount of confident log-reading.
- **Read the raw bytes.** My worst wrong turn came from trusting a summary my own script
  produced instead of the wire itself.
- **The framing is as important as the payload.** Same bytes, wrong ATT header = nothing
  happens. The difference between "broken" and "working" was three bytes I wasn't supposed
  to send.
