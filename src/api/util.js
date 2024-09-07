export function formatSeconds(seconds) {
    const pad = (num) => num.toString().padStart(2, '0');

    return `${pad(Math.floor(seconds / 3600))}:${pad(Math.round((seconds % 3600) / 60))}`;
}