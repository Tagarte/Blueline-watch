export const formatTimestamp = (timestamp: number): string => {
    if (!timestamp) return "--:--:--";
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, "0")}:${date
        .getMinutes()
        .toString()
        .padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}`;
};

export const formatDate = (timestamp: number): string => {
    if (!timestamp) return "Date inconnue";
    const date = new Date(timestamp);
    const months = [
        "janv",
        "févr",
        "mars",
        "avr",
        "mai",
        "juin",
        "juil",
        "août",
        "sept",
        "oct",
        "nov",
        "déc",
    ];
    return `${date.getDate()} ${
        months[date.getMonth()]
    } ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
};

export const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours} h`;
    return `Il y a ${days} j`;
};

export const calculateStatistics = (
    levels: number[]
): { average: number; max: number; min: number } => {
    if (levels.length === 0) return { average: 0, max: 0, min: 0 };
    const sum = levels.reduce((a, b) => a + b, 0);
    return {
        average: Math.round(sum / levels.length),
        max: Math.max(...levels),
        min: Math.min(...levels),
    };
};

export const checkThresholds = (
    level: number
): { status: string; color: string; message: string } => {
    if (level >= 55) {
        return {
            status: "DANGER",
            color: "#dc3545",
            message: "Niveau critique ! Évacuation recommandée",
        };
    } else if (level >= 20) {
        return {
            status: "ATTENTION",
            color: "#ffc107",
            message: "Seuil d'attention dépassé",
        };
    } else {
        return {
            status: "NORMAL",
            color: "#28a745",
            message: "Situation normale",
        };
    }
};