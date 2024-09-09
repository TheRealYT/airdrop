import Airdrop, {$fetch, Game, Task} from './Airdrop';
import {urlParseHashParams} from './util';

export default class Major implements Airdrop {
    loaded: boolean = false;
    baseUrl: string = 'https://major.bot';
    data: any = {};
    // @ts-ignore
    authToken: string;
    authUrl?: string;

    get games(): Game[] {
        return [];
    }

    async init(authToken: string, statusUpdate: (info: string) => void = () => null) {
        const newHeaders = {
            fetchSite: 'same-origin',
            referer: 'https://major.bot/',
        };

        if (!this.loaded) {
            if (authToken.startsWith('https')) {
                const url = new URL(authToken);
                if (url.origin !== this.baseUrl)
                    throw new Error('Invalid url');

                const decoded = urlParseHashParams(url.hash) as any;

                statusUpdate('Getting auth token by url...');

                const data = await $fetch(this.baseUrl, 'api/auth/tg/', 'POST', newHeaders, {}, {
                    init_data: decoded['tgWebAppData'],
                });

                if ('access_token' in data) {
                    authToken = data.access_token;
                    Object.assign(this.data, data);
                    this.authUrl = url.toString();
                }
            } else {
                throw new Error(`Auth token is not supported in ${this.name}`);
            }

            this.authToken = authToken;
        }

        const headers = {Authorization: `Bearer ${authToken}`};

        statusUpdate('Getting account info...');
        Object.assign(this.data, await $fetch(this.baseUrl, `api/users/${this.data.user.id}/`, 'GET', newHeaders, headers));
        Object.assign(this.data, await $fetch(this.baseUrl, `api/users/top/position/${this.data.user.id}/?`, 'GET', newHeaders, headers));

        statusUpdate('Getting game info...');
        Object.assign(this.data, await $fetch(this.baseUrl, 'api/user-visits/streak/', 'GET', newHeaders, headers));

        if (!this.loaded) {
            await $fetch(this.baseUrl, 'api/users/top/?limit=100', 'GET', newHeaders, headers);
            await $fetch(this.baseUrl, 'api/users/referrals/', 'GET', newHeaders, headers);

            await this.loadTasks(newHeaders, headers);

            Object.assign(this.data, await $fetch(this.baseUrl, 'api/squads/?limit=100', 'GET', newHeaders, headers));

            this.loaded = true;
        }
    }

    private async loadTasks(newHeaders: { referer: string; fetchSite: string }, headers: { Authorization: string }) {
        this.data.tasks = [];
        this.data.tasks.push(...await $fetch(this.baseUrl, 'api/tasks/?is_daily=false', 'GET', newHeaders, headers));
        this.data.tasks.push(...await $fetch(this.baseUrl, 'api/tasks/?is_daily=true', 'GET', newHeaders, headers));
    }

    get name(): string {
        return 'Major';
    }

    get summary(): string[] {
        const rating = new Intl.NumberFormat().format(this.data.rating);
        const pos = new Intl.NumberFormat().format(this.data.position);

        return [
            `⭐ ${rating}`,
            `#️⃣ ${pos}`,
        ];
    }

    get tasks(): Task[] {
        const newHeaders = {
            fetchSite: 'same-origin',
            referer: 'https://major.bot/',
        };
        const headers = {Authorization: `Bearer ${this.authToken}`};

        return this.data.tasks.map(task => {
            return new Task(
                task.id.toString(),
                `${task.title} +⭐${new Intl.NumberFormat().format(task.award)}`,
                -1,
                () => task.is_completed,
                async () => {
                    const data = await $fetch(this.baseUrl, 'api/tasks/', 'POST', newHeaders, headers, {
                        task_id: task.id,
                    });

                    if (!data.is_completed)
                        throw new Error('Task is not completed');

                    this.data.rating += task.award;
                    await this.loadTasks(newHeaders, headers);
                },
            );
        });
    }

    get user(): string {
        return `${this.data.first_name} @${this.data.username}`;
    }
}