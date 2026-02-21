
export const formatUZS = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
};

export const formatCompactUZS = (amount: number) => {
    if (amount >= 1000000000) return (amount / 1000000000).toFixed(1) + " mlrd";
    if (amount >= 1000000) return (amount / 1000000).toFixed(1) + " mln";
    if (amount >= 1000) return (amount / 1000).toFixed(0) + " ming";
    return amount.toString();
};
