import React, { useState } from "react";

const PredictionInput = () => {
    const [currentPeriod, setCurrentPeriod] = useState("");
    const [isPeriodEntered, setIsPeriodEntered] = useState(false);
    const [entryPeriod, setEntryPeriod] = useState(null);
    const [inputNumber, setInputNumber] = useState("");
    const [tableData, setTableData] = useState([]);
    const [showStartMessage, setShowStartMessage] = useState(false);

    const handlePeriodSubmit = () => {
        if (!isNaN(currentPeriod) && currentPeriod !== "") {
            const startPeriod = String(currentPeriod - 50).padStart(3, "0");
            setEntryPeriod(parseInt(startPeriod));
            setIsPeriodEntered(true);
            setShowStartMessage(true);
        }
    };

    const handleAddNumber = () => {
        if (inputNumber === "") return;

        const number = parseInt(inputNumber);
        if (isNaN(number) || number < 0 || number > 9) return;

        const paddedPeriod = String(entryPeriod).padStart(3, "0");

        const size = number <= 4 ? "Small" : "Big";
        const color = number % 2 === 0 ? "Red" : "Green";

        const newEntry = {
            period: paddedPeriod,
            number,
            size,
            color,
        };

        setTableData([newEntry, ...tableData]);
        setEntryPeriod((prev) => prev + 1);
        setInputNumber("");
        setShowStartMessage(false);
    };

    return (
        <div className="p-4 max-w-md mx-auto">
            
        </div>
    );
};

export default PredictionInput;
