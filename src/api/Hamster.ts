import Airdrop, {$fetch, Game, Task} from './Airdrop';

export default class Hamster implements Airdrop {
    loaded = false;
    baseUrl = 'https://api.hamsterkombatgame.io';
    authToken: string;
    data: any = {};

    async init(authToken: string) {
        this.authToken = authToken;
        const headers = {Authorization: `Bearer ${authToken}`};
        const newHeaders = {
            fetchSite: 'same-origin',
            referer: 'https://hamsterkombatgame.io/',
        };

        await $fetch(this.baseUrl, 'ip', 'GET', newHeaders, headers);
        Object.assign(this.data, await $fetch(this.baseUrl, 'auth/account-info', 'POST', newHeaders, headers));

        const [resBody, resHeaders] = await $fetch(this.baseUrl, 'clicker/sync', 'POST', newHeaders, headers, null, true);
        Object.assign(this.data, resBody);

        if (resHeaders.has('config-version'))
            await $fetch(this.baseUrl, `clicker/config/${resHeaders.get('config-version')}`, 'GET', newHeaders, headers);

        Object.assign(this.data, await $fetch(this.baseUrl, 'clicker/config', 'POST', newHeaders, headers));
        Object.assign(this.data, await $fetch(this.baseUrl, 'clicker/upgrades-for-buy', 'POST', newHeaders, headers));
        Object.assign(this.data, await $fetch(this.baseUrl, 'clicker/list-tasks', 'POST', newHeaders, headers));
        await $fetch(this.baseUrl, 'clicker/list-airdrop-tasks', 'POST', newHeaders, headers);
        await $fetch(this.baseUrl, 'clicker/get-skin', 'POST', newHeaders, headers);

        // playground
        // Object.assign(this.data, await $fetch(this.baseUrl, 'clicker/get-promos', 'POST', newHeaders, headers));
        this.loaded = true;
    }

    get name(): string {
        return 'Hamster Kombat';
    }

    get user(): string {
        const user = this.data.accountInfo.telegramUsers[0];
        return user ? `${user.firstName} @${user.username}` : `${this.data.accountInfo.name} (Unknown)`;
    }

    claimTask(taskId: string): boolean {
        return false;
    }

    playGame(gameId: string): boolean {
        return false;
    }

    get points(): number {
        return 0;
    }

    get profit(): number {
        return 0;
    }

    get tasks(): Task[] {
        return [
            new Task('reward', 'Daily Reward', () => {
                const now = new Date();
                const zeroDay = new Date(0);
                const today = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), zeroDay.getHours() - zeroDay.getUTCHours()).getTime();
                const tomorrow = new Date(today + (24 * 3600 * 1000)).getTime();
                const number = Math.round((tomorrow - now.getTime()) / 1000);
                return number > 0 ? number : 0;
            }, () => {
                const now = new Date();
                const today = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 3);
                const date = new Date(this.data.clickerUser.tasks.streak_days_special?.completedAt);
                return date.getTime() >= today.getTime();
            }, () => {
                // TODO: claim reward
            }),
            new Task('cipher', 'Daily Cipher', this.data.dailyCipher.remainSeconds, this.data.dailyCipher.isClaimed, () => {
            }),
            new Task('combo', 'Daily Combo', this.data.dailyCombo.remainSeconds, this.data.dailyCombo.isClaimed, () => {
            }),
        ];
    }

    get games(): Game[] {
        return [];
    }
}