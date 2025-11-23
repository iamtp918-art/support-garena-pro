/**
 * ==========================================
 * CONTROLLER LOGIC
 * DEVELOPER: TRẦN TẤN PHÁT
 * CONTACT: https://devtanphat.site
 * ==========================================
 */

// Chữ ký Console
console.log("%c Developed by Tran Tan Phat %c https://devtanphat.site ", "background: #3B82F6; color: #fff; border-radius: 3px 0 0 3px; padding: 5px; font-weight: bold;", "background: #0F172A; color: #fff; border-radius: 0 3px 3px 0; padding: 5px;");

document.addEventListener('DOMContentLoaded', () => {

    /* --- 1. LANGUAGE DATA (Data dịch) --- */
    const langData = {
        vi: {
            form_title: "Gửi Yêu Cầu Hỗ Trợ",
            form_desc: "Điền thông tin bên dưới để AI xử lý tự động",
            label_username: "Tên đăng nhập Garena",
            label_date: "Ngày phát hiện lỗi",
            sep_verify: "THÔNG TIN XÁC MINH",
            label_phone1: "SĐT Đăng ký đầu",
            label_email1: "Email Đăng ký đầu",
            label_realname: "Họ tên thật",
            sep_contact: "LIÊN HỆ & MÔ TẢ",
            label_contact_name: "Người gửi",
            label_contact_phone: "SĐT Liên hệ",
            label_desc: "Chi tiết vấn đề",
            upload_text: "Tải ảnh minh chứng (Kéo thả hoặc Click)",
            btn_submit: "GỬI YÊU CẦU NGAY",
            // Welcome
            welcome_head: "Thông báo chào mừng",
            welcome_title: "Chào mừng bạn đến với Dịch vụ Hỗ trợ!",
            welcome_msg: "Đây là hệ thống hỗ trợ Garena tự động của <strong>Developer Trần Tấn Phát</strong>. Chúc bạn một ngày làm việc hiệu quả và có trải nghiệm mượt mà!",
            btn_off24h: "Tắt 24h",
            btn_understood: "Đã hiểu",
            // Error
            err_required: "Vui lòng không bỏ trống dòng này",
        },
        en: {
            form_title: "Submit Support Request",
            form_desc: "Fill in the form below for AI processing",
            label_username: "Garena Username",
            label_date: "Date of Issue",
            sep_verify: "VERIFICATION INFO",
            label_phone1: "First Registered Phone",
            label_email1: "First Registered Email",
            label_realname: "Full Name",
            sep_contact: "CONTACT INFO",
            label_contact_name: "Sender Name",
            label_contact_phone: "Contact Phone",
            label_desc: "Issue Details",
            upload_text: "Upload Proof (Drag & Drop or Click)",
            btn_submit: "SUBMIT REQUEST",
            // Welcome
            welcome_head: "System Notification",
            welcome_title: "Welcome to Support Service!",
            welcome_msg: "This is the automated Garena support system by <strong>Dev Tran Tan Phat</strong>. Have a productive day!",
            btn_off24h: "Mute 24h",
            btn_understood: "Understood",
            // Error
            err_required: "This field is required",
        }
    };

    let currentLang = localStorage.getItem('site_lang') || 'vi';
    updateLanguage(currentLang);

    /* --- 2. LANGUAGE SWITCHER LOGIC --- */
    const langBtn = document.getElementById('langSwitch');
    langBtn.addEventListener('click', () => {
        currentLang = currentLang === 'vi' ? 'en' : 'vi';
        localStorage.setItem('site_lang', currentLang);
        updateLanguage(currentLang);
    });

    function updateLanguage(lang) {
        document.getElementById('langText').innerText = lang.toUpperCase();
        document.getElementById('langIcon').src = lang === 'vi' ? 'https://flagcdn.com/w40/vn.png' : 'https://flagcdn.com/w40/gb.png';
        
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if(langData[lang][key]) el.innerHTML = langData[lang][key];
        });
        
        // Update placeholder nếu cần (optional)
        if(lang === 'en') {
            document.getElementById('inp_username').placeholder = "Enter username...";
        } else {
            document.getElementById('inp_username').placeholder = "Nhập username...";
        }
    }

    /* --- 3. WELCOME POPUP (Cookies Logic) --- */
    const welcomeModal = document.getElementById('welcomeModal');
    const lastClosed = localStorage.getItem('welcome_closed_time');
    const now = new Date().getTime();

    // Logic: Nếu chưa đóng bao giờ HOẶC đã đóng quá 24h -> Hiện lại
    if (!lastClosed || (now - lastClosed > 24 * 60 * 60 * 1000)) {
        setTimeout(() => { welcomeModal.classList.add('show'); }, 800);
    }

    window.closeWelcome = function() { welcomeModal.classList.remove('show'); }
    window.closeWelcome24h = function() {
        localStorage.setItem('welcome_closed_time', new Date().getTime()); // Lưu timestamp
        welcomeModal.classList.remove('show');
    }

    /* --- 4. FILE UPLOAD UX --- */
    const fileInput = document.getElementById('fileUpload');
    const uploadZone = document.getElementById('dropZone');
    const fileNameDisplay = document.getElementById('fileName');

    if(fileInput && uploadZone) {
        fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
        
        // Drag & Drop
        uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.style.background = "#EFF6FF"; });
        uploadZone.addEventListener('dragleave', (e) => { e.preventDefault(); uploadZone.style.background = "#FAFAFA"; });
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault(); uploadZone.style.background = "#FAFAFA";
            if(e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                handleFile(e.dataTransfer.files[0]);
            }
        });
    }

    function handleFile(file) {
        if(!file) return;
        if(file.size > 5 * 1024 * 1024) { alert("File > 5MB!"); fileInput.value = ""; return; }
        fileNameDisplay.innerHTML = `<strong style="color: var(--text-main)">${file.name}</strong>`;
        uploadZone.classList.add('has-file');
        // Clear error nếu có
        uploadZone.parentElement.classList.remove('error');
    }

    /* --- 5. FORM SUBMIT & VALIDATION --- */
    const form = document.getElementById('supportForm');
    const submitBtn = document.getElementById('submitBtn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Reset Error
        document.querySelectorAll('.input-group').forEach(el => el.classList.remove('error'));
        let hasError = false;

        // Validate các trường bắt buộc
        const requiredIds = ['inp_username', 'inp_date', 'inp_cname', 'inp_cphone'];
        requiredIds.forEach(id => {
            const el = document.getElementById(id);
            if(!el.value.trim()) {
                showError(el, langData[currentLang].err_required);
                hasError = true;
            }
        });

        if(hasError) return; // Dừng lại nếu lỗi

        // Check Captcha
        if (typeof grecaptcha !== 'undefined') {
            if(!grecaptcha.getResponse()) {
                showModal('error', 'Lỗi xác thực', 'Vui lòng xác minh Captcha');
                return;
            }
        }

        // --- MÔ PHỎNG GỬI DỮ LIỆU ---
        const originalBtn = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang xử lý...';

        try {
            // Giả lập delay mạng 1.5s
            await new Promise(r => setTimeout(r, 1500));
            
            // Thành công
            const ticketId = 'GNA-' + Math.floor(Math.random() * 90000 + 10000);
            showModal('success', 'Gửi phiếu thành công', 'Hệ thống đã tiếp nhận yêu cầu.', ticketId);
            
            form.reset();
            fileNameDisplay.innerText = langData[currentLang].upload_text;
            uploadZone.classList.remove('has-file');
            if(typeof grecaptcha !== 'undefined') grecaptcha.reset();

        } catch (err) {
            showModal('error', 'Lỗi kết nối', 'Không thể gửi dữ liệu lúc này.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtn;
        }
    });

    // Hàm hiện lỗi đỏ
    function showError(input, msg) {
        const parent = input.closest('.input-group');
        parent.classList.add('error');
        const msgEl = parent.querySelector('.error-msg');
        if(msgEl) msgEl.innerText = msg;
        
        // Tự tắt lỗi khi gõ
        input.addEventListener('input', () => parent.classList.remove('error'), {once: true});
    }
});

// Modal Chung
function showModal(type, title, msg, ticketId = null) {
    const modal = document.getElementById('techModal');
    const icon = document.getElementById('modalIcon');
    const ticketArea = document.getElementById('ticketArea');

    document.getElementById('modalMsg').innerText = msg;
    
    if(type === 'success') {
        icon.className = 'modal-icon success';
        icon.innerHTML = '<i class="fa-solid fa-check"></i>';
        if(ticketId) {
            ticketArea.classList.remove('hidden');
            document.getElementById('ticketCode').innerText = ticketId;
        }
    } else {
        icon.className = 'modal-icon error';
        icon.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        ticketArea.classList.add('hidden');
    }
    modal.classList.add('show');
}
function closeModal() { document.getElementById('techModal').classList.remove('show'); }
function copyTicket() {
    const code = document.getElementById('ticketCode').innerText;
    navigator.clipboard.writeText(code).then(() => alert('Đã copy: ' + code));
}
