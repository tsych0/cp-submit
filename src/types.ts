export type CphEmptyResponse = {
    empty: true;
};

export type CphSubmitResponse = {
    empty: false;
    problemName: string;
    url: string;
    sourceCode: string;
    languageId: number;
    platform: 'codeforces' | 'atcoder';
};

export type ContentScriptData = {
    type: 'cph-submit';
} & CphSubmitResponse;
