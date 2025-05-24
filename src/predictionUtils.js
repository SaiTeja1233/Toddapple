// Utility: Get most frequent number from array
export const getMostFrequent = (arr) => {
    const freq = {};
    arr.forEach((num) => {
        freq[num] = (freq[num] || 0) + 1;
    });
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    return parseInt(sorted[0][0]);
};

// Condition 1: Arithmetic progression detection (difference pattern)
export const detectArithmeticPattern = (data) => {
    if (data.length < 3) return null;
    const [a, b, c] = data.slice(0, 3).map((d) => d.number);
    if (a - b === b - c) {
        let next = a - (b - c);
        return (next + 10) % 10;
    }
    return null;
};

// Condition 2: Even-Odd switching pattern
export const detectEvenOddPattern = (data) => {
    if (data.length < 4) return null;
    const pattern = data.slice(0, 4).map((d) => d.number % 2);
    if (pattern[0] !== pattern[1] && pattern[1] !== pattern[2]) {
        return pattern[0] === 0 ? 1 : 0; // Predict next as odd or even
    }
    return null;
};

// Condition 3: Repeat number
export const detectRepeatPattern = (data) => {
    if (data.length < 2) return null;
    if (data[0].number === data[1].number) return data[0].number;
    return null;
};

// Condition 4: Transition frequency map
export const predictFromTransitionMap = (data) => {
    const transitions = {};
    for (let i = 0; i < data.length - 1; i++) {
        const curr = data[i].number;
        const next = data[i + 1].number;
        if (!transitions[curr]) transitions[curr] = [];
        transitions[curr].push(next);
    }
    const last = data[0].number;
    const nexts = transitions[last] || [];
    if (nexts.length === 0) return null;

    const counts = {};
    nexts.forEach((n) => (counts[n] = (counts[n] || 0) + 1));
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return parseInt(sorted[0][0]);
};

// Condition 5: Most frequent number overall
export const predictFromFrequency = (data) => {
    const freq = Array(10).fill(0);
    data.forEach(({ number }) => {
        if (number >= 0 && number <= 9) freq[number]++;
    });
    const max = Math.max(...freq);
    return freq.indexOf(max);
};

// Condition 6: Big/Small pattern (0–4 small, 5–9 big)
export const predictBigSmallPattern = (data) => {
    const lastThree = data
        .slice(0, 3)
        .map((d) => (d.number > 4 ? "big" : "small"));
    if (lastThree.every((val) => val === "big")) return 2;
    if (lastThree.every((val) => val === "small")) return 7;
    return null;
};

// Condition 7: Ends with 5 or 0
export const predictSpecialCases = (data) => {
    const last = data[0].number;
    if (last === 0) return 5;
    if (last === 5) return 0;
    return null;
};

// Condition 8: Alternating up/down
export const predictZigZag = (data) => {
    if (data.length < 3) return null;
    const [a, b, c] = data.slice(0, 3).map((d) => d.number);
    if ((a > b && b < c) || (a < b && b > c)) {
        return a;
    }
    return null;
};

// Condition 9: Reverse of last
export const predictReverse = (data) => {
    const last = data[0].number;
    return 9 - last;
};

// Condition 10: Previous 5 average rounded
export const predictFromAverage = (data) => {
    if (data.length < 5) return null;
    const avg = data.slice(0, 5).reduce((sum, d) => sum + d.number, 0) / 5;
    return Math.round(avg) % 10;
};

// Condition 11: Most frequent even/odd
export const predictMostFrequentEvenOdd = (data) => {
    const even = data.filter((d) => d.number % 2 === 0);
    const odd = data.filter((d) => d.number % 2 !== 0);
    return even.length > odd.length ? 2 : 3;
};

// Condition 12: Position-based prediction (based on index mod)
export const predictFromIndexMod = (data) => {
    const lastPeriod = data[0]?.period || 0;
    return lastPeriod % 10;
};
