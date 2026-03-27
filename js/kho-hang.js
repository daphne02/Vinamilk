// ==========================================
// 1. DỮ LIỆU MÔ PHỎNG (MOCK DATABASE)
// ==========================================

// Bảng Tồn kho Tổng (Phục vụ xuất/nhập/kiểm kê)
let productsDb = [
    { id: "SP01", name: "Sữa tươi tiệt trùng 180ml", category: "Sữa nước", stock: 150, unit: "Thùng" },
    { id: "SP02", name: "Sữa chua có đường 100g", category: "Sữa chua", stock: 50, unit: "Thùng" },
    { id: "SP03", name: "Sữa đặc Ông Thọ", category: "Sữa đặc", stock: 10, unit: "Thùng" },
    { id: "SP04", name: "Sữa bột Dielac Alpha", category: "Sữa bột", stock: 120, unit: "Lon" }
];

// Bảng Quản lý Lô hàng (Phục vụ cảnh báo Date)
// Giả định ngày hôm nay là: 27/03/2026
const batchesDb = [
    { batchId: "L001", prodName: "Sữa chua có đường 100g", mfg: "2026-01-10", exp: "2026-04-10", stock: 20 }, // Cận date (< 1 tháng)
    { batchId: "L002", prodName: "Sữa tươi tiệt trùng 180ml", mfg: "2025-12-20", exp: "2026-06-20", stock: 150 },// Bình thường
    { batchId: "L003", prodName: "Sữa bột Dielac Alpha", mfg: "2024-03-01", exp: "2026-03-30", stock: 5 },  // Rất cận date (Sắp hết hạn)
    { batchId: "L004", prodName: "Sữa đặc Ông Thọ", mfg: "2026-02-01", exp: "2027-02-01", stock: 10 }       // Bình thường
];

// Ngày giả lập hiện tại để test cảnh báo cận date
const CURRENT_DATE = new Date("2026-03-27"); 

// Lịch sử kiểm kê
let auditHistory = [];

// ==========================================
// 2. RENDER GIAO DIỆN
// ==========================================

// Hàm A: Render Bảng Lô hàng & Cảnh báo Date
// Hàm A: Render Bảng Lô hàng & Cảnh báo Date (ĐÃ SỬA CHỈ HIỆN HÀNG CẬN DATE)
function renderBatchTable() {
    const tbody = document.getElementById("batchTableBody");
    tbody.innerHTML = "";

    let hasWarningItem = false; // Biến kiểm tra xem có hàng cận date không

    batchesDb.forEach(batch => {
        const expDate = new Date(batch.exp);
        // Tính số ngày còn lại
        const diffTime = expDate - CURRENT_DATE;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // CHỈ RENDER NẾU SỐ NGÀY <= 30 (CẬN DATE)
        if (diffDays <= 30) {
            hasWarningItem = true; // Ghi nhận là có hàng cận date
            
            const rowHTML = `
                <tr class="row-danger">
                    <td><strong>${batch.batchId}</strong></td>
                    <td>${batch.prodName}</td>
                    <td>${batch.mfg}</td>
                    <td>${batch.exp}</td>
                    <td>${batch.stock}</td>
                    <td><span class="badge-danger">Cận Date (${diffDays} ngày)</span></td>
                </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', rowHTML);
        }
    });

    // Nếu duyệt xong mà KHÔNG CÓ mặt hàng nào cận date -> Hiện thông báo an toàn
    if (!hasWarningItem) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 30px; color: #28a745; font-weight: 600; font-size: 16px;">
                    <i class="fas fa-check-circle" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
                    Tuyệt vời! Hiện tại không có lô hàng nào sắp hết hạn.
                </td>
            </tr>
        `;
    }
}
// Hàm B: Render Bảng Tồn Kho Tổng
function renderInventoryTable() {
    const tbody = document.getElementById("inventoryTableBody");
    tbody.innerHTML = "";

    productsDb.forEach(prod => {
        const rowHTML = `
            <tr>
                <td><strong>${prod.id}</strong></td>
                <td>${prod.name}</td>
                <td>${prod.category}</td>
                <td style="font-size: 16px; font-weight: bold; color: #0056b3;">${prod.stock}</td>
                <td>${prod.unit}</td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', rowHTML);
    });
}

// ==========================================
// 3. LOGIC KIỂM KÊ KHO (TÍNH ĐỘ LỆCH)
// ==========================================

function openAuditModal() {
    document.getElementById("auditId").value = "PKK-" + Math.floor(Math.random() * 10000);
    document.getElementById("auditDate").valueAsDate = new Date();
    
    const tbody = document.getElementById("auditTableItems");
    tbody.innerHTML = "";

    // Đổ danh sách sản phẩm vào form kiểm kê
    productsDb.forEach((prod, index) => {
        const rowHTML = `
            <tr data-index="${index}">
                <td><strong>${prod.id}</strong> - ${prod.name}</td>
                <td class="text-center" style="font-size: 16px; font-weight: bold;">
                    <span class="sys-qty">${prod.stock}</span>
                </td>
                <td>
                    <input type="number" class="input-audit actual-qty" value="${prod.stock}" min="0">
                </td>
                <td class="text-center">
                    <span class="diff-display diff-zero">0</span>
                </td>
                <td>
                    <input type="text" class="input-note" placeholder="Lý do nếu có lệch...">
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', rowHTML);
    });

    // Lắng nghe sự kiện thay đổi SL Thực tế để tính độ lệch
    document.querySelectorAll(".actual-qty").forEach(input => {
        input.addEventListener("input", function() {
            const row = this.closest("tr");
            const sysQty = parseInt(row.querySelector(".sys-qty").innerText);
            let actualQty = parseInt(this.value);
            
            // Xử lý nếu người dùng xóa trống input
            if(isNaN(actualQty)) actualQty = 0; 

            const diff = actualQty - sysQty;
            const diffSpan = row.querySelector(".diff-display");
            
            diffSpan.innerText = diff > 0 ? "+" + diff : diff;

            // Đổi màu hiển thị
            if (diff > 0) diffSpan.className = "diff-display diff-positive";
            else if (diff < 0) diffSpan.className = "diff-display diff-negative";
            else diffSpan.className = "diff-display diff-zero";
        });
    });

    document.getElementById("auditModal").style.display = "flex";
}

// Lưu phiếu kiểm kê & Cập nhật
function saveAudit() {
    const rows = document.getElementById("auditTableItems").querySelectorAll("tr");
    let hasChanges = false;
    let auditRecord = {
        id: document.getElementById("auditId").value,
        date: document.getElementById("auditDate").value,
        user: document.getElementById("auditUser").value,
        changes: []
    };

    rows.forEach(row => {
        const index = row.getAttribute("data-index");
        const sysQty = parseInt(row.querySelector(".sys-qty").innerText);
        const actualQty = parseInt(row.querySelector(".actual-qty").value) || 0;
        const note = row.querySelector(".input-note").value;

        if (sysQty !== actualQty) {
            hasChanges = true;
            // Lưu lịch sử
            auditRecord.changes.push({
                prodName: productsDb[index].name,
                oldQty: sysQty,
                newQty: actualQty,
                diff: actualQty - sysQty,
                reason: note
            });

            // Cập nhật lại tồn kho trong Database
            productsDb[index].stock = actualQty;
        }
    });

    if (hasChanges) {
        auditHistory.push(auditRecord);
        console.log("Lịch sử kiểm kê:", auditHistory); // Log lại để IT có thể track
        alert(`✅ KIỂM KÊ HOÀN TẤT!\nHệ thống đã lưu lịch sử chỉnh sửa bởi: ${auditRecord.user}\nSố lượng tồn kho đã được cập nhật theo thực tế.`);
    } else {
        alert("Khớp 100%! Không có sự chênh lệch nào được ghi nhận.");
    }

    document.getElementById("auditModal").style.display = "none";
    renderInventoryTable(); // Load lại bảng kho tổng
}

// ==========================================
// 4. KHỞI TẠO & GẮN SỰ KIỆN
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // Chạy khi load trang
    renderBatchTable();
    renderInventoryTable();

    // Sự kiện Modal
    document.getElementById("btnOpenAudit").addEventListener("click", openAuditModal);
    
    const closeAudit = () => document.getElementById("auditModal").style.display = "none";
    document.getElementById("closeAuditModal").addEventListener("click", closeAudit);
    document.getElementById("btnCancelAudit").addEventListener("click", closeAudit);
    
    // Đóng popup khi click ngoài
    window.addEventListener("click", function(event) {
        if (event.target === document.getElementById("auditModal")) closeAudit();
    });

    // Lưu kiểm kê
    document.getElementById("btnSaveAudit").addEventListener("click", saveAudit);

    // Sự kiện Gửi báo cáo Sale
    document.getElementById("btnSendAlert").addEventListener("click", () => {
        alert("📨 Đã gửi danh sách các lô hàng cận date qua Zalo/Email cho Đội Sale để chạy khuyến mãi!");
    });
});