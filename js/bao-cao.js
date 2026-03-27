// ==========================================
// 1. DỮ LIỆU MÔ PHỎNG CHI TIẾT ĐƠN HÀNG
// ==========================================
const salesReportDb = [
    { id: "XH-2001", date: "2026-03-05", customer: "Tạp hóa Cô Ba", qty: 150, cost: 7500000, revenue: 9500000, paid: 9500000 },
    { id: "XH-2002", date: "2026-03-12", customer: "Đại lý cấp 2 - Quận 1", qty: 500, cost: 25000000, revenue: 32000000, paid: 20000000 },
    { id: "XH-2003", date: "2026-03-18", customer: "Siêu thị Mini Mart", qty: 300, cost: 15000000, revenue: 20000000, paid: 20000000 },
    { id: "XH-2004", date: "2026-03-25", customer: "Tạp hóa Cô Ba", qty: 100, cost: 5000000, revenue: 6500000, paid: 3000000 },
    { id: "XH-2005", date: "2026-03-26", customer: "Đại lý cấp 2 - Quận 1", qty: 200, cost: 10000000, revenue: 13000000, paid: 0 }
];

let currentChart = null;
const formatCurrency = (num) => num.toLocaleString('vi-VN') + "đ";

// ==========================================
// 2. LOGIC RENDER BÁO CÁO KINH DOANH
// ==========================================
function renderBusinessDashboard(dataArray) {
    let totalOrders = dataArray.length;
    let totalQty = 0;
    let totalCost = 0;
    let totalRevenue = 0;
    
    const tbody = document.getElementById("reportTableBody");
    tbody.innerHTML = "";
    
    const chartDataMap = {};

    if (dataArray.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 20px;">Không có dữ liệu đơn hàng trong khoảng thời gian này.</td></tr>`;
    }

    dataArray.forEach(order => {
        const profit = order.revenue - order.cost;
        totalQty += order.qty;
        totalCost += order.cost;
        totalRevenue += order.revenue;

        if(!chartDataMap[order.date]) {
            chartDataMap[order.date] = { revenue: 0, profit: 0 };
        }
        chartDataMap[order.date].revenue += order.revenue;
        chartDataMap[order.date].profit += profit;

        const rowHTML = `
            <tr>
                <td><strong>${order.id}</strong></td>
                <td>${order.date}</td>
                <td>${order.customer}</td>
                <td><strong>${order.qty}</strong></td>
                <td style="color: #dc3545;">${formatCurrency(order.cost)}</td>
                <td style="color: #28a745; font-weight: bold;">${formatCurrency(order.revenue)}</td>
                <td style="color: #0056b3; font-weight: bold;">${formatCurrency(profit)}</td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', rowHTML);
    });

    const totalProfit = totalRevenue - totalCost;

    document.getElementById("totalOrders").innerText = totalOrders;
    document.getElementById("totalQty").innerText = totalQty.toLocaleString('vi-VN');
    document.getElementById("totalCost").innerText = formatCurrency(totalCost);
    document.getElementById("totalRevenue").innerText = formatCurrency(totalRevenue);
    document.getElementById("totalProfit").innerText = formatCurrency(totalProfit);

    const labels = Object.keys(chartDataMap).sort();
    const chartRev = labels.map(date => chartDataMap[date].revenue);
    const chartProf = labels.map(date => chartDataMap[date].profit);

    renderChart(labels, chartRev, chartProf);
}

// ==========================================
// 3. LOGIC RENDER BÁO CÁO CÔNG NỢ (CHỈ HIỆN NGƯỜI CÒN NỢ)
// ==========================================
function renderDebtTable(dataArray) {
    const tbody = document.getElementById("debtTableBody");
    tbody.innerHTML = "";
    
    const debtMap = {};

    dataArray.forEach(order => {
        if(!debtMap[order.customer]) {
            debtMap[order.customer] = { totalBought: 0, totalPaid: 0, debt: 0 };
        }
        debtMap[order.customer].totalBought += order.revenue;
        debtMap[order.customer].totalPaid += order.paid;
    });

    let hasDebt = false;

    for (let customer in debtMap) {
        const data = debtMap[customer];
        data.debt = data.totalBought - data.totalPaid;
        
        if (data.debt > 0) {
            hasDebt = true;
            const rowHTML = `
                <tr>
                    <td><strong>${customer}</strong></td>
                    <td>${formatCurrency(data.totalBought)}</td>
                    <td style="color: #0056b3;">${formatCurrency(data.totalPaid)}</td>
                    <td class="text-danger">${formatCurrency(data.debt)}</td>
                    <td><span class="badge-debt">Đang nợ</span></td>
                </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', rowHTML);
        }
    }

    if (!hasDebt) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center" style="padding: 30px; color: #28a745; font-weight: 600; font-size: 15px;">
                    <i class="fas fa-check-circle" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
                    Tuyệt vời! Tất cả đại lý đã thanh toán đầy đủ, hiện không có ai nợ.
                </td>
            </tr>
        `;
    }
}

// ==========================================
// 4. VẼ BIỂU ĐỒ (CHART.JS)
// ==========================================
function renderChart(labels, revenueData, profitData) {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    if (currentChart) currentChart.destroy();

    currentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Doanh thu',
                    data: revenueData,
                    backgroundColor: 'rgba(40, 167, 69, 0.7)',
                    borderRadius: 5
                },
                {
                    label: 'Lợi nhuận (Lãi)',
                    data: profitData,
                    backgroundColor: 'rgba(0, 86, 179, 0.7)',
                    borderRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: value => value.toLocaleString('vi-VN') + "đ" }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: context => context.dataset.label + ': ' + context.parsed.y.toLocaleString('vi-VN') + "đ"
                    }
                }
            }
        }
    });
}

// ==========================================
// 5. CÁC HÀM LỌC VÀ XUẤT FILE (LỌC THEO THÁNG/NĂM CHUẨN)
// ==========================================
function filterData() {
    const selectedMonth = document.getElementById("filterMonth").value;
    const selectedYear = document.getElementById("filterYear").value;
    const searchMonth = `${selectedYear}-${selectedMonth}`; 

    const filteredData = salesReportDb.filter(item => {
        return item.date.startsWith(searchMonth);
    });

    renderBusinessDashboard(filteredData);
    renderDebtTable(filteredData);
}

function resetFilter() {
    document.getElementById("filterMonth").value = "03";
    document.getElementById("filterYear").value = "2026";
    renderBusinessDashboard(salesReportDb);
    renderDebtTable(salesReportDb);
}

function exportToExcel() {
    const wb = XLSX.utils.book_new();
    const wsReport = XLSX.utils.table_to_sheet(document.getElementById("reportTable"));
    XLSX.utils.book_append_sheet(wb, wsReport, "Chi_Tiet_Kinh_Doanh");
    const wsDebt = XLSX.utils.table_to_sheet(document.getElementById("debtTable"));
    XLSX.utils.book_append_sheet(wb, wsDebt, "Tong_Hop_Cong_No");
    XLSX.writeFile(wb, "Bao_Cao_Vinamilk.xlsx");
}

function exportToPDF() {
    alert("Hệ thống sẽ mở hộp thoại In. Vui lòng chọn 'Save as PDF' (Lưu dưới dạng PDF).");
    window.print();
}

// ==========================================
// 6. KHỞI TẠO KHI TRANG LOAD
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("filterMonth").value = "03";
    document.getElementById("filterYear").value = "2026";
    
    filterData();

    document.getElementById("btnFilter").addEventListener("click", filterData);
    document.getElementById("btnResetFilter").addEventListener("click", resetFilter);
    document.getElementById("btnExportExcel").addEventListener("click", exportToExcel);
    document.getElementById("btnExportPDF").addEventListener("click", exportToPDF);
});