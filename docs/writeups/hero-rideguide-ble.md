---
title: Hero RideGuide BLE Reverse-engineering
date: 2026-06-25
tags: [ble, python, reverse-engineering]
description: Sniffing, mapping services, and controlling the device over BLE.
repo: https://github.com/Supernova70/hero-rideguide-re
outline: [2, 3]
---

# Hero RideGuide BLE Reverse-engineering

High-level notes and key findings from reverse-engineering the RideGuide app/device protocol.

::: info Scope
These are field notes pasted straight from my Obsidian vault. Obsidian callouts are
rewritten as VitePress containers (`::: tip` / `::: warning` / `::: danger`) and embeds
go in `docs/public/`.
:::

## Recon

Enumerating GATT services with `bleak` gave a clean map of the characteristics.

::: tip Quick win
The notify characteristic streams state every 200ms, so you rarely need to poll.
:::

::: warning Gotcha
The device drops the connection if you write to the control handle before subscribing to notifications.
:::

Related notes: *BLE Sniffing Setup* and *the GATT primer*.
