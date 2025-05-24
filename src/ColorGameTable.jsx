import React, { useEffect, useState, useCallback } from "react";
import "./ColorGameTable.css"; // Keep this for custom styles like number-circle and prediction-box

// --- Predictive Logic (Intact and remains unchanged) ---
const predictNextNumber = (data) => {
    if (data.length < 20)
        return { number: null, fallback: null, size: null, color: null };

    const recent = data.slice(0, 100);

    const freq = Array(10).fill(0);
    recent.forEach(({ number }) => {
        if (number >= 0 && number <= 9) freq[number]++;
    });

    const mostFrequent = freq.indexOf(Math.max(...freq));

    const transitionMatrix = Array.from({ length: 10 }, () =>
        Array(10).fill(0)
    );
    for (let i = 0; i < recent.length - 1; i++) {
        const curr = recent[i].number;
        const next = recent[i + 1].number;
        transitionMatrix[curr][next]++;
    }

    const lastNumber = recent[0].number;
    const transitionCounts = transitionMatrix[lastNumber];
    const mostLikelyNext = transitionCounts.indexOf(
        Math.max(...transitionCounts)
    );

    const conditions = [];

    conditions.push(mostFrequent); // 1
    conditions.push(mostLikelyNext); // 2

    const last3 = recent.slice(0, 3).map((d) => d.number);
    for (let i = 0; i < 10; i++) {
        if (!last3.includes(i)) {
            conditions.push(i); // 3
            break;
        }
    }

    conditions.push(9 - lastNumber); // 4
    conditions.push((lastNumber + 2) % 10); // 5

    const even = freq.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0);
    const odd = freq.filter((_, i) => i % 2 !== 0).reduce((a, b) => a + b, 0);
    const targetParity = even > odd ? 0 : 1;
    const parityMatch = freq
        .map((f, i) => ({ i, f }))
        .filter(({ i }) => i % 2 === targetParity)
        .sort((a, b) => b.f - a.f)[0].i;
    conditions.push(parityMatch); // 6

    const prevNumber = recent[1]?.number;
    if (prevNumber !== undefined) conditions.push(prevNumber); // 7

    const avg = Math.round(
        recent.slice(0, 5).reduce((sum, d) => sum + d.number, 0) / 5
    );
    conditions.push(avg); // 8

    const count20 = Array(10).fill(0);
    data.slice(0, 20).forEach(({ number }) => count20[number]++);
    const exactThree = count20.findIndex((v) => v === 3);
    if (exactThree !== -1) conditions.push(exactThree); // 9

    const votes = Array(10).fill(0);
    conditions.forEach((num) => {
        if (num >= 0 && num <= 9) votes[num]++;
    });

    const predictedNumber = votes.indexOf(Math.max(...votes));

    const fallbackSize = predictedNumber <= 4 ? "Small" : "Big";
    const fallbackColor = predictedNumber % 2 === 0 ? "Red" : "Green";

    return {
        number: predictedNumber,
        size: fallbackSize,
        color: fallbackColor,
    };
};

// --- Main Component ---
const ColorGameTable = () => {
    // State for live data (from API) and its prediction
    const [liveData, setLiveData] = useState([]);
    const [nextPeriod, setNextPeriod] = useState(0);
    const [countdown, setCountdown] = useState(60);
    const [predicted, setPredicted] = useState(null);

    // --- Data Fetching and Prediction from API ---
    const fetchLiveData = useCallback(async () => {
        try {
            const response = await fetch(
                "https://vgaserver3-679685875451.asia-south1.run.app/minute1_getFullRecord/"
            );
            const result = await response.json();
            const formatted = result.map((item) => ({
                period: item.id,
                number: item.number,
            }));

            setLiveData(formatted); // Display all fetched live data
            const latestPeriod = formatted[0]?.period || 0;
            setNextPeriod(latestPeriod + 1);

            // Generate prediction based on live data
            if (formatted.length >= 20) {
                const prediction = predictNextNumber(formatted);
                const actual = formatted[0].number; // The most recent official number

                // Logic to display the prediction (number, then color, then size if number is wrong)
                if (prediction.number === actual) {
                    setPredicted({
                        label: `Number: ${prediction.number}`,
                        style: {
                            backgroundColor: actual % 2 === 0 ? "red" : "green",
                        },
                        value: prediction.number,
                    });
                } else if (
                    (prediction.number <= 4 && actual > 4) ||
                    (prediction.number > 4 && actual <= 4)
                ) {
                    setPredicted({
                        label: `Color: ${prediction.color}`,
                        style: {
                            backgroundColor:
                                prediction.color === "Red" ? "red" : "green",
                        },
                        value: prediction.color,
                    });
                } else {
                    setPredicted({
                        label: `Size: ${prediction.size}`,
                        style: {
                            backgroundColor:
                                prediction.size === "Big"
                                    ? "#4a69bd"
                                    : "#f18800", // Using a consistent blue and orange for size
                        },
                        value: prediction.size,
                    });
                }
            } else {
                setPredicted(null); // Not enough live data for prediction
            }
        } catch (error) {
            console.error("Error fetching live data:", error);
            setPredicted({
                label: "Prediction Error",
                style: { backgroundColor: "grey" },
            });
        }
    }, []); // No dependencies for fetchData

    // --- Effect for Countdown and Live Data Fetching ---
    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const count = 59 - now.getSeconds(); // Countdown to the next minute
            setCountdown(count);
            // Fetch new data when countdown is near zero (e.g., 1 second left), anticipating the new period result
            if (count <= 1) fetchLiveData();
        };

        fetchLiveData(); // Initial fetch on component mount
        updateTimer(); // Initial timer update

        const timerInterval = setInterval(updateTimer, 1000); // Update countdown every second
        const fetchInterval = setInterval(fetchLiveData, 30000); // Re-fetch live data every 30 seconds

        return () => {
            clearInterval(timerInterval);
            clearInterval(fetchInterval);
        };
    }, [fetchLiveData]);

    // --- Helper Functions for Display ---
    const getFormattedCountdown = (s) =>
        `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(
            s % 60
        ).padStart(2, "0")}`;

    const getColorEmoji = (num) => {
        if (num === 0) return "🔴🟣"; // Red/Purple for 0
        if (num === 5) return "🟢🟣"; // Green/Purple for 5
        return num % 2 === 0 ? "🔴" : "🟢"; // Red for even, Green for odd
    };

    const getCircleStyle = (num) => {
        if (num === 0)
            return {
                backgroundColor: "#d00000", // Darker red
                color: "#fff",
                border: "2px solid purple",
            };
        if (num === 5)
            return {
                backgroundColor: "#00a000", // Darker green
                color: "#fff",
                border: "2px solid purple",
            };
        return {
            backgroundColor: num % 2 === 0 ? "#d00000" : "#00a000",
            color: "#fff",
        };
    };

    return (
        <div className="container">
            <h1 className="main-title">Color Game Predictor</h1>

            {/* --- Official Game Prediction Section --- */}
            <div className="section official-section">
                <h2 className="section-title">Official Game Prediction</h2>
                <div className="section-header">
                    <div className="info-block">
                        <h3>
                            Next Period:{" "}
                            <span className="info-highlight">
                                {String(nextPeriod).padStart(3, "0").slice(-3)}
                            </span>
                        </h3>
                    </div>
                    <div className="info-block">
                        <h4>
                            Countdown:{" "}
                            <span className="countdown">
                                {getFormattedCountdown(countdown)}
                            </span>
                        </h4>
                    </div>
                </div>
                {liveData.length < 20 ? (
                    <p className="warning-message">
                        Fetching official data... Please wait for enough history
                        to generate predictions (at least 20 entries).
                    </p>
                ) : (
                    predicted && (
                        <div className="prediction-box" style={predicted.style}>
                            {predicted.label}
                        </div>
                    )
                )}
            </div>

            {/* --- Official Game History Table --- */}
            <div className="section history-section">
                <h2 className="section-title">Official Game History</h2>
                <div className="table-wrapper">
                    {liveData.length === 0 ? (
                        <p className="empty-message">
                            No official game history available. Please wait for
                            data to load.
                        </p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Period</th>
                                    <th>Number</th>
                                    <th>Color</th>
                                    <th>Size</th>
                                </tr>
                            </thead>
                            <tbody>
                                {liveData.map((entry, index) => (
                                    <tr key={index}>
                                        <td>
                                            {String(entry.period)
                                                .padStart(3, "0")
                                                .slice(-3)}
                                        </td>
                                        <td>
                                            <div
                                                className="number-circle"
                                                style={getCircleStyle(
                                                    entry.number
                                                )}
                                            >
                                                {entry.number}
                                            </div>
                                        </td>
                                        <td
                                            className={
                                                entry.number % 2 === 0
                                                    ? "text-red"
                                                    : "text-green"
                                            }
                                        >
                                            {getColorEmoji(entry.number)}{" "}
                                            {entry.number % 2 === 0
                                                ? "Red"
                                                : "Green"}
                                        </td>
                                        <td>
                                            {entry.number <= 4
                                                ? "Small"
                                                : "Big"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ColorGameTable;
