---
title: "Making a Motorcycle Draw My Arrows: Reverse-Engineering Hero RideGuide over BLE"
date: 2026-07-01
tags: [reverse-engineering, ble, bluetooth, android, motorcycle]
description: How I went from a buggy stock navigation app to sending my own Bluetooth packets and watching turn arrows appear on my Hero Xtreme 125R's cluster — including the wrong analysis that nearly sent me down a rabbit hole.
outline: [2, 3]
---

# Making a Motorcycle Draw My Arrows

My **Hero Xtreme 125R** can show turn-by-turn navigation on its instrument cluster. The
official **Hero RideGuide** app drives it over Bluetooth — and it's buggy and thin on
information. So I did the obvious thing: I decided to figure out how it talks to the bike
and build something better.

I went in a complete beginner at Bluetooth protocol analysis. Here's the story, including
the part where I got it confidently, completely wrong.

> The full technical breakdown — every UUID, the packet format, the direction-character
> table — lives on the [project page](/projects/hero-rideguide-re). This post is the
> journey.

## Step 1 — Capture the conversation

You can't reverse a protocol you can't see. Android has a hidden feature for exactly this:
**Bluetooth HCI snoop log**, buried in Developer Options. Turn it on, and the phone writes
every Bluetooth packet to a file.

So I enabled it, connected RideGuide to the bike, and **rode my actual commute** — 22
minutes through Vadodara traffic — so the app would emit a full menu of instructions: turns,
U-turns, roundabouts, recalculations. Then I pulled the `.cfa` snoop logs off the phone.

One ride = 8,095 Bluetooth packets to pull apart.

## Step 2 — Get it wrong

My first pass through the bytes said: **Classic Bluetooth** with a **custom L2CAP channel**.
I wrote a whole protocol document around that theory. It felt rigorous. It was wrong.

::: danger The trap
I trusted the *summary my own parser produced* instead of the *raw bytes on the wire*. My
script had a bug reading the channel-ID field, and it invented a "custom channel" that
didn't exist. A confident analysis built on one noisy capture can be 100% wrong.
:::

## Step 3 — Get it right

The fix was boring and correct: **more data and less trust.** I took a second, cleaner
capture and read the actual bytes by hand instead of through my buggy summary.

The truth was much simpler than my theory. It's plain **Bluetooth Low Energy** over
**standard GATT/ATT** — the same API every fitness tracker uses. The phone writes short
ASCII strings to one custom characteristic; the bike answers with notifications. No custom
channels, no exotic sockets.

That correction changed everything: instead of low-level L2CAP socket programming, the
future app can use the plain Android `BluetoothGatt` API. No root, no drivers.

::: tip What the packets say
The navigation instruction is literally a little text string:

```text
1i00030106P28M000
```

`i` = go straight, `00030` = 3.0 km/h, `28` = heading in degrees. Change the `i` to `j` and
it's a left turn. Once you see it, you can't unsee it.
:::

## Step 4 — The moment it worked

Reading bytes is theory. The bike is truth.

Using **nRF Connect** (a free BLE app — no custom code yet), I pasted one hand-crafted
packet and wrote it to the bike... and a **straight-ahead arrow lit up on the cluster.**
Then left. Then right. Then a U-turn. Every direction character I'd decoded, confirmed by
watching the dashboard.

There's a specific joy in typing hex into a phone and making a motorcycle's dashboard obey.

::: warning The three bytes that cost me an evening
The exact same payload did *nothing* when I included a `20 00` prefix, and worked perfectly
without it — nRF Connect adds the ATT header itself. In protocol work the *framing* matters
as much as the payload. "Broken" and "working" were three bytes I wasn't supposed to send.
:::

## What I took away

- **Read the raw bytes.** Your tooling's summary is a hypothesis, not evidence.
- **Verify on the real device.** An arrow on the cluster beats any amount of log-reading.
- **Being wrong early is cheap** if you keep capturing fresh data instead of defending the
  first theory.

Next up is the actual point of all this: a Kotlin Android app that reads GPS, computes
speed and heading, and streams the right packet to the cluster every ~800 ms — a nav app
that isn't buggy. More on that build soon.
