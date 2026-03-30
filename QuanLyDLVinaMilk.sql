USE QuanLyDLVinamilk;
GO

-- =============================================
-- 1. TẠO CÁC BẢNG DỮ LIỆU 
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'KHACHHANG')
CREATE TABLE KHACHHANG (
    MaKhach INT PRIMARY KEY IDENTITY(1,1),
    TenKhach NVARCHAR(100) NOT NULL,
    SoDienThoai VARCHAR(15),
    CongNo DECIMAL(18,2) DEFAULT 0
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'HANGHOA')
CREATE TABLE HANGHOA (
    MaHang INT PRIMARY KEY IDENTITY(1,1),
    TenHang NVARCHAR(100) NOT NULL,
    DonViTinh NVARCHAR(20),
    SoLuongTonKho INT DEFAULT 0,
    HanSuDung DATE,
    DonGia DECIMAL(18,2)
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DONHANG')
CREATE TABLE DONHANG (
    MaDon INT PRIMARY KEY IDENTITY(1,1),
    NgayBan DATETIME DEFAULT GETDATE(),
    MaKhach INT FOREIGN KEY REFERENCES KHACHHANG(MaKhach),
    TongTien DECIMAL(18,2) DEFAULT 0,
    TrangThai NVARCHAR(50) -- N'Nợ' hoặc N'Đã thanh toán'
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PHIEUNHAP')
CREATE TABLE PHIEUNHAP (
    MaNhap INT PRIMARY KEY IDENTITY(1,1),
    NgayNhap DATETIME DEFAULT GETDATE(),
    NhaCungCap NVARCHAR(200),
    TrangThai NVARCHAR(50)
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CHITIETDON')
CREATE TABLE CHITIETDON (
    MaDon INT FOREIGN KEY REFERENCES DONHANG(MaDon),
    MaHang INT FOREIGN KEY REFERENCES HANGHOA(MaHang),
    SoLuong INT,
    DonGia DECIMAL(18,2),
    PRIMARY KEY (MaDon, MaHang)
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CHITIETPHIEUNHAP')
CREATE TABLE CHITIETPHIEUNHAP (
    MaNhap INT FOREIGN KEY REFERENCES PHIEUNHAP(MaNhap),
    MaHang INT FOREIGN KEY REFERENCES HANGHOA(MaHang),
    SoLuong INT,
    PRIMARY KEY (MaNhap, MaHang)
);
GO

-- =============================================
-- 2. CÀI ĐẶT CÁC TRIGGER TỰ ĐỘNG
-- =============================================

-- A. Trigger Bán hàng: Trừ kho + Tính tiền + Cộng nợ khách hàng
CREATE OR ALTER TRIGGER TRG_XuLyBanHang ON CHITIETDON
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Cập nhật Đơn giá vào Chi tiết đơn lấy từ bảng Hàng Hóa (nếu lúc Insert chưa có giá)
    UPDATE CHITIETDON 
    SET DonGia = h.DonGia
    FROM CHITIETDON c 
    JOIN inserted i ON c.MaDon = i.MaDon AND c.MaHang = i.MaHang
    JOIN HANGHOA h ON i.MaHang = h.MaHang
    WHERE c.DonGia IS NULL OR c.DonGia = 0;

    -- 2. Trừ số lượng tồn kho của mặt hàng
    UPDATE HANGHOA 
    SET SoLuongTonKho = SoLuongTonKho - i.SoLuong
    FROM HANGHOA h 
    JOIN inserted i ON h.MaHang = i.MaHang;

    -- 3. Cập nhật Tổng tiền cho Đơn hàng
    UPDATE DONHANG 
    SET TongTien = (SELECT SUM(SoLuong * DonGia) FROM CHITIETDON WHERE MaDon = d.MaDon)
    FROM DONHANG d 
    WHERE d.MaDon IN (SELECT MaDon FROM inserted);

    -- 4. Nếu trạng thái Đơn hàng là 'Nợ', cộng vào Công nợ khách hàng
    UPDATE KHACHHANG 
    SET CongNo = CongNo + (i.SoLuong * h.DonGia)
    FROM KHACHHANG k 
    JOIN DONHANG d ON k.MaKhach = d.MaKhach
    JOIN inserted i ON d.MaDon = i.MaDon
    JOIN HANGHOA h ON i.MaHang = h.MaHang
    WHERE d.TrangThai = N'Nợ';
END
GO

-- B. Trigger Nhập hàng: Tự động cộng tồn kho
CREATE OR ALTER TRIGGER TRG_XuLyNhapHang ON CHITIETPHIEUNHAP
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE HANGHOA 
    SET SoLuongTonKho = SoLuongTonKho + i.SoLuong
    FROM HANGHOA h 
    JOIN inserted i ON h.MaHang = i.MaHang;
END
GO

-- =============================================
-- 3. NHẬP DỮ LIỆU MẪU (20 KHÁCH HÀNG)
-- =============================================

INSERT INTO KHACHHANG (TenKhach, SoDienThoai) VALUES 
(N'Tạp hóa Cô Lan', '0901000001'), (N'Cửa hàng Minh Anh', '0901000002'),
(N'Đại lý Nu', '0901000003'), (N'Tiệm tạp hóa 79', '0901000004'),
(N'Siêu thị mini Win', '0901000005'), (N'Cửa hàng Tiện Lợi', '0901000006'),
(N'Tạp hóa Bác Ba', '0901000007'), (N'Đại lý Sữa Việt', '0901000008'),
(N'Cửa hàng Mẹ và Bé', '0901000009'), (N'Tạp hóa Hồng Đào', '0901000010'),
(N'Đại lý An Nhiên', '0901000011'), (N'Cửa hàng bách hóa số 5', '0901000012'),
(N'Tiệm sữa Kim Liên', '0901000013'), (N'Tạp hóa Thanh Xuân', '0901000014'),
(N'Đại lý sữa Hùng Vương', '0901000015'), (N'Cửa hàng sữa bột Linh Anh', '0901000016'),
(N'Tạp hóa Chị Tư', '0901000017'), (N'Đại lý bách hóa Toàn Cầu', '0901000018'),
(N'Siêu thị tiện ích Bee', '0901000019'), (N'Cửa hàng sữa tươi 247', '0901000020');

-- =============================================
-- 4. NHẬP DỮ LIỆU MẪU (50 SẢN PHẨM SỮA)
-- =============================================

INSERT INTO HANGHOA (TenHang, DonViTinh, SoLuongTonKho, HanSuDung, DonGia) VALUES 
(N'Sữa tươi Vinamilk Có đường 180ml', N'Thùng', 500, '2026-12-01', 320000), (N'Sữa tươi Vinamilk Ít đường 180ml', N'Thùng', 450, '2026-12-15', 320000),
(N'Sữa tươi Vinamilk Không đường 180ml', N'Thùng', 300, '2026-11-20', 320000), (N'Sữa tươi Vinamilk Dâu 180ml', N'Thùng', 200, '2026-10-10', 330000),
(N'Sữa tươi Vinamilk Socola 180ml', N'Thùng', 250, '2026-10-05', 330000), (N'Sữa bột Dielac Alpha Gold 1', N'Hộp', 50, '2026-05-20', 255000),
(N'Sữa bột Dielac Alpha Gold 2', N'Hộp', 45, '2026-06-15', 265000), (N'Sữa bột Dielac Alpha Gold 3', N'Hộp', 40, '2026-07-10', 275000),
(N'Sữa bột Dielac Alpha Gold 4', N'Hộp', 35, '2026-08-05', 285000), (N'Sữa bột Optimum Gold 1', N'Hộp', 30, '2026-05-12', 350000),
(N'Sữa chua Vinamilk Có đường', N'Lốc', 1000, '2026-04-15', 28000), (N'Sữa chua Vinamilk Ít đường', N'Lốc', 800, '2026-04-20', 28000),
(N'Sữa chua Vinamilk Nha đam', N'Lốc', 600, '2026-04-10', 32000), (N'Sữa chua uống Probi Dâu', N'Lốc', 1200, '2026-05-01', 25000),
(N'Sữa chua uống Probi Việt quất', N'Lốc', 1000, '2026-05-05', 25000), (N'Sữa đặc Ông Thọ Đỏ', N'Lon', 300, '2027-01-01', 22000),
(N'Sữa đặc Ông Thọ Xanh', N'Lon', 400, '2027-02-01', 18000), (N'Sữa đặc Ngôi Sao Phương Nam Xanh', N'Lon', 500, '2027-03-01', 16000),
(N'Sữa đậu nành GoldSoy', N'Hộp', 600, '2026-09-01', 15000), (N'Sữa hạt Óc chó Vinamilk', N'Lốc', 200, '2026-08-15', 45000),
(N'Sữa hạt Hạnh nhân Vinamilk', N'Lốc', 180, '2026-08-10', 45000), (N'Sữa tươi 100% Organic', N'Hộp', 100, '2026-10-30', 55000),
(N'Sữa bột Grow Plus đỏ', N'Hộp', 80, '2026-07-20', 320000), (N'Sữa bột Grow Plus xanh', N'Hộp', 90, '2026-07-25', 290000),
(N'Sữa Kun túi Dâu', N'Túi', 2000, '2026-06-30', 5000), (N'Sữa Kun túi Cam', N'Túi', 1800, '2026-06-25', 5000),
(N'Sữa trái cây Vfresh Cam', N'Chai', 500, '2026-11-01', 12000), (N'Sữa trái cây Vfresh Táo', N'Chai', 450, '2026-11-05', 12000),
(N'Sữa bột Sure Prevent', N'Hộp', 20, '2026-09-10', 450000), (N'Sữa bột CanxiPro', N'Hộp', 25, '2026-09-15', 380000),
(N'Sữa tươi tiệt trùng 1L Có đường', N'Hộp', 200, '2026-12-05', 35000), (N'Sữa tươi tiệt trùng 1L Không đường', N'Hộp', 220, '2026-12-10', 35000),
(N'Sữa bột Dielac Grow Plus 2+', N'Hộp', 40, '2026-08-20', 310000), (N'Sữa bột Dielac Pedia', N'Hộp', 30, '2026-08-25', 340000),
(N'Sữa tươi Flex không Lactose', N'Hộp', 150, '2026-11-15', 32000), (N'Sữa bột Diecerna cho người tiểu đường', N'Hộp', 15, '2026-10-01', 520000),
(N'Sữa hạt Đậu đỏ Vinamilk', N'Lốc', 400, '2026-09-10', 12000), (N'Sữa hạt Đậu nành nha đam', N'Lốc', 350, '2026-09-05', 13000),
(N'Sữa bột Optimum Comfort', N'Hộp', 20, '2026-07-01', 390000), (N'Sữa bột Dielac Mama Gold', N'Hộp', 60, '2026-06-10', 220000),
(N'Sữa tươi ADM Có đường 110ml', N'Thùng', 3000, '2026-05-30', 4500), (N'Sữa tươi ADM Socola 110ml', N'Thùng', 2800, '2026-05-25', 4500),
(N'Sữa chua uống Susu Dâu', N'Lốc', 4000, '2026-04-30', 4000), (N'Sữa chua uống Susu Cam', N'Lốc', 3800, '2026-04-25', 4000),
(N'Sữa bột Ridielac Gạo sữa', N'Hộp', 100, '2026-09-20', 55000), (N'Sữa bột Ridielac Gà rau củ', N'Hộp', 90, '2026-09-25', 58000),
(N'Sữa tươi tách béo Vinamilk', N'Hộp', 120, '2026-11-10', 33000), (N'Sữa chua ăn Love Yogurt', N'Lốc', 500, '2026-04-05', 35000),
(N'Nước bù khoáng ICY', N'Chai', 1000, '2027-01-10', 10000), (N'Trà Atiso Vfresh', N'Chai', 800, '2027-01-05', 11000);
GO