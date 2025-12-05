// Toast 알림 시스템
class Toast {
    static show(message, type = 'info', title = '', duration = 5000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="${icons[type] || icons.info}"></i>
            </div>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${title}</div>` : ''}
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="Toast.hide(this.parentElement)">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(toast);

        // 자동 제거
        if (duration > 0) {
            setTimeout(() => {
                Toast.hide(toast);
            }, duration);
        }

        return toast;
    }

    static hide(toast) {
        if (!toast) return;
        
        toast.classList.add('hide');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
        }, 300);
    }

    static success(message, title = '성공') {
        return Toast.show(message, 'success', title);
    }

    static error(message, title = '오류') {
        return Toast.show(message, 'error', title);
    }

    static warning(message, title = '경고') {
        return Toast.show(message, 'warning', title);
    }

    static info(message, title = '알림') {
        return Toast.show(message, 'info', title);
    }
}

// 전역 함수로 등록
window.Toast = Toast;
