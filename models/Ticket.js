const mongoose = require('mongoose');

// Đây là "bản vẽ" cho mỗi phiếu yêu cầu
const TicketSchema = new mongoose.Schema({
    // Mã tra cứu
    ticketId: {
        type: String,
        required: true,
        unique: true
    },
    // Trạng thái của phiếu
    status: {
        type: String,
        required: true,
        default: 'Đang chờ xử lý' // Mặc định khi mới tạo
    },

    // --- Toàn bộ dữ liệu form ---
    garenaId: { type: String, name: 'garena-id' },
    dateLost: { type: String, name: 'date-lost' },
    firstPhone: { type: String, name: 'first-phone' },
    firstEmail: { type: String, name: 'first-email' },
    currentPhone: { type: String, name: 'current-phone' },
    currentEmail: { type: String, name: 'current-email' },
    accountCccd: { type: String, name: 'account-cccd' },
    accountName: { type: String, name: 'account-name' },
    transactions: { type: String, name: 'transactions' },
    description: { type: String, name: 'description' },
    contactName: { type: String, name: 'contact-name' },
    contactCccd: { type: String, name: 'contact-cccd' },
    contactEmail: { type: String, name: 'contact-email' },
    contactPhone: { type: String, name: 'contact-phone' },

    // Thông tin file (nếu có)
    fileName: { type: String },

    // Ngày tạo (để lọc)
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Chuyển bản vẽ thành model có thể dùng
module.exports = mongoose.model('Ticket', TicketSchema);