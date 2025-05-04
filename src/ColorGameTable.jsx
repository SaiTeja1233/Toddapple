import React, { useEffect, useState, useCallback } from "react";
import "./ColorGameTable.css";

// --- Predictive Logic Outside Component ---
const detectSequencePattern = (recentData) => {
    if (recentData.length < 4) return null;
    const diffs = [];
    for (let i = 0; i < 3; i++) {
        diffs.push(recentData[i].number - recentData[i + 1].number);
    }
    if (diffs.every((d) => d === diffs[0])) {
        let next = recentData[0].number - diffs[0];
        if (next < 0) next += 10;
        if (next > 9) next -= 10;
        return next;
    }
    return null;
};

const predictNextNumber = (data) => {
    const recentData = data; // Use all 100 entries
    if (recentData.length < 2) return null;

    const sequencePrediction = detectSequencePattern(recentData);
    if (sequencePrediction !== null) return sequencePrediction;

    const transitions = {};
    for (let i = 0; i < recentData.length - 1; i++) {
        const curr = recentData[i].number;
        const next = recentData[i + 1].number;
        if (!transitions[curr]) transitions[curr] = [];
        transitions[curr].push(next);
    }

    const lastNumber = recentData[0].number;
    const nextOptions = transitions[lastNumber] || [];
    if (nextOptions.length === 0) {
        const freq = Array(10).fill(0);
        recentData.forEach(({ number }) => {
            if (number >= 0 && number <= 9) freq[number]++;
        });
        return freq.indexOf(Math.max(...freq));
    }

    const freqMap = {};
    nextOptions.forEach((num) => {
        freqMap[num] = (freqMap[num] || 0) + 1;
    });

    const sortedByFreq = Object.entries(freqMap).sort((a, b) => b[1] - a[1]);
    return parseInt(sortedByFreq[0][0]);
};

// --- Main Component ---
const ColorGameTable = () => {
    const [data, setData] = useState([]);
    const [nextPeriod, setNextPeriod] = useState(0);
    const [countdown, setCountdown] = useState(60);
    const [isOneMinute, setIsOneMinute] = useState(true);
    const [predictedNumber, setPredictedNumber] = useState(null);

    const getISTTime = () => {
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        return new Date(
            now.getTime() + istOffset - now.getTimezoneOffset() * 60000
        );
    };

    const fetchData = useCallback(async () => {
        try {
            const response = await fetch(
                "https://vgaserver3-679685875451.asia-south1.run.app/minute1_getFullRecord/"
            );
            const result = await response.json();

            const formatted = result.map((item) => ({
                period: item.id,
                number: item.number,
            }));

            setData(formatted);
            const latestPeriod = formatted[0]?.period || 0;
            setNextPeriod(latestPeriod + 1);

            // Predict the next number using full data
            const prediction = predictNextNumber(formatted);
            setPredictedNumber(prediction);
        } catch (error) {
            console.error("Fetch error:", error);
        }
    }, []);

    const startTimer = useCallback(() => {
        const updateTimer = () => {
            const now = getISTTime();
            const seconds = now.getSeconds();
            const count = 59 - seconds;
            setCountdown(count);
            if (count <= 1) fetchData();
        };

        updateTimer();
        setInterval(updateTimer, 1000);
        setInterval(fetchData, 10000);
    }, [fetchData]);

    useEffect(() => {
        startTimer();
        fetchData();
        const intervalId = setInterval(() => {
            fetchData();
        }, 30000);
        return () => clearInterval(intervalId);
    }, [fetchData, startTimer]);

    const getFormattedCountdown = (timeInSeconds) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;
        return `${minutes < 10 ? "0" : ""}${minutes}:${
            seconds < 10 ? "0" : ""
        }${seconds}`;
    };

    const getColorEmoji = (num) => {
        if (num === 0) return "🔴🟣";
        if (num === 5) return "🟢🟣";
        return num % 2 === 0 ? "🔴" : "🟢";
    };

    const getSize = (num) => (num <= 4 ? "Small" : "Big");

    const getCircleStyle = (num) => {
        if (num === 0) {
            return {
                backgroundColor: "#d00000",
                color: "#fff",
                border: "2px solid purple",
            };
        }
        if (num === 5) {
            return {
                backgroundColor: "#00a000",
                color: "#fff",
                border: "2px solid purple",
            };
        }
        return {
            backgroundColor: num % 2 === 0 ? "#d00000" : "#00a000",
            color: "#fff",
        };
    };

    return (
        <div className="color-game-container">
            <div className="button-container">
                <button
                    onClick={() => setIsOneMinute(true)}
                    className={isOneMinute ? "active" : ""}
                >
                    1 Minute
                </button>
                <button
                    onClick={() => setIsOneMinute(false)}
                    className={!isOneMinute ? "active" : ""}
                >
                    3 Minute
                </button>
            </div>

            {isOneMinute ? (
                <div className="next-period-container">
                    <div className="prediction-cont">
                        <div className="prediction">
                            <h4
                                className="prediction-text"
                                style={{
                                    color: "white",
                                    backgroundColor:
                                        predictedNumber % 2 === 0
                                            ? "red"
                                            : "green",
                                }}
                            >
                                Join:{" "}
                                {predictedNumber % 2 === 0 ? "RED" : "GREEN"}
                            </h4>

                            {predictedNumber !== null ? (
                                <div
                                    style={{
                                        display: "inline-block",
                                        width: "40px",
                                        height: "40px",
                                        lineHeight: "40px",
                                        borderRadius: "50%",
                                        textAlign: "center",
                                        backgroundColor:
                                            predictedNumber % 2 === 0
                                                ? "red"
                                                : "green",
                                        color: "white",
                                        fontWeight: "bold",
                                        border: "2px solid white",
                                    }}
                                >
                                    {predictedNumber}
                                </div>
                            ) : (
                                "Calculating..."
                            )}
                        </div>

                        <div className="countdown">
                            <div className="next-period">
                                <h3>Next Period: {nextPeriod}</h3>
                            </div>
                            <div className="timer">
                                <span>
                                    Countdown:{" "}
                                    <span id="timer">
                                        {getFormattedCountdown(countdown)}
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="coming-soon-container">
                    <h3>Coming Soon...</h3>
                </div>
            )}

            {isOneMinute && (
                <>
                    <h2 className="color-game-heading">Color Game History</h2>
                    <div className="color-game-table-wrapper">
                        <table className="color-game-table">
                            <thead>
                                <tr>
                                    <th>Period</th>
                                    <th>Number</th>
                                    <th>Color</th>
                                    <th>Size</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map(({ period, number }) => (
                                    <tr key={period}>
                                        <td>{period}</td>
                                        <td>
                                            <div
                                                className="number-circle"
                                                style={getCircleStyle(number)}
                                            >
                                                {number}
                                            </div>
                                        </td>
                                        <td>{getColorEmoji(number)}</td>
                                        <td>{getSize(number)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default ColorGameTable;
