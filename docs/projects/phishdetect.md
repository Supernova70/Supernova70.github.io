---
title: PhishDetect — URL Phishing Scanner
date: 2026-05-10
tags: [phishing, python, ml]
description: A lightweight CLI tool that scores URLs for phishing likelihood using lexical features and a trained classifier.
repo: https://github.com/Supernova70/phishdetect
outline: [2, 3]
---

# PhishDetect — URL Phishing Scanner

## Overview

PhishDetect is a command-line tool that takes a URL and returns a phishing risk score (0–100). It extracts lexical features — domain age, character frequency, special characters, keyword presence — and feeds them into a trained classifier.

## Features

- **Zero-dependency inference** — the trained model is serialized with `joblib`; no external API calls at runtime.
- **Batch mode** — accepts a file of URLs and outputs a CSV report.
- **WHOIS fallback** — checks domain registration age as a strong phishing indicator.

## Tech Details

Feature extraction pipeline:

| Feature | Description |
|---|---|
| `url_length` | Total URL character count |
| `num_dots` | Dots in hostname (phishing domains often have many subdomains) |
| `has_ip` | Whether the host is a raw IP address |
| `domain_age_days` | Days since WHOIS registration |
| `keyword_score` | Presence of words like "login", "secure", "account" |

## Status

Working prototype. Accuracy ~93% on the test split of the PhishTank + legitimate URL dataset. Needs a larger, more diverse training set before production use.
