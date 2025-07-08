// This script is injected into Codeforces submission page.
import log from './log';

declare const browser: any;
if (typeof browser !== 'undefined') {
    self.chrome = browser;
}

log('cses-submit script injected');

const handleCsesSubmit = async (data: {
    type: string;
    problemName: string;
    languageId: number;
    sourceCode: string;
    fileName: string;
    url: string;
}) => {
    log('Handling CSES submit message');

    const csrfTokenElement = document.querySelector('input[name="csrf_token"]') as HTMLInputElement;
    const csrfToken = csrfTokenElement ? csrfTokenElement.value : '';

    if (!csrfToken) {
        log('CSRF token not found');
        return;
    }

    const formData = new FormData();
    formData.append('csrf_token', csrfToken);

    // Simulate file upload
    const blob = new Blob([data.sourceCode], { type: 'text/plain' });
    const file = new File([blob], data.fileName, { type: 'text/plain' });
    formData.append('file', file);

    let {lang, option} = mapCfLanguageToCses(data.languageId);
    let {target, task} = parseCsesUrl(data.url);

    formData.append('lang', lang);
    formData.append('option', option);
    formData.append('target', target);
    formData.append('task', task);
    formData.append('type', 'course');

    try {
        const response = await fetch('https://cses.fi/course/send.php', {
            method: 'POST',
            body: formData,
            credentials: 'same-origin',
        });

        if (response.ok) {
            log('CSES submission successful');
            window.location.href = `https://cses.fi/problemset/view/${task}`;
        } else {
            log('CSES submission failed', response.status, response.statusText);
        }
    } catch (error) {
        log('Error submitting to CSES', error);
    }
};

chrome.runtime.onMessage.addListener((data: any) => {
    log('Received message', data);
    if (data.type === 'cph-submit') {
        handleCsesSubmit(data);
    }
});

function parseCsesUrl(url: string): { target: string; task: string } {
    const match = url.match(/cses\.fi\/([^/]+)\/task\/(\d+)/);
    if (!match) return {target: "", task: ""};

    const [, target, task] = match;
    return { target, task };
}

function mapCfLanguageToCses(cfLangId: number): { lang: string; option: string } {
    const mapping: Record<number, { lang: string; option: string }> = {
        // ----- C++
        42: { lang: 'C++', option: '17' },  // C++11 → C++17
        50: { lang: 'C++', option: '17' },  // MS C++
        54: { lang: 'C++', option: '20' },  // C++17/20 → use latest

        // ----- C
        43: { lang: 'C', option: '' },

        // ----- Java
        55: { lang: 'Java', option: '' },
        61: { lang: 'Java', option: '' },

        // ----- Rust
        75: { lang: 'Rust', option: '2021' },  // Only 2021 supported on CF

        // ----- Python (Python2 vs Python3 vs PyPy)
        7:  { lang: 'Python2', option: '' },
        31: { lang: 'Python2', option: '' },
        70: { lang: 'Python3', option: 'cpython' },
        71: { lang: 'Python3', option: 'cpython' },
        73: { lang: 'Python3', option: 'pypy' }, // PyPy

        // ----- Node.js
        34: { lang: 'Node.js', option: '' },
        60: { lang: 'Node.js', option: '' },

        // ----- Pascal
        51: { lang: 'Pascal', option: '' },
        52: { lang: 'Pascal', option: '' },

        // ----- Ruby
        8:  { lang: 'Ruby', option: '' },
        65: { lang: 'Ruby', option: '' },

        // ----- Scala
        40: { lang: 'Scala', option: '' },

        // ----- Haskell
        12: { lang: 'Haskell', option: '' },

        // ----- Assembly (rare)
        13: { lang: 'Assembly', option: '' },
    };

    return mapping[cfLangId] || { lang: 'C++', option: '20' }; // Default fallback
}
