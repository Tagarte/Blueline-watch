export const Colors = {
    primary: "#007BFF",
    primaryDark: "#0056b3",
    primaryLight: "#66b0ff",
    success: "#28a745",
    warning: "#ffc107",
    danger: "#dc3545",
    info: "#17a2b8",
    riskLow: "#28a745",
    riskMedium: "#ffc107",
    riskHigh: "#dc3545",
    white: "#ffffff",
    black: "#000000",
    grayLight: "#f5f5f5",
    gray: "#e0e0e0",
    grayDark: "#666666",
    grayText: "#999999",
    background: "#f5f5f5",
    cardBackground: "#ffffff",
    textPrimary: "#333333",
    textSecondary: "#666666",
    border: "#eeeeee",
    successTransparent: "#28a74520",
    warningTransparent: "#ffc10720",
    dangerTransparent: "#dc354520",
};

export const getRiskColor = (level: number): string => {
    if (level > 55) return Colors.riskHigh;
    if (level > 20) return Colors.riskMedium;
    return Colors.riskLow;
};

export const getRiskText = (level: number): string => {
    if (level > 55) return "Élevé";
    if (level > 20) return "Moyen";
    return "Faible";
};