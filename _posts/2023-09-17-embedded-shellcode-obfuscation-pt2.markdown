---
layout: post
title:  "Embedded Shellcode Obfuscation Part 2"
date:   2023-09-17 00:00:00 +0000
categories: malware
---

A continuation of the previous chapter. We'll continue to attempt more obfuscation techniques with the same objective of bypassing VirusTotal. 

Because it seemed to play a part in detection - all code below will be compiled with the command `g++ .\main.cpp -o main.exe --std=c++20 -s`. The added `-s` flag removes all symbol table and relocation information.

We left off on version `main6.cpp`, now compiled to `main6_stripped.exe`. As of said version, the malware has the following features.
+ Dynamic loading of WinAPIs - `VirtualAlloc`, `CreateThread`, `WaitForSingleObject`.
+ Obfuscated strings of abovementioned WinAPIs with FLOSS bypass.
+ XOR decoding of meterpreter shellcode.
+ Execution of meterpreter shellcode in local process.

4/71 vendors flags the current version on VirusTotal. Interesting to note that stripping the binary (-s) had led to different detection and classification results.

SHA256: [899db787a234bcaf90ae381fd034c6b119a5f5f96b54c5a507a548397ea404b9](https://www.virustotal.com/gui/file/899db787a234bcaf90ae381fd034c6b119a5f5f96b54c5a507a548397ea404b9)

