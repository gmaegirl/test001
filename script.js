document.addEventListener("DOMContentLoaded", () => {
    const table = document.getElementById("profitTable");
    const addRowButton = document.getElementById("addRow");
    const profitLockCheckbox = document.getElementById("profitLock");
    const lossLockCheckbox = document.getElementById("lossLock");

    // 엔터 입력 시 줄바꿈 방지 및 값 포맷팅
    table.addEventListener("keydown", (event) => {
        if (event.target.tagName === "TD" && event.target.isContentEditable && event.key === "Enter") {
            event.preventDefault();
            formatCellValue(event.target);
            updateOriginalValue(event.target);
            event.target.blur();
            updateCalculations();
        }
    });

    // 값 입력 중 실시간 반영
    table.addEventListener("input", (event) => {
        if (event.target.tagName === "TD" && event.target.isContentEditable) {
            const cell = event.target;
            let value = cell.textContent.trim().replace(/,/g, "").replace(/[^0-9.%]/g, "");

            if ([0, 2, 4, 6, 7, 8, 9, 12].includes(cell.cellIndex)) {
                cell.textContent = value; // 숫자
            } else if ([1, 3, 5, 11].includes(cell.cellIndex)) {
                value = value.replace(/%/g, "");
                cell.textContent = value + "%"; // 퍼센트
            }
        }
    });

    // 값 포맷팅
    function formatCellValue(cell) {
        const value = cell.textContent.trim();
        const cellIndex = cell.cellIndex;

        if ([0, 2, 4, 6, 7, 8, 9, 12].includes(cellIndex)) {
            const numberValue = parseInt(value.replace(/,/g, ""), 10) || 0;
            cell.textContent = numberValue.toLocaleString();
        } else if ([1, 3, 5, 11].includes(cellIndex)) {
            const percentValue = parseFloat(value.replace(/%/g, "")) || 0;
            cell.textContent = percentValue + "%";
        }
    }

    // 시작금 원본 저장
    function updateOriginalValue(cell) {
        if (cell.cellIndex === 0) {
            const startAmount = parseInt(cell.textContent.replace(/,/g, ""), 10) || 0;
            cell.setAttribute("data-original", startAmount);
        }
    }

    // 체크박스 반영
    table.addEventListener("change", (event) => {
        if (event.target.classList.contains("stopLoss")) {
            updateCalculations();
        }
    });

    // 행 추가
    addRowButton.addEventListener("click", () => {
        const rows = table.querySelectorAll("tbody tr");
        const lastRow = rows[rows.length - 1];
        const newRow = lastRow.cloneNode(true);

        newRow.querySelectorAll("td").forEach((cell, index) => {
            if (index === 0) {
                const startAmount = parseInt(lastRow.cells[0]?.textContent.replace(/,/g, ""), 10) || 0;
                cell.textContent = startAmount.toLocaleString();
                cell.setAttribute("data-original", startAmount);
            } else if ([1, 5].includes(index)) {
                cell.textContent = profitLockCheckbox.checked ? lastRow.cells[index]?.textContent || "0%" : "0%";
            } else if (index === 11) {
                cell.textContent = lossLockCheckbox.checked ? lastRow.cells[index]?.textContent || "0%" : "0%";
            } else if (index === 12) {
                cell.textContent = "0";
            } else if (cell.querySelector(".stopLoss")) {
                cell.querySelector(".stopLoss").checked = false;
            } else if (cell.querySelector(".deleteRow")) {
                cell.querySelector(".deleteRow").onclick = deleteRow;
                cell.querySelector(".deleteRow").style.display = "inline-block";
            }
        });

        table.querySelector("tbody").appendChild(newRow);
        updateCalculations();
    });

    // 행 삭제
    function deleteRow(event) {
        const row = event.target.closest("tr");
        row.remove();
        updateCalculations();
    }

    table.addEventListener("click", (event) => {
        if (event.target.classList.contains("deleteRow")) {
            deleteRow(event);
        }
    });

    // 계산 업데이트
    function updateCalculations() {
        const rows = table.querySelectorAll("tbody tr");
        rows.forEach((row, index) => {
            const startAmountCell = row.cells[0];
            const profit1Cell = row.cells[1];
            const profit1AmountCell = row.cells[2];
            const finalAmount1Cell = row.cells[3];
            const splitSellCell = row.cells[4];
            const startAmount2Cell = row.cells[5];
            const profit2Cell = row.cells[6];
            const profit2AmountCell = row.cells[7];
            const finalAmount2Cell = row.cells[8];
            const totalProfitCell = row.cells[9];
            const avgProfitCell = row.cells[10];
            const stopLossCheck = row.querySelector(".stopLoss");
            const lossPercentCell = row.cells[11];
            const lossAmountCell = row.cells[12];

            const startAmount = parseInt(startAmountCell.textContent.replace(/,/g, ""), 10) || 0;
            const profit1Rate = parseFloat(profit1Cell.textContent.replace(/%/g, "")) || 0;
            const profit1Amount = Math.round(startAmount * (profit1Rate / 100));
            profit1AmountCell.textContent = profit1Amount.toLocaleString();

            const lossPercent = parseFloat(lossPercentCell.textContent.replace(/%/g, "")) || 0;
            const lossAmount = Math.round(startAmount * (lossPercent / 100));
            lossAmountCell.textContent = lossAmount.toLocaleString();

            if (stopLossCheck) {
                const originalStartAmount = parseInt(startAmountCell.getAttribute("data-original"), 10) || startAmount;
                if (stopLossCheck.checked) {
                    const newStartAmount = originalStartAmount - lossAmount;
                    startAmountCell.textContent = newStartAmount > 0 ? newStartAmount.toLocaleString() : "0";
                } else {
                    startAmountCell.textContent = originalStartAmount.toLocaleString();
                }
            }

            finalAmount1Cell.textContent = (startAmount + profit1Amount).toLocaleString();

            const splitRate = parseFloat(splitSellCell.textContent.replace(/%/g, "")) || 0;
            const startAmount2 = Math.round(startAmount * (splitRate / 100));
            startAmount2Cell.textContent = startAmount2.toLocaleString();

            const profit2Rate = parseFloat(profit2Cell.textContent.replace(/%/g, "")) || 0;
            const profit2Amount = Math.round(startAmount2 * (profit2Rate / 100));
            profit2AmountCell.textContent = profit2Amount.toLocaleString();

            finalAmount2Cell.textContent = (startAmount2 + profit2Amount).toLocaleString();

            const totalProfit = profit1Amount + profit2Amount;
            totalProfitCell.textContent = totalProfit.toLocaleString();

            avgProfitCell.textContent = ((profit1Rate + profit2Rate) / 2).toFixed(2) + "%";

            const deleteButton = row.querySelector(".deleteRow");
            if (deleteButton) {
                deleteButton.style.display = index === 0 ? "none" : "inline-block";
            }
        });
    }

    function saveUserDataToLocalStorage(tableId) {
        const table = document.getElementById(tableId);
        const rows = Array.from(table.querySelectorAll("tbody tr"));
        const data = rows.map(row => {
            return Array.from(row.cells).map(cell => {
                if (cell.querySelector("input[type='checkbox']")) {
                    return cell.querySelector("input[type='checkbox']").checked;
                }
                return cell.textContent.trim();
            });
        });
        localStorage.setItem("userData", JSON.stringify(data));
        alert("데이터가 저장되었습니다!");
    }

    function loadUserDataFromLocalStorage(tableId) {
        const table = document.getElementById(tableId);
        const savedData = JSON.parse(localStorage.getItem("userData"));

        if (savedData && Array.isArray(savedData)) {
            const tbody = table.querySelector("tbody");
            tbody.innerHTML = "";
            savedData.forEach((rowData, rowIndex) => {
                const row = document.createElement("tr");
                rowData.forEach((cellData, cellIndex) => {
                    const cell = document.createElement("td");
                    if (cellIndex === 12) {
                        const checkbox = document.createElement("input");
                        checkbox.type = "checkbox";
                        checkbox.className = "stopLoss";
                        checkbox.checked = cellData;
                        cell.appendChild(checkbox);
                    } else if (cellIndex === 13) {
                        const deleteButton = document.createElement("button");
                        deleteButton.className = "deleteRow";
                        deleteButton.textContent = "X";
                        deleteButton.style.display = rowIndex === 0 ? "none" : "inline-block"; // 첫 행은 삭제 버튼 숨김
                        deleteButton.onclick = deleteRow;
                        cell.appendChild(deleteButton);
                    } else {
                        cell.textContent = cellData;
                        if ([0, 1, 3, 5, 10].includes(cellIndex)) {
                            cell.setAttribute("contenteditable", "true");
                            cell.classList.add("editable");
                        }
                    }
                    row.appendChild(cell);
                });
                tbody.appendChild(row);
            });
            updateCalculations();
            alert("데이터가 로드되었습니다!");
        } else {
            alert("저장된 데이터가 없습니다.");
        }
    }

    // 첫 번째 행의 삭제 버튼 숨기기 (초기화)
    const firstRowDeleteButton = table.querySelector("tbody tr:first-child .deleteRow");
    if (firstRowDeleteButton) {
        firstRowDeleteButton.style.display = "none";
    }
});
