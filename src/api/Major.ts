import Airdrop, {$fetch, Task} from './Airdrop';
import {urlParseHashParams} from './util';

export default class Major implements Airdrop {
    loaded: boolean = false;
    baseUrl: string = 'https://major.bot';
    data: any = {};
    // @ts-ignore
    authToken: string;
    authUrl?: string;

    async init(authToken: string, statusUpdate: (info: string) => void = () => null) {
        const newHeaders = {
            fetchSite: 'same-origin',
            referer: 'https://major.bot/',
        };

        if (!this.loaded) {
            if (authToken.startsWith('https')) {
                const url = new URL(authToken);
                if (url.origin !== this.baseUrl && url.origin !== 'https://major.glados.app')
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

        const headers = {Authorization: `Bearer ${this.authToken}`};

        statusUpdate('Getting account info...');
        Object.assign(this.data, await $fetch(this.baseUrl, `api/users/${this.data.user.id}/`, 'GET', newHeaders, headers));
        Object.assign(this.data, await $fetch(this.baseUrl, `api/users/top/position/${this.data.user.id}/?`, 'GET', newHeaders, headers));

        if (this.data.squad_id != null) {
            await $fetch(this.baseUrl, `api/squads/${this.data.squad_id}`, 'GET', newHeaders, headers);
            await $fetch(this.baseUrl, `api/squads/top/position/${this.data.squad_id}/`, 'GET', newHeaders, headers);
        }

        statusUpdate('Getting game info...');
        Object.assign(this.data, await $fetch(this.baseUrl, 'api/user-visits/streak/', 'GET', newHeaders, headers));

        await $fetch(this.baseUrl, 'api/users/top/?limit=100', 'GET', newHeaders, headers);
        await $fetch(this.baseUrl, 'api/users/referrals/', 'GET', newHeaders, headers);

        await this.loadTasks(newHeaders, headers);

        Object.assign(this.data, await $fetch(this.baseUrl, 'api/squads/?limit=100', 'GET', newHeaders, headers));

        if (!this.loaded)
            await this.loadGames();

        this.loaded = true;
    }

    get name(): string {
        return 'Major';
    }

    get user(): string {
        return `${this.data.first_name} @${this.data.username}`;
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
            referer: 'https://major.bot/earn',
        };
        const headers = {Authorization: `Bearer ${this.authToken}`};

        return this.data.tasks.map(task => {
            return new Task(
                task.id.toString(),
                `${task.title} +${new Intl.NumberFormat().format(task.award)}⭐${!task.is_completed && task.type === 'without_check' ? ' ✅' : ''}`,
                -1,
                () => task.is_completed,
                async () => {
                    let payload = undefined;

                    if (task.type === 'code') {
                        const code = prompt('Code');
                        if (code == null || code.match(/^[0-9]{6}$/) == null)
                            throw new Error('Invalid code');

                        payload = {code};
                    }

                    const data = await $fetch(this.baseUrl, 'api/tasks/', 'POST', newHeaders, headers, {
                        payload,
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

    #Games = [
        {
            seconds: -1,
            blocked_until: -2,
            name: 'durov',
            title: 'Puzzle Durov',
            path: 'api/durov/',
            referer: 'https://major.bot/games/puzzle-durov',
            play: async () => {
                while (true) {
                    const input = prompt('Puzzle Numbers (separated by space)');

                    if (input) {
                        const arr = input.trim().split(' ');
                        if (arr.length === 4 && arr.findIndex(n => n.match(/^[0-9]{1,2}$/) == null) == -1) {
                            const nums = arr.map(n => +n);

                            if (confirm(`Apply ${nums.join(', ')} ?`)) {
                                const newHeaders = {
                                    fetchSite: 'same-origin',
                                    referer: 'https://major.bot/games/puzzle-durov',
                                };
                                const headers = {Authorization: `Bearer ${this.authToken}`};

                                const data = await $fetch(this.baseUrl, 'api/durov/', 'POST', newHeaders, headers, {
                                    choice_1: nums[0],
                                    choice_2: nums[1],
                                    choice_3: nums[2],
                                    choice_4: nums[3],
                                });

                                if (Array.isArray(data.correct) && data.correct.length === 4 && nums.findIndex((v, i) => v !== data.correct[i]) == -1) {
                                    const reward = 5000;
                                    this.data.rating += reward;
                                    alert(`+${reward}⭐`);
                                    return true;
                                } else {
                                    throw new Error('Incorrect');
                                }
                            }
                            break;
                        }

                        continue;
                    }

                    break;
                }
            },
        },
        {
            seconds: -1,
            blocked_until: -2,
            name: 'coins',
            title: 'Hold Coin',
            path: 'api/bonuses/coins/',
            referer: 'https://major.bot/games/hold-coin',
            play: async () => {
                const newHeaders = {
                    fetchSite: 'same-origin',
                    referer: 'https://major.bot/games/hold-coin',
                };

                const headers = {Authorization: `Bearer ${this.authToken}`};

                const reward = 915;
                const data = await $fetch(this.baseUrl, 'api/bonuses/coins/', 'POST', newHeaders, headers, {
                    coins: reward,
                });

                if (data.success === true) {
                    this.data.rating += reward;
                    alert(`+${reward}⭐`);
                    return true;
                } else {
                    throw new Error('Failed to claim');
                }
            },
        },
        {
            seconds: -1,
            blocked_until: -2,
            name: 'roulette',
            title: 'Roulette',
            path: 'api/roulette/',
            referer: 'https://major.bot/games/roulette',
            play: async () => {
                const newHeaders = {
                    fetchSite: 'same-origin',
                    referer: 'https://major.bot/games/roulette',
                };

                const headers = {Authorization: `Bearer ${this.authToken}`};

                const data = await $fetch(this.baseUrl, 'api/roulette/', 'POST', newHeaders, headers);

                if (typeof data.rating_award == 'number') {
                    this.data.rating += data.rating_award;
                    alert(`+${data.rating_award}⭐`);
                    return true;
                } else {
                    throw new Error('Failed to claim');
                }
            },
        },
        {
            seconds: -1,
            blocked_until: -2,
            name: 'swipe_coin',
            title: 'Swipe Coin',
            path: 'api/swipe_coin/',
            referer: 'https://major.bot/games/swipe-coin',
            play: async () => {
                let reward = +(prompt('Score (max 3000, min 500)') ?? '');
                if (isNaN(reward) || reward < 500)
                    throw new Error('Invalid number');

                reward = Math.min(3000, reward);

                const newHeaders = {
                    fetchSite: 'same-origin',
                    referer: 'https://major.bot/games/swipe-coin',
                };

                const headers = {Authorization: `Bearer ${this.authToken}`};

                const data = await $fetch(this.baseUrl, 'api/swipe_coin/', 'POST', newHeaders, headers, {
                    coins: reward,
                });

                if (data.success === true) {
                    this.data.rating += reward;
                    alert(`+${reward}⭐`);
                    return true;
                } else {
                    throw new Error('Failed to claim');
                }
            },
        },
    ];

    private async loadGames() {
        this.data.games = new Array(this.#Games.length);

        const newHeaders = {
            fetchSite: 'same-origin',
            referer: 'https://major.bot/games',
        };

        const headers = {Authorization: `Bearer ${this.authToken}`};

        for (let i = 0; i < this.#Games.length; i++) {
            const game = this.#Games[i];

            this.data.games[i] = new Task(game.name, game.title, () => game.seconds, () => game.seconds !== -1, async () => {
                if (game.blocked_until == -2) {
                    // check needed
                    const data = await $fetch(this.baseUrl, game.path, 'GET', newHeaders, headers, null, false, true);
                    if (data.detail?.blocked_until) {
                        game.blocked_until = data.detail.blocked_until * 1000;
                    } else if (data.success === true) {
                        game.blocked_until = -1;
                    } else {
                        return;
                    }
                }

                if (game.blocked_until == -1) {
                    // read to play
                    await new Promise(res => setTimeout(res, 1000));
                    await $fetch(this.baseUrl, game.path, 'GET', {
                        ...newHeaders,
                        referer: game.referer,
                    }, headers, null, false, true);
                    if (await game.play())
                        game.blocked_until = -2;
                } else {
                    const now = Date.now();
                    if (game.blocked_until <= now)
                        game.blocked_until = -1;

                    game.seconds = game.blocked_until === -1 ? -1 : Math.round((game.blocked_until - now) / 1000);
                }
            });
        }
    }

    get games(): Task[] {
        return this.data.games;
    }

    private async loadTasks(newHeaders: { referer: string; fetchSite: string }, headers: { Authorization: string }) {
        this.data.tasks = [];
        this.data.tasks.push(...await $fetch(this.baseUrl, 'api/tasks/?is_daily=false', 'GET', newHeaders, headers));
        this.data.tasks.push(...await $fetch(this.baseUrl, 'api/tasks/?is_daily=true', 'GET', newHeaders, headers));
    }
}