---
layout: post
title:  "Strange Hacking Tool"
date:   2024-03-20 00:00:00 +0000
categories: malware
---

Malware sample of unknown category from [MalwareBazaar](https://bazaar.abuse.ch/sample/5b30c309cd996a6ab8c1e2aad4e0d47a566f1cb8859677ac90f1253336451dd1). Just looking to perform a quick analysis and share any interesting findings.

### 1. Preliminary Analysis
The malware came wrapped in a strange icon: A reverse image search finds its origin from Super Mario Bros' assets.

![icon](/assets/post_assets/strange-hacking-tool/icon.png)

<br>
Pretty standard sections and permissions. Nothing unusual here.

![sections](/assets/post_assets/strange-hacking-tool/sections.png)

<br>
The sample does, however, import many suspicious libraries - some of their uses I can only make preliminary assumptions.

1. <b>Anti-Debugging</b> - `EnumDisplayMonitors`, `GetMonitorInfo`, `EnumResourceLanguages`, `EnumDisplayDevices`, `HeapQueryInformation`, `GetAdaptersInfo`
2. <b>Shellcode/Unpacking</b> - `VirtualProtect`, `VirtualAlloc`
3. <b>Networking</b> - `WSASocket`, `WSAloctl`, `WSASend`, `WSARecv`

<br>
Running `floss malware.exe` returned a whole bunch of garbage strings, indicating that the binary could be packed. Besides that, there were nothing else of interest in the floss output.

{% highlight powershell %}
...
h8$I
Y_^[
PQQSVW
Y_^[
0SVW
Y_^[
v=h@
h8$I
v=h@
h8$I
v=h@
h8$I
Q`Rj
...
{% endhighlight %}

### 2. Detonation
Upon double-clicking the malware, this window appears... 😭😭❓.

![window](/assets/post_assets/strange-hacking-tool/window.png)

<br>
Procmon didn't observe any abnormal operations. No DNS lookups. No files dropped. If the sample truly is malicious, there must've been some anti-analysis checks, or unmet conditions.

But rather, I suspect this might be closer to a ctf challenge, or a hacking tool.

### 3. Investigation
It seems that the abovementioned anomalous WinAPIs `EnumDisplayMonitors`, `GetMonitorInfo`, `EnumDisplayDevices` were just part initializing the window - not for anti-debugging purposes, which I had initially thought.

![monitor_init](/assets/post_assets/strange-hacking-tool/monitor_init.png)

<br>
Attempted to set up a netcat listener with `ncat -nvlp 80` to interact with the sample. It failed with an error (god forbid I know). The display window and fields look quite similar other Denial of Service (DoS) tools, such as the [Low Orbit Ion Cannon](https://www.imperva.com/learn/ddos/low-orbit-ion-cannon/).

![error](/assets/post_assets/strange-hacking-tool/error.png)

<br>
There were some Wireshark DNS and LLMNR logs generated.

![wireshark](/assets/post_assets/strange-hacking-tool/wireshark.png)

### 4. VirusTotal
Despite multiple attempts to force malicious intent out of the sample, it seems like just a hacking tool. 

![vt](/assets/post_assets/strange-hacking-tool/vt.png)