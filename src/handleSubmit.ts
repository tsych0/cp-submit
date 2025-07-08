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

export const isCSESProblem = (problemUrl: string) => {
  return isPlatform(problemUrl, 'cses.fi');
}

export const isContestProblem = (problemUrl: string) => {
    return isCodeforcesProblem(problemUrl) && problemUrl.indexOf('contest') !== -1;
};

export const getSubmitUrl = (problemUrl: string): string => {
  log(`problemURL: ${problemUrl}`);

  if (isCSESProblem(problemUrl)) {
    const match = problemUrl.match(/cses\.fi\/([^/]+)\/task\/(\d+)/);
    if (!match) return "";

    const [, target, task] = match;
    return `https://cses.fi/${target}/submit/${task}/`;
  }

  return problemUrl;
};

interface ChromeTab {
  id?: number;
  url?: string;
  title?: string;
  windowId: number;
  active: boolean;
  // Add other properties as needed
}

function goToTabWithUrl(targetUrl: string): Promise<ChromeTab> {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ url: targetUrl }, (tabs: ChromeTab[]) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (tabs.length > 0) {
        // Tab found - activate it
        // @ts-ignore
        chrome.tabs.update(tabs[0].id!, { active: true }, (tab: ChromeTab) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          
          // Also bring the window to focus
          chrome.windows.update(tab.windowId, { focused: true }, () => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            resolve(tab);
          });
        });
      } else {
        // Tab not found - create a new one
        chrome.tabs.create({ url: targetUrl }, (newTab: ChromeTab) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(newTab);
        });
      }
    });
  });
}



/** Opens the codefoces submit page and injects script to submit code. */
export const handleSubmit = async (
    problemName: string,
    languageId: number,
    sourceCode: string,
    fileName: string,
    problemUrl: string,
) => {
    if (problemName === '' || languageId == -1 || sourceCode == '') {
        log('Invalid arguments to handleSubmit');
        return;
    }

    log('Platform detection', {
        isCodeforces: isCodeforcesProblem(problemUrl),
        isAtcoder: isAtcoderProblem(problemUrl),
        isCses: isCSESProblem(problemUrl)
    });

    let targetUrl = getSubmitUrl(problemUrl);

    let tab = await goToTabWithUrl(targetUrl);

    const tabId = tab.id as number;

    chrome.windows.update(tab.windowId, {
        focused: true,
    });

    let scriptToInject = '';
    if (isAtcoderProblem(problemUrl)) {
      scriptToInject = '/dist/atcoderInjectedScript.js';
    } else if (isCodeforcesProblem(problemUrl)) {
      scriptToInject = '/dist/cfInjectedScript.js';
    } else if (isCSESProblem(problemUrl)) {
      scriptToInject = '/dist/csesInjectedScript.js';
    }

    if (scriptToInject == '') {
      return;
    }

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
        fileName,
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
        }
    }, filter);
};
