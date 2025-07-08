// This script is injected into Codeforces submission page.
import { ContentScriptData } from './types';
import log from './log';

declare const browser: any;
if (typeof browser !== 'undefined') {
    self.chrome = browser;
}

log('cph-submit script injected');

const isContestProblem = (problemUrl: string) => {
    return problemUrl.indexOf('contest') != -1;
};

const handleData = async (data: ContentScriptData) => {
    log('Handling submit message');

    // Extract CSRF token from the page
    const csrfTokenElement = document.querySelector('input[name="csrf_token"]') as HTMLInputElement;
    const csrfToken = csrfTokenElement ? csrfTokenElement.value : '';

    if (!csrfToken) {
        log('CSRF token not found');
        return;
    }

    // Extract other required parameters
    const ftaaElement = document.querySelector('input[name="ftaa"]') as HTMLInputElement;
    const ftaa = ftaaElement ? ftaaElement.value : '';

    const bfaaElement = document.querySelector('input[name="bfaa"]') as HTMLInputElement;
    const bfaa = bfaaElement ? bfaaElement.value : '';

    const ttaElement = document.querySelector('input[name="_tta"]') as HTMLInputElement;
    const tta = ttaElement ? ttaElement.value : '';

    // Create form data for submission
    const formData = new FormData();
    formData.append('csrf_token', csrfToken);
    formData.append('ftaa', ftaa);
    formData.append('bfaa', bfaa);
    formData.append('_tta', tta);
    formData.append('action', 'submitSolutionFormSubmitted');
    formData.append('programTypeId', data.languageId.toString());
    formData.append('source', data.sourceCode);

    // Set the problem code based on whether it's a contest problem or not
    if (!isContestProblem(data.url)) {
        formData.append('submittedProblemCode', data.problemName);
    } else {
        // For contest problems, extract the problem index
        const problemName = data.url.split('/problem/')[1];
        formData.append('submittedProblemIndex', problemName);
    }

    // Get current URL for submission
    const currentUrl = window.location.href;

    try {
        // Make the POST request
        const response = await fetch(currentUrl, {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        });

        if (response.ok) {
            log('Submission successful');

            // Redirect to submissions page
            if (isContestProblem(data.url)) {
                const contestId = data.url.split('/contest/')[1].split('/')[0];
                window.location.href = `https://codeforces.com/contest/${contestId}/my`;
            } else {
                window.location.href = 'https://codeforces.com/problemset/status?my=on';
            }
        } else {
            log('Submission failed', response.status, response.statusText);
        }
    } catch (error) {
        log('Error submitting code', error);
    }
};

chrome.runtime.onMessage.addListener((data: any, sender: any) => {
    log('Got message', data, sender);
    if (data.type == 'cph-submit') {
        handleData(data);
    }
});
