// ==========================================
// 1. MOCK DATABASE TOÀN CỤC
// ==========================================
window.ordersDb = [
    {
        id: "NH-1001", date: "2026-03-20", supplier: "Kho tổng Vinamilk", status: "completed",
        items: [ { name: "Sữa tươi tiệt trùng 180ml", qty: 500, note: "Nhập đủ" } ]
    },
    {
        id: "NH-1002", date: "2026-03-25", supplier: "Nhà máy sữa Nghệ An", status: "pending",
        items: [ { name: "Sữa chua có đường 100g", qty: 200, note: "Dự trù đợt 1" } ]
    },
    {
        id: "NH-1003", date: "2026-03-26", supplier: "Nhà máy sữa Bình Dương", status: "pending",
        items: [ { name: "Sữa đặc Ông Thọ", qty: 150, note: "Gấp" } ]
    }
];

// ==========================================
// 2. CÁC HÀM XỬ LÝ TOÀN CỤC
// ==========================================

// Hàm Render Bảng Lịch Sử
window.renderHistoryTable = function(filterStatus) { 
    const historyTableBody = document.getElementById("historyTableBody");
    if (!historyTableBody) return;
    historyTableBody.innerHTML = "";
    
    const filteredOrders = window.ordersDb.filter(order => filterStatus === "all" || order.status === filterStatus);

    filteredOrders.forEach(order => {
        // Tính tổng số lượng
        const totalQty = order.items.reduce((sum, item) => sum + item.qty, 0);

        const isPending = order.status === "pending";
        const statusBadge = isPending 
            ? `<span class="badge-pending">⏳ Chờ xác nhận</span>` 
            : `<span class="badge-completed">✅ Đã hoàn thành</span>`;
        
        const confirmBtn = isPending 
            ? `<button class="btn-action-confirm" onclick="confirmOrder('${order.id}')"><i class="fas fa-check"></i> Xác nhận</button>` 
            : "";

        const rowHTML = `
            <tr>
                <td><strong>${order.id}</strong></td>
                <td>${order.date}</td>
                <td>${order.supplier}</td>
                <td><strong>${totalQty.toLocaleString('vi-VN')}</strong></td>
                <td>${statusBadge}</td>
                <td class="text-center">
                    <button class="btn-action-view" onclick="viewOrder('${order.id}')"><i class="fas fa-eye"></i> Xem</button>
                    ${confirmBtn}
                </td>
            </tr>
        `;
        historyTableBody.insertAdjacentHTML('beforeend', rowHTML);
    });
};

// Hàm kích hoạt Bộ Lọc
window.filterOrders = function(status) {
    window.renderHistoryTable(status);
};

// Hàm Xác Nhận (Cộng kho)
window.confirmOrder = function(orderId) {
    if(confirm(`Admin có chắc chắn XÁC NHẬN phiếu ${orderId} không?\nSố lượng sẽ được cộng trực tiếp vào Tồn Kho.`)) {
        const orderIndex = window.ordersDb.findIndex(o => o.id === orderId);
        if(orderIndex !== -1) {
            window.ordersDb[orderIndex].status = "completed"; 
            alert(`✅ XÁC NHẬN THÀNH CÔNG!\nPhiếu ${orderId} đã được xử lý xong và hàng đã vào kho.`);
            
            // Cập nhật lại danh sách ngay lập tức sau khi duyệt
            const currentFilter = document.getElementById("statusFilter").value;
            window.renderHistoryTable(currentFilter); 
        }
    }
};

// Quản lý Modal
window.openModal = function() {
    document.getElementById("orderModal").style.display = "flex";
}
window.closeModal = function() {
    document.getElementById("orderModal").style.display = "none";
}

// Hàm Xem chi tiết (Chỉ đọc)
window.viewOrder = function(orderId) {
    const order = window.ordersDb.find(o => o.id === orderId);
    if(!order) return;

    const productTableBody = document.getElementById("productTableBody");
    document.getElementById("formTitle").innerText = `Chi tiết Phiếu Nhập: ${order.id}`;
    document.getElementById("orderId").value = order.id;
    document.getElementById("orderDate").value = order.date;
    document.getElementById("supplier").value = order.supplier;

    productTableBody.innerHTML = "";
    order.items.forEach(item => {
        const rowHTML = `
            <tr>
                <td><select style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;" disabled><option>${item.name}</option></select></td>
                <td><input type="number" value="${item.qty}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;" disabled></td>
                <td><input type="text" value="${item.note}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;" disabled></td>
                <td class="text-center col-action" style="display: none;"></td>
            </tr>
        `;
        productTableBody.insertAdjacentHTML('beforeend', rowHTML);
    });

    document.getElementById("orderDate").disabled = true;
    document.getElementById("supplier").disabled = true;
    document.getElementById("btnAddRow").style.display = "none";
    document.getElementById("formActionButtons").style.display = "none";
    document.getElementById("colAction").style.display = "none";

    window.openModal();
};

// ==========================================
// 3. KHỞI TẠO & SỰ KIỆN KHI TRANG LOAD
// ==========================================
document.addEventListener("DOMContentLoaded", function () {
    const statusFilter = document.getElementById("statusFilter");
    const productTableBody = document.getElementById("productTableBody");
    
    if (!productTableBody) return; 

    // Bắt buộc mặc định lọc phiếu Pending
    statusFilter.value = "pending"; 
    window.renderHistoryTable("pending"); 

    document.getElementById("orderDate").valueAsDate = new Date();

    function generateNewOrderId() {
        const lastOrder = window.ordersDb[window.ordersDb.length - 1];
        const lastNumber = lastOrder ? parseInt(lastOrder.id.split("-")[1]) : 1000;
        document.getElementById("orderId").value = "NH-" + (lastNumber + 1);
    }

    function getProductRowHTML() {
        return `
            <tr>
                <td>
                    <select class="item-name" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
                        <option value="">-- Chọn sản phẩm --</option>
                        <option value="Sữa tươi tiệt trùng 180ml">Sữa tươi tiệt trùng 180ml</option>
                        <option value="Sữa chua có đường 100g">Sữa chua có đường 100g</option>
                        <option value="Sữa đặc Ông Thọ">Sữa đặc Ông Thọ</option>
                    </select>
                </td>
                <td><input type="number" min="1" value="1" class="item-qty" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;"></td>
                <td><input type="text" class="item-note" placeholder="Ghi chú..." style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;"></td>
                <td class="text-center col-action">
                    <button onclick="this.closest('tr').remove()" style="color: red; background: none; border: none; cursor: pointer;"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    }

    document.getElementById("btnAddRow").addEventListener("click", function() {
        document.getElementById("productTableBody").insertAdjacentHTML('beforeend', getProductRowHTML());
    });

    // Mở modal thêm mới
    document.getElementById("btnCreateNew").addEventListener("click", function() {
        document.getElementById("formTitle").innerText = "Lập Phiếu Nhập Dự Trù";
        document.getElementById("orderDate").disabled = false;
        document.getElementById("supplier").disabled = false;
        document.getElementById("btnAddRow").style.display = "inline-block";
        document.getElementById("formActionButtons").style.display = "flex";
        document.getElementById("colAction").style.display = "table-cell";
        
        document.getElementById("productTableBody").innerHTML = "";
        document.getElementById("productTableBody").insertAdjacentHTML('beforeend', getProductRowHTML()); 
        generateNewOrderId();
        
        window.openModal();
    });

    // Tắt modal
    document.getElementById("closeModalBtn").addEventListener("click", window.closeModal);
    document.getElementById("btnCancelModal").addEventListener("click", window.closeModal);
    window.addEventListener("click", function(event) {
        if (event.target === document.getElementById("orderModal")) {
            window.closeModal();
        }
    });

    // ==========================================
    // XỬ LÝ LƯU PHIẾU (ĐÃ THÊM VALIDATE SỐ LƯỢNG)
    // ==========================================
    document.getElementById("btnSaveDraft").addEventListener("click", function() {
        const rows = document.getElementById("productTableBody").querySelectorAll("tr");
        if(rows.length === 0) {
            alert("Vui lòng thêm ít nhất 1 mặt hàng!"); 
            return;
        }

        // 1. KIỂM TRA SỐ LƯỢNG MỌI DÒNG PHẢI > 0
        let isValidQty = true;
        rows.forEach(row => {
            const qty = parseInt(row.querySelector(".item-qty").value);
            if (isNaN(qty) || qty <= 0) {
                isValidQty = false;
            }
        });

        if (!isValidQty) {
            alert("Lỗi: Số lượng nhập của tất cả mặt hàng phải lớn hơn 0!");
            return; // Chặn lưu phiếu
        }

        // 2. GOM DỮ LIỆU
        const newOrder = {
            id: document.getElementById("orderId").value,
            date: document.getElementById("orderDate").value,
            supplier: document.getElementById("supplier").value,
            status: "pending", 
            items: []
        };

        rows.forEach(row => {
            newOrder.items.push({
                name: row.querySelector(".item-name").value,
                qty: parseInt(row.querySelector(".item-qty").value),
                note: row.querySelector(".item-note").value
            });
        });

        // 3. ĐƯA VÀO DANH SÁCH & CẬP NHẬT GIAO DIỆN
        window.ordersDb.push(newOrder); 
        alert("Đã tạo Phiếu Dự Trù thành công!\nTrạng thái: Đang chờ Admin xác nhận.");
        
        window.closeModal(); 
        
        // Gọi lại bảng hiển thị tức thì
        statusFilter.value = "pending";
        window.renderHistoryTable("pending"); 
    });
});