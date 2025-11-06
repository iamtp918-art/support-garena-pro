/**
 * Khởi chạy Đồng hồ Đếm ngược Bảo trì
 * @author Dev TanPhat (Professional Coder)
 * @date 2025-11-05
 */
document.addEventListener('DOMContentLoaded', () => {
    Countdown.init();
});

/**
 * @module Countdown
 * Quản lý logic đồng hồ đếm ngược 2 ngày (48 giờ).
 */
const Countdown = {
    // DOM Elements
    elements: {
        days: null,
        hours: null,
        minutes: null,
        seconds: null
    },

    // 2 ngày (48 giờ) tính bằng mili-giây
    countdownDuration: 2 * 24 * 60 * 60 * 1000,
    
    // Ngày mục tiêu
    targetDate: new Date().getTime() + (2 * 24 * 60 * 60 * 1000),

    /**
     * Hàm khởi tạo
     */
    init() {
        this.elements.days = document.getElementById('days');
        this.elements.hours = document.getElementById('hours');
        this.elements.minutes = document.getElementById('minutes');
        this.elements.seconds = document.getElementById('seconds');

        // Chạy ngay lần đầu tiên
        this.updateClock();

        // Cập nhật mỗi giây
        setInterval(this.updateClock.bind(this), 1000);
    },

    /**
     * Cập nhật giao diện đồng hồ
     */
    updateClock() {
        const now = new Date().getTime();
        const distance = this.targetDate - now;

        // Tính toán
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Cập nhật HTML
        if (distance < 0) {
            // Đã hết giờ
            document.getElementById('countdown').innerHTML = "<h2>Đã hoàn tất nâng cấp!</h2>";
        } else {
            this.elements.days.innerText = this.formatTime(days);
            this.elements.hours.innerText = this.formatTime(hours);
            this.elements.minutes.innerText = this.formatTime(minutes);
            this.elements.seconds.innerText = this.formatTime(seconds);
        }
    },

    /**
     * Helper: Thêm số 0 (ví dụ: 9 -> 09)
     * @param {number} time
     */
    formatTime(time) {
        return time < 10 ? `0${time}` : time;
    }
};