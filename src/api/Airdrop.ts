export class Task {
    id: string;
    title: string;
    #seconds: number | (() => number);
    #isDone: boolean | (() => boolean);
    claim: (statusUpdate?: (info: string) => void) => void;

    constructor(id: string, title: string, seconds: number | (() => number), isDone: boolean | (() => boolean), claim: (statusUpdate?: (info: string) => void) => void) {
        this.id = id;
        this.title = title;
        this.#seconds = seconds;
        this.#isDone = isDone;
        this.claim = claim;
    }

    get seconds() {
        return typeof this.#seconds == 'function' ? this.#seconds() : this.#seconds;
    }

    get isDone() {
        return typeof this.#isDone == 'function' ? this.#isDone() : this.#isDone;
    }
}

export default interface Airdrop {
    loaded: boolean;
    baseUrl: string;
    authToken: string;
    authUrl?: string;
    data: any;

    init(authToken: string, statusUpdate?: (info: string) => void): Promise<void>;

    get name(): string;

    get user(): string;

    get summary(): string[];

    get tasks(): Task[];

    get games(): Task[];
}

export async function $fetch(baseUrl: string, path: string, method: string, replaceHeaders: {
    fetchSite: 'same-site' | 'same-origin' | string;
    referer: string;
}, headers: {}, body: {} | null = null, getHeaders = false, ignoreOk = false) {
    const urlSearchParams = new URLSearchParams({
        url: baseUrl + '/' + path,
        referer: replaceHeaders.referer,
        'sec-fetch-site': replaceHeaders.fetchSite,
    });

    if (body != null) {
        // @ts-ignore
        headers['content-type'] = 'application/json';
    }

    const proxyUrl = location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://airdrop-proxy.deno.dev';

    const res = await fetch(
        `${proxyUrl}/?${urlSearchParams.toString()}`,
        {
            headers,
            body: body == null ? null : JSON.stringify(body),
            method,
        },
    );

    if (res.ok || ignoreOk) {
        if (getHeaders)
            return [await res.json(), res.headers];

        return await res.json();
    }

    const data = await res.text();

    throw `${res.status} ${res.statusText} ${data}`;
}