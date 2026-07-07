---
title: PicoCTF — Binary Exploitation Notes
date: 2026-06-20
tags: [ctf, binary-exploitation]
description: A few quick techniques and pitfalls.
outline: [2, 3]
---

# PicoCTF — Binary Exploitation Notes

Some recurring patterns from recent PicoCTF challenges, focusing on buffer overflows and format strings.

```c
// vulnerable snippet
char buf[64];
gets(buf);
```

Mitigations to watch: PIE, NX, stack canaries. Practice with pwntools for scripting.
