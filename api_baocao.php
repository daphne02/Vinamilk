<?php
// api_baocao.php
header('Content-Type: application/json; charset=utf-8');

require 'db.php'; // Gọi file kết nối

try {
    // Câu lệnh SQL chuẩn của MySQL
    $sql = "
        SELECT 
            CONCAT('XH-', d.MaDon) as id,
            DATE_FORMAT(d.NgayBan, '%Y-%m-%d') as date,
            k.TenKhach as customer,
            SUM(c.SoLuong) as qty,
            d.TongTien as revenue,
            (d.TongTien * 0.7) as cost,
            CASE WHEN d.TrangThai = 'Đã thanh toán' THEN d.TongTien ELSE 0 END as paid
        FROM DONHANG d
        JOIN KHACHHANG k ON d.MaKhach = k.MaKhach
        JOIN CHITIETDON c ON d.MaDon = c.MaDon
        GROUP BY d.MaDon, d.NgayBan, k.TenKhach, d.TongTien, d.TrangThai
        ORDER BY d.NgayBan DESC
    ";
    
    $stmt = $conn->query($sql);
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Ép kiểu biến trước khi gửi cho Javascript
    foreach ($result as &$row) {
        $row['qty'] = (int)$row['qty'];
        $row['revenue'] = (float)$row['revenue'];
        $row['cost'] = (float)$row['cost'];
        $row['paid'] = (float)$row['paid'];
    }

    echo json_encode($result);

} catch(PDOException $e) {
    echo json_encode(["error" => "Lỗi truy vấn: " . $e->getMessage()]);
}
?>