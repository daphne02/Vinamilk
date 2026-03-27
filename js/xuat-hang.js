// ==========================================
// 1. DỮ LIỆU MÔ PHỎNG (MOCK DATABASE)
// ==========================================
const inventoryDb = {
    "Sữa tươi tiệt trùng 180ml": { stock: 150, price: 6500 },
    "Sữa chua có đường 100g": { stock: 50, price: 5000 },
    "Sữa đặc Ông Thọ": { stock: 10, price: 25000 },
    "Sữa bột Dielac Alpha": { stock: 0, price: 350000 } 
};

let salesDb = [
    {
        id: "XH-2001", date: "2026-03-25", customer: "Tạp hóa Cô Ba", status: "processing",
        total: 650000, items: [ { name: "Sữa tươi tiệt trùng 180ml", qty: 100, price: 6500 } ]
    },
    {
        id: "XH-2002", date: "2026-03-26", customer: "Siêu thị Mini Mart", status: "delivered",
        total: 250000, items: [ { name: "Sữa chua có đường 100g", qty: 50, price: 5000 } ]
    }
];

// ==========================================
// 2. LOGIC RENDER BẢNG LỊCH SỬ
// ==========================================
const formatCurrency = (num) => num.toLocaleString('vi-VN') + "đ";

window.renderSalesTable = function(filterStatus) {
    const tbody = document.getElementById("salesTableBody");
    if(!tbody) return;
    tbody.innerHTML = "";
    
    const filtered = salesDb.filter(order => filterStatus === "all" || order.status === filterStatus);

    filtered.forEach(order => {
        let badge = "";
        let actionBtn = `<button class="btn-action-view" onclick="viewSalesOrder('${order.id}')"><i class="fas fa-eye"></i> Xem</button>`;

        if(order.status === "processing") {
            badge = `<span class="badge-processing">📝 Đang xử lý</span>`;
            actionBtn += `<button class="btn-print" onclick="shipOrder('${order.id}')"><i class="fas fa-truck"></i> Giao hàng</button>`;
        } else if(order.status === "shipping") {
            badge = `<span class="badge-shipping">🚚 Đang giao</span>`;
            actionBtn += `<button class="btn-success" style="padding:6px 12px; margin-left:5px;" onclick="completeOrder('${order.id}')"><i class="fas fa-check-double"></i> Đã thu tiền</button>`;
        } else {
            badge = `<span class="badge-delivered">✅ Đã hoàn thành</span>`;
            actionBtn += `<button class="btn-print" onclick="printInvoice('${order.id}')"><i class="fas fa-print"></i> In HĐ</button>`;
        }

        const rowHTML = `
            <tr>
                <td><strong>${order.id}</strong></td>
                <td>${order.date}</td>
                <td>${order.customer}</td>
                <td class="text-danger"><strong>${formatCurrency(order.total)}</strong></td>
                <td>${badge}</td>
                <td class="text-center">${actionBtn}</td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', rowHTML);
    });
};

// ==========================================
// 3. LOGIC KIỂM TRA TỒN KHO & LẬP ĐƠN
// ==========================================
function getProductOptions() {
    return Object.keys(inventoryDb).map(name => `<option value="${name}">${name}</option>`).join('');
}

function addSalesRow(name = Object.keys(inventoryDb)[0], qty = 1, isReadonly = false) {
    const tbody = document.getElementById("salesTableItems");
    const prodData = inventoryDb[name] || { stock: 0, price: 0 };
    const subTotal = qty * prodData.price;
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td>
            <select class="form-control prod-select" ${isReadonly ? 'disabled' : ''}>${getProductOptions()}</select>
        </td>
        <td><span class="stock-display ${prodData.stock < 1 ? 'text-danger' : 'text-success'}">${prodData.stock}</span></td>
        <td><span class="price-display">${formatCurrency(prodData.price)}</span></td>
        <td><input type="number" class="form-control qty-input" min="1" value="${qty}" ${isReadonly ? 'disabled' : ''}></td>
        <td><strong><span class="subtotal-display">${formatCurrency(subTotal)}</span></strong></td>
        <td class="text-center col-sales-action">
            <button class="btn-delete btn-remove-row" ${isReadonly ? 'disabled' : ''}><i class="fas fa-trash"></i></button>
        </td>
    `;

    tr.querySelector(".prod-select").value = name;

    if (!isReadonly) {
        tr.querySelector(".prod-select").addEventListener("change", function() {
            const data = inventoryDb[this.value];
            const stockSpan = tr.querySelector(".stock-display");
            stockSpan.innerText = data.stock;
            stockSpan.className = `stock-display ${data.stock < 1 ? 'text-danger' : 'text-success'}`;
            tr.querySelector(".price-display").innerText = formatCurrency(data.price);
            validateStockAndCalculate();
        });

        tr.querySelector(".qty-input").addEventListener("input", validateStockAndCalculate);
        tr.querySelector(".btn-remove-row").addEventListener("click", function() {
            tr.remove();
            validateStockAndCalculate();
        });
    }

    tbody.appendChild(tr);
    if(!isReadonly) validateStockAndCalculate();
}

function validateStockAndCalculate() {
    const rows = document.getElementById("salesTableItems").querySelectorAll("tr");
    let totalOrderValue = 0;
    let hasStockError = false;

    rows.forEach(row => {
        const prodName = row.querySelector(".prod-select").value;
        const qtyInput = row.querySelector(".qty-input");
        const stockDisplay = row.querySelector(".stock-display");
        const subTotalDisplay = row.querySelector(".subtotal-display");
        
        let reqQty = parseInt(qtyInput.value) || 0;
        let availableStock = inventoryDb[prodName].stock;
        let price = inventoryDb[prodName].price;

        if (reqQty > availableStock) {
            qtyInput.classList.add("input-error");
            stockDisplay.classList.add("text-danger");
            hasStockError = true;
        } else {
            qtyInput.classList.remove("input-error");
            stockDisplay.classList.remove("text-danger");
            stockDisplay.classList.add("text-success");
        }

        let rowSubTotal = reqQty * price;
        subTotalDisplay.innerText = formatCurrency(rowSubTotal);
        totalOrderValue += rowSubTotal;
    });

    document.getElementById("orderTotalDisplay").innerText = `Tổng cộng: ${formatCurrency(totalOrderValue)}`;

    const btnProcess = document.getElementById("btnProcessOrder");
    const warningMsg = document.getElementById("stockWarning");
    
    if (hasStockError) {
        btnProcess.disabled = true;
        warningMsg.style.display = "block";
    } else {
        btnProcess.disabled = false;
        warningMsg.style.display = "none";
    }

    return { isValid: !hasStockError, total: totalOrderValue };
}

// ==========================================
// 4. KHỞI TẠO VÀ BẮT SỰ KIỆN NÚT BẤM
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("salesFilter").value = "processing";
    renderSalesTable("processing");
    document.getElementById("salesDate").valueAsDate = new Date();

    const salesModal = document.getElementById("salesModal");
    const closeModal = () => salesModal.style.display = "none";

    // Mở popup
    document.getElementById("btnCreateSalesOrder").addEventListener("click", () => {
        document.getElementById("salesFormTitle").innerText = "Lập Đơn Bán Hàng & Kiểm Tra Tồn Kho";
        document.getElementById("salesId").value = "XH-" + (parseInt(salesDb[salesDb.length-1]?.id.split("-")[1] || 1000) + 1);
        
        document.getElementById("salesDate").disabled = false;
        document.getElementById("customerName").disabled = false;
        document.getElementById("btnAddSalesRow").style.display = "inline-block";
        document.getElementById("salesActionButtons").style.display = "flex";
        document.getElementById("colSalesAction").style.display = "table-cell";
        
        document.getElementById("salesTableItems").innerHTML = "";
        addSalesRow(); 
        
        salesModal.style.display = "flex";
    });

    document.getElementById("btnAddSalesRow").addEventListener("click", () => addSalesRow());
    document.getElementById("closeSalesModal").addEventListener("click", closeModal);
    document.getElementById("btnCancelSales").addEventListener("click", closeModal);

    // Lưu đơn và trừ kho
    document.getElementById("btnProcessOrder").addEventListener("click", function() {
        const validation = validateStockAndCalculate();
        if(!validation.isValid) return;

        const rows = document.getElementById("salesTableItems").querySelectorAll("tr");
        if(rows.length === 0) return alert("Vui lòng chọn sản phẩm!");

        const newOrder = {
            id: document.getElementById("salesId").value,
            date: document.getElementById("salesDate").value,
            customer: document.getElementById("customerName").value,
            status: "processing",
            total: validation.total,
            items: []
        };

        rows.forEach(row => {
            const name = row.querySelector(".prod-select").value;
            const qty = parseInt(row.querySelector(".qty-input").value);
            
            newOrder.items.push({ name, qty, price: inventoryDb[name].price });
            inventoryDb[name].stock -= qty; // Trừ kho
        });

        salesDb.push(newOrder);
        alert(`✅ LẬP HÓA ĐƠN THÀNH CÔNG!\nHệ thống đã trừ kho và tạo phiếu giao hàng cho tài xế.`);
        
        closeModal();
        document.getElementById("salesFilter").value = "processing";
        renderSalesTable("processing");
    });
});

// Các hàm Global gọi từ HTML
window.viewSalesOrder = function(orderId) {
    const order = salesDb.find(o => o.id === orderId);
    if(!order) return;

    document.getElementById("salesFormTitle").innerText = `Chi tiết Đơn Bán: ${order.id}`;
    document.getElementById("salesId").value = order.id;
    document.getElementById("salesDate").value = order.date;
    document.getElementById("customerName").value = order.customer;
    
    document.getElementById("salesTableItems").innerHTML = "";
    order.items.forEach(item => addSalesRow(item.name, item.qty, true));

    document.getElementById("salesDate").disabled = true;
    document.getElementById("customerName").disabled = true;
    document.getElementById("btnAddSalesRow").style.display = "none";
    document.getElementById("salesActionButtons").style.display = "none";
    document.getElementById("colSalesAction").style.display = "none";
    document.querySelectorAll(".col-sales-action").forEach(el => el.style.display = "none");
    document.getElementById("stockWarning").style.display = "none";
    document.getElementById("orderTotalDisplay").innerText = `Tổng cộng: ${formatCurrency(order.total)}`;

    document.getElementById("salesModal").style.display = "flex";
};

window.shipOrder = function(orderId) {
    const order = salesDb.find(o => o.id === orderId);
    if(order) {
        order.status = "shipping";
        renderSalesTable(document.getElementById("salesFilter").value);
    }
};

window.completeOrder = function(orderId) {
    if(confirm("Xác nhận tài xế đã giao hàng và thu tiền thành công?")) {
        const order = salesDb.find(o => o.id === orderId);
        if(order) {
            order.status = "delivered";
            renderSalesTable(document.getElementById("salesFilter").value);
        }
    }
};

window.printInvoice = function(orderId) {
    alert(`Đang kết nối máy in...\nIn Hóa Đơn / Phiếu Giao Hàng cho đơn: ${orderId}`);
};