// Fetch live gold price and trigger flash effect
async function fetchLivePrice() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        const newPrice = data.price;

        // Check if the price has changed
        if (newPrice !== livePrice) {
            livePrice = newPrice;
            document.getElementById("livePrice").innerText = `${livePrice} USD/Ounce`;

            // Trigger flash effect on live price
            triggerFlashEffect(document.getElementById("livePrice"));

            // Update P/L for all orders
            updateProfitLoss();
        }
    } catch (error) {
        console.error("Error fetching live price:", error);
        document.getElementById("livePrice").innerText = "Error fetching price";
    }
}

// Recalculate P/L and trigger flash effect
function updateProfitLoss() {
    orders.forEach(order => {
        const marketValue = (livePrice / 31.1035) * USD_TO_AED * PURITY * TT_WEIGHT * order.ttBars;
        order.profitLoss = marketValue - order.totalValue;
    });

    renderOrders();

    // Trigger flash effect for P/L column in the table
    const profitLossCells = document.querySelectorAll("#orderTable td:nth-child(7)");
    profitLossCells.forEach(cell => triggerFlashEffect(cell));
}

// Trigger flash effect on an element
function triggerFlashEffect(element) {
    element.classList.add("flash");
    setTimeout(() => element.classList.remove("flash"), 500); // Remove the class after animation ends
}

// Export orders to a CSV file
function exportOrdersToCSV() {
    if (orders.length === 0) {
        alert("No orders to export!");
        return;
    }

    const csvRows = [];
    const headers = [
        "ID",
        "Purchased From",
        "Purchased By",
        "TT Bars",
        "Ounce Price (USD)",
        "Premium (AED)",
        "Total Value (AED)",
        "Profit/Loss (AED)"
    ];
    csvRows.push(headers.join(",")); // Add headers

    orders.forEach(order => {
        const row = [
            order.id,
            order.purchasedFrom,
            order.purchasedBy,
            `${order.ttBars} x ${TT_WEIGHT}g`,
            order.ouncePrice.toFixed(2),
            order.premium.toFixed(2),
            order.totalValue.toFixed(2),
            order.profitLoss.toFixed(2)
        ];
        csvRows.push(row.join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "gold_orders.csv";
    a.click();

    URL.revokeObjectURL(url);
}

// Attach export functionality to the button
document.getElementById("exportCsv").addEventListener("click", exportOrdersToCSV);
