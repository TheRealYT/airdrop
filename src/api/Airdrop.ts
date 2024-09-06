export interface Task {
    id: string,
    title: string,
    seconds: number,
    isDone: boolean
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

    get points(): number;

    get profit(): number;

    get tasks(): Task[];

    get games(): Game[];

    claimTask(taskId: string): boolean;

    playGame(gameId: string): boolean;
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

    const res = await fetch(
        `http://localhost:3000/?${urlSearchParams.toString()}`,
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