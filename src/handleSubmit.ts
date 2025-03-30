// Code run when background script detects there is a problem to submit
import config from './config';
import log from './log';

declare const browser: any;

if (typeof browser !== 'undefined') {
    self.chrome = browser;
}

export const isPlatform = (problemUrl: string, platform: string) => {
    return problemUrl.indexOf(platform) !== -1;
};

export const isCodeforcesProblem = (problemUrl: string) => {
    return isPlatform(problemUrl, 'codeforces.com');
};

export const isAtcoderProblem = (problemUrl: string) => {
    return isPlatform(problemUrl, 'atcoder.jp');
};

export const isContestProblem = (problemUrl: string) => {
    return isCodeforcesProblem(problemUrl) && problemUrl.indexOf('contest') !== -1;
};

export const getSubmitUrl = (problemUrl: string) => {
    if (isAtcoderProblem(problemUrl)) {
        // Extract contest ID from AtCoder URL
        const url = new URL(problemUrl);
        const pathParts = url.pathname.split('/');
        const contestId = pathParts[2];
        return `https://atcoder.jp/contests/${contestId}/submit`;
    }

    if (!isContestProblem(problemUrl)) {
        return config.cfSubmitPage.href;
    }

    const url = new URL(problemUrl);
    const contestNumber = url.pathname.split('/')[2];
    const submitURL = `https://codeforces.com/contest/${contestNumber}/submit`;
    return submitURL;
};

/** Opens the codefoces submit page and injects script to submit code. */
export const handleSubmit = async (
    problemName: string,
    languageId: number,
    sourceCode: string,
    problemUrl: string,
) => {
    if (problemName === '' || languageId == -1 || sourceCode == '') {
        log('Invalid arguments to handleSubmit');
        return;
    }

    log('Platform detection', {
        isCodeforces: isCodeforcesProblem(problemUrl),
        isAtcoder: isAtcoderProblem(problemUrl)
    });

    let tab = await chrome.tabs.create({
        active: true,
        url: getSubmitUrl(problemUrl),
    });

    const tabId = tab.id as number;

    chrome.windows.update(tab.windowId, {
        focused: true,
    });

    const scriptToInject = isAtcoderProblem(problemUrl)
        ? '/dist/atcoderInjectedScript.js'
        : '/dist/injectedScript.js';


    if (typeof browser !== 'undefined') {
        await browser.tabs.executeScript(tab.id, {
            file: scriptToInject,
        });
    } else {
        await chrome.scripting.executeScript({
            target: {
                tabId,
                allFrames: true,
            },
            files: [scriptToInject],
        });
    }
    chrome.tabs.sendMessage(tabId, {
        type: 'cph-submit',
        problemName,
        languageId,
        sourceCode,
        url: problemUrl,
    });
    log('Sending message to tab with script');

    const filter = {
        url: [{ urlContains: 'codeforces.com/problemset/status' }],
    };

    log('Adding nav listener');

    chrome.webNavigation.onCommitted.addListener((args) => {
        log('Navigation about to happen');

        if (args.tabId === tab.id) {
            log('Our tab is navigating');

            // const url = new URL(args.url);
            // const searchParams = new URLSearchParams(url.search);

            // if (searchParams.has("friends")) {
            //   return;
            // }

            // log("Navigating to friends mode");

            // chrome.tabs.update(args.tabId, { url: args.url + "?friends=on" });
        }
    }, filter);
};
