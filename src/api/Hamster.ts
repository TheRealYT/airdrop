import Airdrop, {$fetch, Game, Task} from './Airdrop';
import {formatSeconds} from './util';

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

    get summary(): string[] {
        const level = this.data.clickerUser.level;
        const profit = new Intl.NumberFormat().format(this.data.clickerUser.earnPassivePerHour);
        const coin = new Intl.NumberFormat().format(Math.round(this.data.clickerUser.balanceCoins));

        return [`🤵 Level ${level}`, `💰 ${coin}`, `🪙 +${profit}(hr)`, `🔑 ${this.data.clickerUser.balanceKeys}`];
    }

    get tasks(): Task[] {
        return [
            new Task('reward', `Daily Reward - ${this.data.clickerUser.tasks.streak_days_special?.days}D ${this.data.clickerUser.tasks.streak_days_special?.weeks}W`, () => {
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
            }, async () => {
                const headers = {Authorization: `Bearer ${this.authToken}`};
                const newHeaders = {
                    accept: 'application/json',
                    fetchSite: 'same-origin',
                    referer: 'https://hamsterkombatgame.io/',
                };

                Object.assign(this.data, await $fetch(this.baseUrl, 'clicker/check-tasks', 'POST', newHeaders, headers, {
                    taskId: 'streak_days_special',
                }));
            }),
            new Task('cipher', `Daily Cipher - ${this.getCipher()}`, this.data.dailyCipher.remainSeconds, this.data.dailyCipher.isClaimed, async () => {
                const headers = {Authorization: `Bearer ${this.authToken}`};
                const newHeaders = {
                    accept: 'application/json',
                    fetchSite: 'same-origin',
                    referer: 'https://hamsterkombatgame.io/',
                };

                Object.assign(this.data, await $fetch(this.baseUrl, 'clicker/claim-daily-cipher', 'POST', newHeaders, headers, {
                    cipher: this.getCipher(),
                }));
            }),
            new Task('combo', `Daily Combo - ${this.data.dailyCombo.upgradeIds?.join(', ')}`, this.data.dailyCombo.remainSeconds, this.data.dailyCombo.isClaimed, async () => {
                if (this.data.dailyCombo.upgradeIds?.length === 3) {
                    const headers = {Authorization: `Bearer ${this.authToken}`};
                    const newHeaders = {
                        fetchSite: 'same-origin',
                        referer: 'https://hamsterkombatgame.io/',
                    };

                    Object.assign(this.data, await $fetch(this.baseUrl, 'clicker/claim-daily-combo', 'POST', newHeaders, headers));
                    return;
                }

                const input = prompt('Enter combo names comma separated');
                if (!input)
                    return;

                const texts = input
                    .split(',')
                    .map(t => t.trim())
                    .filter(t => t.length > 0);

                if (texts.length === 0)
                    return;

                const updates = texts
                    .map(c => this.getUpdateWithCondition(c))
                    .filter(v => v.length > 0);

                let str = '';

                for (let i1 = 0; i1 < updates.length; i1++) {
                    const update = updates[i1];
                    for (let i = 0; i < update.length; i++) {
                        const combo = update[i];
                        const format = new Intl.NumberFormat().format;

                        const price = format(combo.price);
                        const profit = format(combo.profitPerHourDelta);

                        const t = i > 0 ? '  ' : '';
                        str += `${i === 0 ? '🎴 ' : ''}${t}${combo.name}(${combo.id})\n${t}Level ${combo.level}    💰${price}   🪙+${profit}\n${this.mark(combo.isAvailable && !combo.isExpired)} Available\n\n`;

                        if (i > 0) str += `\n\n`;
                    }
                }

                if (confirm(str)) {
                    let str = '';
                    for (const update of updates)
                        for (const combo of update.toReversed()) {
                            while (true) {
                                try {
                                    await this.buyUpdate(combo.id);
                                    combo.level++;

                                    str += `✅ Level up ${combo.level}/${combo.levelUp ?? '-'} ${combo.name}\n`;

                                    if (!combo.levelUp || combo.level >= combo.levelUp)
                                        break;

                                    if (typeof combo.totalCooldownSeconds == 'number') {
                                        const timeout = combo.totalCooldownSeconds;

                                        str += `⌚ Buy "${combo.name}" after ${formatSeconds(timeout)}(hour:minute)\n`;
                                        break;
                                    } else {
                                        await new Promise(res => setTimeout(res, 2000));
                                    }
                                } catch (e) {
                                    str += `❌ ${combo.name} - error ${typeof e?.message == 'string' ? e.message : 'can\'t buy'}\n`;
                                    break;
                                }
                            }
                            str += '\n\n';
                        }

                    alert(str);
                }
            }),
        ];
    }

    get games(): Game[] {
        return [];
    }

    private getUpdateWithCondition(updateId) {
        const all = Array.from(this.data.upgradesForBuy);
        const tree = [];

        let update = all.find(v => v.id.toLowerCase() === updateId.toLowerCase() || v.id.toLowerCase().includes(updateId.toLowerCase()) || v.name.toLowerCase().includes(updateId.toLowerCase()));
        while (update != null) {
            update.level = this.data.clickerUser.upgrades?.[update.id]?.level ?? update.level;
            tree.push(update);

            if (update.condition == null || update.condition._type !== 'ByUpgrade')
                break;

            const newUpdate = all.find(v => v.id === update.condition.upgradeId);
            newUpdate.level = this.data.clickerUser.upgrades?.[newUpdate.id]?.level ?? newUpdate.level;

            if (newUpdate.level >= update.condition.level)
                break;

            newUpdate.levelUp = update.condition.level;
            update = newUpdate;
        }

        return tree;
    }

    private mark(v) {
        return v === true ? '✅' : '❌';
    }

    private async buyUpdate(updateId) {
        const headers = {Authorization: `Bearer ${this.authToken}`};
        const newHeaders = {
            accept: 'application/json',
            fetchSite: 'same-origin',
            referer: 'https://hamsterkombatgame.io/',
        };

        Object.assign(this.data, await $fetch(this.baseUrl, 'clicker/buy-upgrade', 'POST', newHeaders, headers, {
            'upgradeId': updateId, 'timestamp': Date.now(),
        }));
    }

    private getCipher() {
        const e = this.data.dailyCipher.cipher;
        return atob(`${e.slice(0, 3)}${e.slice(4)}`);
    }
}