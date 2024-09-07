export class Task {
    id: string;
    title: string;
    #seconds: number | (() => number);
    #isDone: boolean | (() => boolean);
    claim: () => void;

    constructor(id: string, title: string, seconds: number | (() => number), isDone: boolean | (() => boolean), claim: () => void) {
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

export interface Game {
    id: string,
    title: string,
    seconds: number,
    isDone: boolean
}

export default interface Airdrop {
    loaded: boolean;
    baseUrl: string;
    authToken: string;
    data: any;

    init(authToken: string): Promise<void>;

    get name(): string;

    get user(): string;

    get summary(): string[];

    get tasks(): Task[];

    get games(): Game[];
}

export async function $fetch(baseUrl: string, path: string, method: string, replaceHeaders: {
    fetchSite: 'same-site' | 'same-origin' | string;
    referer: string;
}, headers: {}, body = null, getHeaders = false) {
    const urlSearchParams = new URLSearchParams({
        url: baseUrl + '/' + path,
        referer: replaceHeaders.referer,
        'sec-fetch-site': replaceHeaders.fetchSite,
    });

    if (body != null)
        headers['content-type'] = 'application/json';

    const res = await fetch(
        `http://${window.location.hostname}:3000/?${urlSearchParams.toString()}`,
        {
            headers,
            body: body == null ? null : JSON.stringify(body),
            method,
        },
    );

    if (res.ok) {
        if (getHeaders)
            return [await res.json(), res.headers];

        return await res.json();
    }

    const data = res.text();

    throw `${res.status} ${res.statusText}\n${data}`;
}