---
title: Hero RideGuide BLE Reverse-Engineering
date: 2026-06-25
tags: [bluetooth, reverse-engineering, python]
description: Sniffing, mapping BLE services/characteristics, and building a custom controller for the Hero RideGuide device.
repo: https://github.com/Supernova70/hero-rideguide-re
outline: [2, 3]
---

# Hero RideGuide BLE Reverse-Engineering

## Overview

Reverse-engineered the proprietary BLE protocol used by the Hero RideGuide cycling computer. The goal was to understand the device communication, map all GATT services and characteristics, and ultimately control the device from a custom Python script.

## Approach

1. **Passive sniffing** — captured BLE traffic between the official RideGuide app and the device using a second Bluetooth adapter in Wireshark.
2. **Service enumeration** — connected with `bleak` and walked the full GATT tree, documenting every UUID, property (read/write/notify), and value format.
3. **Protocol reconstruction** — correlated observed app traffic with the GATT map to identify which handles control speed, cadence, resistance, and device state.

## Outcome

- Fully documented GATT service map.
- Open-source Python controller that can read live sensor data and change resistance levels programmatically.
- Wrote up findings as a [blog post](/blog/).

## Lessons Learned

- BLE sniffing on Windows requires a compatible adapter and driver version — `btmon` on Linux was far more reliable.
- Many consumer BLE devices use manufacturer-specific UUIDs with no public documentation; reversing the protocol is largely about observing patterns.
