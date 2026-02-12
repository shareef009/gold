const API_URL = "https://api.gold-api.com/price/XAU"; // Replace with your API URL.
const USD_TO_AED = 3.674;
const TT_WEIGHT = 116.64;
const PURITY = 0.9996;
let orders = [];
let livePrice = 0;

// Fetch live gold price
async function fetchLivePrice() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        livePrice = data.price;
        document.getElementById("livePrice").innerText = `${livePrice} USD/Ounce`;
    } catch (error) {
        console.error("Error fetching live price:", error);
        document.getElementById("livePrice").innerText = "Error fetching price";
    }
}

// Load orders from local storage
function loadOrders() {
    const storedOrders = localStorage.getItem("goldOrders");
    if (storedOrders) {
        orders = JSON.parse(storedOrders);
        renderOrders();
    }
}

// Save orders to local storage
function saveOrders() {
    localStorage.setItem("goldOrders", JSON.stringify(orders));
}

// Calculate total value and P/L
function calculateValues(ouncePrice, ttBars, premium) {
    const totalValue = (ouncePrice / 31.1035) * USD_TO_AED * PURITY * TT_WEIGHT * ttBars + premium;
    const marketValue = (livePrice / 31.1035) * USD_TO_AED * PURITY * TT_WEIGHT * ttBars;
    const profitLoss = marketValue - totalValue;
    return { totalValue, profitLoss };
}

// Render orders in the table
function renderOrders() {
    const orderTable = document.getElementById("orderTable");
    orderTable.innerHTML = "";
    orders.forEach((order, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${order.id}</td>
            <td>${order.purchasedFrom}</td>
            <td>${order.purchasedBy}</td>
            <td>${order.ttBars} x ${TT_WEIGHT}g</td>
            <td>${order.ouncePrice.toFixed(2)} USD</td>
            <td>${order.totalValue.toFixed(2)} AED</td>
            <td>${order.profitLoss.toFixed(2)} AED</td>
            <td class="actions"><button class="close-btn" onclick="closeOrder(${index})">Close</button></td>
        `;
        orderTable.appendChild(row);
    });
}

// Add a new order
function addOrder(event) {
    event.preventDefault();
    const ttBars = parseFloat(document.getElementById("ttBars").value);
    const ouncePrice = parseFloat(document.getElementById("ouncePrice").value);
    const purchasedFrom = document.getElementById("purchasedFrom").value;
    const purchasedBy = document.getElementById("purchasedBy").value;
    const premium = parseFloat(document.getElementById("premium").value) || 0;

    const { totalValue, profitLoss } = calculateValues(ouncePrice, ttBars, premium);

    const newOrder = {
        id: Date.now(),
        ttBars,
        ouncePrice,
        purchasedFrom,
        purchasedBy,
        premium,
        totalValue,
        profitLoss
    };

    orders.push(newOrder);
    saveOrders();
    renderOrders();
    document.getElementById("orderForm").reset();
}

// Close an order
function closeOrder(index) {
    orders.splice(index, 1);
    saveOrders();
    renderOrders();
}

// Initialize app
fetchLivePrice();
setInterval(fetchLivePrice, 60000); // Refresh price every 1 minute
document.getElementById("orderForm").addEventListener("submit", addOrder);
loadOrders();

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
