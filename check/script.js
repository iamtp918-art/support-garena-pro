document.addEventListener("DOMContentLoaded", () => {

    // === CODE CHO NÚT MENU DI ĐỘNG (ĐÃ CẬP NHẬT) ===
    const mobileNavToggle = document.getElementById('mobileNavToggle');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay'); // Lấy lớp phủ
    
    if (mobileNavToggle && sidebar && sidebarOverlay) {
        // Khi click nút hamburger
        mobileNavToggle.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
            sidebarOverlay.classList.toggle('active'); // Bật/tắt lớp phủ
        });

        // Khi click vào lớp phủ
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('mobile-open'); // Tắt sidebar
            sidebarOverlay.classList.remove('active'); // Tắt lớp phủ
        });
    }
    // === KẾT THÚC PHẦN CẬP NHẬT ===


    // === CODE CHO THÔNG BÁO BẢO TRÌ ===
    const maintenanceLinks = document.querySelectorAll('.maintenance-trigger');
    
    maintenanceLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault(); 
            const toolName = link.querySelector('span').innerText;
            showModal(
                "Thông báo bảo trì 🛠️", 
                `Công cụ "${toolName}" hiện đang được bảo trì. Vui lòng quay lại sau, cảm ơn bạn!`
            );
        });
    });
    // === KẾT THÚC PHẦN THÊM MỚI ===


    // Lấy tất cả các phần tử DOM cần thiết (Code cũ)
    const fileInput = document.getElementById('fileInput');
    const textInput = document.getElementById('textInput');
    const filterButton = document.getElementById('filterButton');

    // Lấy các phần tử của Modal
    const customModal = document.getElementById('custom-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalOkButton = document.getElementById('modal-ok-button');
    const closeModalButton = customModal.querySelector('.close-button');

    // Lưu nội dung gốc của nút
    const originalButtonHTML = filterButton ? filterButton.innerHTML : '';

    // Lấy các ô kết quả
    const results = {
        cmndNo: document.getElementById('result-cmnd-no'),
        cmndYes: document.getElementById('result-cmnd-yes'),
        tinhAnh: document.getElementById('result-tinh-anh'),
        caoThu: document.getElementById('result-cao-thu'),
        sdtNo: document.getElementById('result-sdt-no')
    };

    // Lấy các nút tải về
    const downloads = {
        cmndNo: document.getElementById('download-cmnd-no'),
        cmndYes: document.getElementById('download-cmnd-yes'),
        tinhAnh: document.getElementById('download-tinh-anh'),
        caoThu: document.getElementById('download-cao-thu'),
        sdtNo: document.getElementById('download-sdt-no')
    };

    // === CÁC HÀM XỬ LÝ MODAL (Giữ nguyên) ===
    const showModal = (title, message) => {
        if (customModal) {
            modalTitle.innerText = title;
            modalMessage.innerText = message;
            customModal.classList.add('show');
        }
    };

    const closeModal = () => {
        if (customModal) {
            customModal.classList.remove('show');
        }
    };
    
    if (modalOkButton) modalOkButton.addEventListener('click', closeModal);
    if (closeModalButton) closeModalButton.addEventListener('click', closeModal);
    if (customModal) {
        customModal.addEventListener('click', (e) => {
            if (e.target === customModal) {
                closeModal();
            }
        });
    }

    // === LOGIC TỰ ĐỘNG ĐỌC FILE (Giữ nguyên, đọc UTF-8) ===
    if (fileInput) {
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                if (textInput) {
                    textInput.value = e.target.result;
                }
                showModal("Tải tệp thành công", "Nội dung tệp đã được tải vào ô văn bản.");
            };
            reader.onerror = () => {
                showModal("Lỗi đọc tệp", "Không thể đọc tệp. Tệp có thể bị hỏng.");
            };
            reader.readAsText(file, "UTF-8"); // Đọc chuẩn UTF-8
        });
    }

    // === LOGIC LỌC (Giữ nguyên, Regex linh hoạt) ===
    const processText = (text) => {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        
        const filtered = {
            cmndNo: [], cmndYes: [], tinhAnh: [], caoThu: [], sdtNo: []
        };

        const regex = {
            cmndNo: /cmnd\s*:\s*no/i,
            cmndYes: /cmnd\s*:\s*yes/i,
            tinhAnh: /rank\s*:\s*tinh anh/i,
            caoThu: /rank\s*:\s*(cao thủ|cao thu)/i,
            sdtNo: /(sđt|sdt)\s*:\s*no/i
        };

        // Xóa sạch kết quả cũ (Kiểm tra null trước)
        if (results.cmndNo) results.cmndNo.value = '';
        if (results.cmndYes) results.cmndYes.value = '';
        if (results.tinhAnh) results.tinhAnh.value = '';
        if (results.caoThu) results.caoThu.value = '';
        if (results.sdtNo) results.sdtNo.value = '';

        lines.forEach(line => {
            if (regex.cmndNo.test(line)) filtered.cmndNo.push(line);
            if (regex.cmndYes.test(line)) filtered.cmndYes.push(line);
            if (regex.tinhAnh.test(line)) filtered.tinhAnh.push(line);
            if (regex.caoThu.test(line)) filtered.caoThu.push(line);
            if (regex.sdtNo.test(line)) filtered.sdtNo.push(line);
        });

        // Hiển thị kết quả (ĐÃ SỬA LỖI GÕ PHÍM "cmcmndYes")
        if (results.cmndNo) results.cmndNo.value = filtered.cmndNo.join('\n');
        if (results.cmndYes) results.cmndYes.value = filtered.cmndYes.join('\n');
        if (results.tinhAnh) results.tinhAnh.value = filtered.tinhAnh.join('\n');
        if (results.caoThu) results.caoThu.value = filtered.caoThu.join('\n');
        if (results.sdtNo) results.sdtNo.value = filtered.sdtNo.join('\n');
    };

    // === CÁC HÀM XỬ LÝ NÚT BẤM (Giữ nguyên) ===
    const startProcessing = (text) => {
        if (!text || text.trim() === '') {
            showModal("Lỗi nhập liệu", "Vui lòng nhập nội dung vào ô văn bản để bắt đầu lọc!");
            return;
        }

        if (!filterButton) return;

        filterButton.disabled = true;
        filterButton.classList.add('loading');
        filterButton.innerHTML = '<span class="spinner"></span><span class="button-text">Đang xử lý...</span>';

        setTimeout(() => {
            try {
                processText(text);
                const hasResults = Object.values(results).some(textarea => textarea && textarea.value);
                if (hasResults) {
                    showModal("Hoàn thành", "Quá trình lọc tài khoản đã hoàn tất!");
                } else {
                    showModal("Không tìm thấy", "Không tìm thấy kết quả nào khớp với tiêu chí lọc.");
                }
            } catch (error) {
                console.error("Lỗi khi lọc:", error);
                showModal("Lỗi nghiêm trọng", "Đã xảy ra lỗi: " + error.message);
            } finally {
                filterButton.disabled = false;
                filterButton.classList.remove('loading');
                filterButton.innerHTML = originalButtonHTML;
            }
        }, 50);
    };

    if (filterButton) {
        filterButton.addEventListener('click', () => {
            const textToProcess = textInput ? textInput.value : ''; 
            startProcessing(textToProcess);
        });
    }

    // === PHẦN TẢI FILE (Giữ nguyên) ===
    const downloadFile = (content, filename) => {
        if (!content || content.trim() === '') {
            showModal("Không có dữ liệu", "Không có dữ liệu để tải về cho mục này!");
            return;
        }
        
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (downloads.cmndNo) downloads.cmndNo.addEventListener('click', () => downloadFile(results.cmndNo.value, 'loc_cmnd_no.txt'));
    if (downloads.cmndYes) downloads.cmndYes.addEventListener('click', () => downloadFile(results.cmndYes.value, 'loc_cmnd_yes.txt'));
    if (downloads.tinhAnh) downloads.tinhAnh.addEventListener('click', () => downloadFile(results.tinhAnh.value, 'loc_rank_tinh_anh.txt'));
    if (downloads.caoThu) downloads.caoThu.addEventListener('click', () => downloadFile(results.caoThu.value, 'loc_rank_cao_thu.txt'));
    if (downloads.sdtNo) downloads.sdtNo.addEventListener('click', () => downloadFile(results.sdtNo.value, 'loc_sdt_no.txt'));

});
