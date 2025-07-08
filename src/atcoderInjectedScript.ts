// This script is injected into AtCoder submission page
import { ContentScriptData } from './types';
import log from './log';

declare const browser: any;
if (typeof browser !== 'undefined') {
    self.chrome = browser;
}

log('atcoder-submit script injected');

const handleData = async (data: ContentScriptData) => {
    log('Handling AtCoder submit message');

    // Extract task ID from the URL
    const taskId = data.url.split('/tasks/')[1];

    // Get the CSRF token
    const csrfTokenElement = document.querySelector('input[name="csrf_token"]') as HTMLInputElement;
    const csrfToken = csrfTokenElement ? csrfTokenElement.value : '';

    if (!csrfToken) {
        log('CSRF token not found');
        return;
    }

    // Map Codeforces language ID to AtCoder language ID
    const atcoderLanguageId = mapLanguageId(data.languageId);

    // @ts-ignore
    let toggle_button: HTMLButtonElement = document.querySelector(".btn-toggle-editor");
    // @ts-ignore
    let plain_text_area: HTMLTextAreaElement = document.querySelector("#plain-textarea")

    if (toggle_button?.ariaPressed == 'false') {
        toggle_button.click()
    }

    setTimeout(() => {
     for (let i = 0; i < 100; i++) {
        plain_text_area.value = data.sourceCode;
     }
    }, 300);

    setTimeout(() => {
        toggle_button.click()
    }, 1500);

    return;
};

// Map Codeforces language IDs to AtCoder language IDs
// Mapping from Codeforces language IDs to AtCoder language IDs
function mapLanguageId(cfLanguageId: number) {
    const languageMap: Record<number, number> = {
        // C++
        54: 5001, // C++ -> C++ 20
        42: 5053, // C++11 -> C++ 17

        // Java
        61: 5005, // Java -> Java
        55: 5005, // Java 8 -> Java

        // Python
        70: 5055, // Python -> Python
        31: 5055, // Python 2 -> Python (no direct Python 2 in AtCoder)
        73: 5078, // PyPy -> Python (PyPy)

        // C
        43: 5017, // GNU C -> C

        // Other common languages
        32: 5002, // Go -> Go
        50: 5003, // C# -> C#
        9: 5003,  // C# Mono -> C#
        23: 5003, // C# Mono -> C#

        65: 5018, // Ruby -> Ruby
        8: 5018,  // Ruby -> Ruby

        67: 5016, // PHP -> PHP
        6: 5016,  // PHP -> PHP

        60: 5009, // JavaScript -> JavaScript
        34: 5009, // JavaScript -> JavaScript

        52: 5041, // Pascal -> Pascal
        51: 5041, // Pascal -> Pascal
        4: 5041,  // Free Pascal -> Pascal

        28: 5012, // D -> D
        26: 5012, // D -> D

        12: 5025, // Haskell -> Haskell

        20: 5059, // OCaml -> OCaml
        19: 5059, // OCaml -> OCaml

        36: 5037, // Perl -> Perl
        13: 5037, // Perl -> Perl

        40: 5047, // Scala -> Scala
        18: 5047, // Scala -> Scala

        41: 5004, // Kotlin -> Kotlin

        22: 5048, // Visual Basic -> Visual Basic
    };

    // Return the mapped AtCoder ID or a default (C++ 20) if not found
    return languageMap[cfLanguageId] || cfLanguageId;
}


chrome.runtime.onMessage.addListener((data: any, sender: any) => {
    log('Got message', data, sender);
    if (data.type == 'cph-submit') {
        handleData(data);
    }
});
