export type CphEmptyResponse = {
    empty: true;
};

export type CphSubmitResponse = {
    empty: false;
    problemName: string;
    url: string;
    sourceCode: string;
    fileName: string;
    languageId: number;
};

export type ContentScriptData = {
    type: 'cph-submit';
} & CphSubmitResponse;
