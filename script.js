/**
 * Khởi chạy Ứng dụng Hỗ trợ và Hiệu ứng khi tài liệu được tải
 * @author Dev TanPhat (Professional Coder)
 * @date 2025-11-05
 */
document.addEventListener('DOMContentLoaded', () => {
    SupportApp.init();
    SakuraEffect.init();
});

/**
 * @module SupportApp
 * Quản lý logic chính của ứng dụng: UI, Events, API.
 * Được cấu trúc theo dạng module để dễ bảo trì.
 */
const SupportApp = {
    // Lưu trữ các phần tử DOM được sử dụng thường xuyên
    elements: {},
    
    /**
     * Hàm khởi tạo chính
     */
    init() {
        this.cacheDOMElements(); // Lưu trữ các phần tử
        this.bindEvents();       // Gán các sự kiện
    },

    /**
     * Lấy và lưu trữ các phần tử DOM vào object 'elements'
     */
    cacheDOMElements() {
        // Phần Đăng nhập
        this.elements.loginContainer = document.getElementById('login-container');
        this.elements.accessKeyInput = document.getElementById('access-key');
        this.elements.loginButton = document.getElementById('login-button');
        this.elements.errorMessage = document.getElementById('error-message');
        
        // Phần Nội dung chính
        this.elements.mainContainer = document.getElementById('main-container');
        this.elements.recoveryForm = document.getElementById('recovery-form');
        this.elements.toast = document.getElementById('toast-notification');

        // Tabs
        this.elements.tabButtons = document.querySelectorAll('.tab-button');
        this.elements.tabContents = document.querySelectorAll('.tab-content');
    },

    /**
     * Gán các trình xử lý sự kiện cho các phần tử
     */
    bindEvents() {
        if (this.elements.loginButton) {
            this.elements.loginButton.addEventListener('click', this.handleLogin.bind(this));
        }
        
        if (this.elements.accessKeyInput) {
            this.elements.accessKeyInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleLogin();
            });
        }

        if (this.elements.recoveryForm) {
            this.elements.recoveryForm.addEventListener('submit', this.handleSubmitForm.bind(this));
        }

        // Gán sự kiện cho các nút Tab
        this.elements.tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.dataset.tab;
                this.UI.showTab(tabName);
            });
        });
    },

    /**
     * Xử lý logic đăng nhập
     * @param {Event} e Sự kiện click
     */
    async handleLogin(e) {
        e.preventDefault();
        const enteredKey = this.elements.accessKeyInput.value.trim();
        this.UI.hideError();

        if (!enteredKey) {
            this.UI.showError('Vui lòng nhập Key.');
            return;
        }

        this.elements.loginButton.disabled = true;
        this.elements.loginButton.textContent = 'Đang xác thực...';

        try {
            const response = await this.api.post('/verify-key', { key: enteredKey });

            if (response.success) {
                // Đăng nhập thành công
                this.elements.loginContainer.style.display = 'none';
                this.elements.mainContainer.style.display = 'block';
                document.body.style.alignItems = 'flex-start';
            } else {
                // Sai key
                this.UI.showError(response.message || 'Key không hợp lệ.');
            }
        } catch (error) {
            // Lỗi mạng
            this.UI.showError('Lỗi kết nối máy chủ. Vui lòng thử lại.');
        } finally {
            this.elements.loginButton.disabled = false;
            this.elements.loginButton.textContent = 'Xác thực';
        }
    },

    /**
     * Xử lý logic gửi form hỗ trợ
     * @param {Event} e Sự kiện submit
     */
    async handleSubmitForm(e) {
        e.preventDefault();
        const submitButton = this.elements.recoveryForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;

        submitButton.disabled = true;
        submitButton.textContent = 'Đang gửi...';

        const formData = new FormData(this.elements.recoveryForm);

        try {
            // Dùng phương thức postForm (riêng cho FormData)
            const response = await this.api.postForm('/submit-form', formData);
            
            if (response.success) {
                this.UI.showToast('Gửi yêu cầu thành công! Chúng tôi sẽ xử lý sớm nhất.');
                this.elements.recoveryForm.reset();
            } else {
                this.UI.showToast(response.message || 'Không thể gửi form.', 'error');
            }
        } catch (error) {
            this.UI.showToast('Lỗi kết nối máy chủ. Vui lòng kiểm tra mạng.', 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    },

    /**
     * @module UI
     * Tập hợp các hàm quản lý Giao diện Người dùng
     */
    UI: {
        /**
         * Hiển thị thông báo Toast
         * @param {string} message Nội dung thông báo
         * @param {'success' | 'error'} type Loại thông báo
         */
        showToast(message, type = 'success') {
            const toast = SupportApp.elements.toast;
            if (!toast) return;

            toast.textContent = message;
            toast.className = 'toast'; // Reset
            toast.classList.add(type === 'error' ? 'error' : 'success');
            toast.classList.add('active');

            setTimeout(() => toast.classList.remove('active'), 3000);
        },

        /**
         * Hiển thị tab được chọn
         * @param {string} tabName Tên tab (vd: 'form', 'cm')
         */
        showTab(tabName) {
            // Ẩn tất cả
            SupportApp.elements.tabContents.forEach(content => content.classList.remove('active'));
            SupportApp.elements.tabButtons.forEach(button => button.classList.remove('active'));

            // Hiển thị tab được chọn
            document.getElementById(`content-${tabName}`).classList.add('active');
            document.getElementById(`tab-${tabName}`).classList.add('active');
        },

        showError(message) {
            const errorEl = SupportApp.elements.errorMessage;
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        },

        hideError() {
            SupportApp.elements.errorMessage.style.display = 'none';
        }
    },

    /**
     * @module api
     * Quản lý việc gửi request lên server
     */
    api: {
        /**
         * Gửi JSON
         * @param {string} endpoint Đường dẫn API
         * @param {object} body Dữ liệu JSON
         */
        async post(endpoint, body) {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            // Phản hồi từ server có thể không phải lúc nào cũng là JSON (vd: lỗi 500)
            if (!response.ok) {
                // Thử parse lỗi JSON, nếu không được thì dùng text
                try {
                    return await response.json();
                } catch (e) {
                    throw new Error(response.statusText);
                }
            }
            return response.json();
        },

        /**
         * Gửi FormData (cho upload file)
         * @param {string} endpoint Đường dẫn API
         * @param {FormData} formData Dữ liệu form
         */
        async postForm(endpoint, formData) {
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData, // Khi dùng FormData, trình duyệt tự set Content-Type
            });
            if (!response.ok) {
                try {
                    return await response.json();
                } catch (e) {
                    throw new Error(response.statusText);
                }
            }
            return response.json();
        }
    }
};

/**
 * @module SakuraEffect
 * Quản lý hiệu ứng hoa anh đào rơi trên Canvas.
 * Một module độc lập, không ảnh hưởng logic chính.
 */
const SakuraEffect = {
    canvas: null,
    ctx: null,
    petals: [],
    settings: {
        numPetals: 30, // Số lượng hoa
        color: 'rgba(255, 192, 203, 0.3)' // Màu hoa (từ CSS var)
    },

    init() {
        try {
            this.canvas = document.getElementById('sakura-canvas');
            if (!this.canvas) return;
            
            this.ctx = this.canvas.getContext('2d');
            this.settings.color = getComputedStyle(document.documentElement).getPropertyValue('--sakura-color') || this.settings.color;
            
            this.resizeCanvas();
            this.createPetals();
            this.animate();
            
            window.addEventListener('resize', () => this.resizeCanvas());
        } catch (e) {
            console.error("Lỗi khởi tạo hiệu ứng Sakura:", e);
        }
    },

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    createPetals() {
        this.petals = [];
        for (let i = 0; i < this.settings.numPetals; i++) {
            this.petals.push(this.createPetal());
        }
    },

    createPetal() {
        const x = Math.random() * this.canvas.width;
        const y = (Math.random() * this.canvas.height * 2) - this.canvas.height;
        const radius = Math.random() * 2 + 1; // Kích thước
        const speedX = Math.random() * 2 - 1; // Tốc độ ngang (lắc)
        const speedY = Math.random() + 0.5;   // Tốc độ rơi
        
        return { x, y, radius, speedX, speedY, angle: 0 };
    },

    drawPetal(petal) {
        this.ctx.beginPath();
        this.ctx.fillStyle = this.settings.color;
        this.ctx.arc(petal.x, petal.y, petal.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.closePath();
    },

    updatePetal(petal) {
        petal.y += petal.speedY;
        petal.x += petal.speedX;
        petal.angle += 0.01;
        petal.x += Math.sin(petal.angle) * 0.5; // Tạo hiệu ứng lắc

        // Quay lại từ trên nếu rơi ra ngoài
        if (petal.y > this.canvas.height) {
            Object.assign(petal, this.createPetal(), { y: -5 });
        }
        // Quay lại nếu bay ra khỏi lề
        if (petal.x > this.canvas.width) petal.x = 0;
        if (petal.x < 0) petal.x = this.canvas.width;
    },

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.petals.forEach(petal => {
            this.updatePetal(petal);
            this.drawPetal(petal);
        });
        
        requestAnimationFrame(this.animate.bind(this));
    }
};