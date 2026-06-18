/**
 * VISTAMED АРС — общие скрипты для всех страниц
 */
(function () {
    'use strict';

    /** Сворачивание / разворачивание панели пациента */
    function initPatientBar() {
        const bar = document.getElementById('patientBar');
        const expandRow = document.getElementById('patientBarExpand');
        const toggleBtn = document.getElementById('togglePatientBtn');
        const expandBtn = document.getElementById('expandPatientBtn');

        if (!bar) return;

        function collapse() {
            bar.classList.add('collapsed');
            if (expandRow) expandRow.style.display = 'flex';
            if (toggleBtn) toggleBtn.textContent = '▼ Показать данные';
        }

        function expand() {
            bar.classList.remove('collapsed');
            if (expandRow) expandRow.style.display = 'none';
            if (toggleBtn) toggleBtn.textContent = '▲ Скрыть';
        }

        if (toggleBtn) {
            toggleBtn.addEventListener('click', function () {
                if (bar.classList.contains('collapsed')) expand();
                else collapse();
            });
        }

        if (expandBtn) {
            expandBtn.addEventListener('click', expand);
        }
    }

    /** Закрытие модальных окон по крестику и клику на фон */
    function initModals() {
        document.querySelectorAll('.close-modal').forEach(function (el) {
            el.addEventListener('click', function () {
                const modalId = this.getAttribute('data-modal');
                const modal = modalId ? document.getElementById(modalId) : this.closest('.modal');
                if (modal) modal.style.display = 'none';
            });
        });

        document.querySelectorAll('.modal').forEach(function (modal) {
            modal.addEventListener('click', function (e) {
                if (e.target === modal) modal.style.display = 'none';
            });
        });
    }

    /** Открыть / закрыть модальное окно */
    window.openModal = function (id) {
        const modal = document.getElementById(id);
        if (modal) modal.style.display = 'flex';
    };

    window.closeModal = function (id) {
        const modal = document.getElementById(id);
        if (modal) modal.style.display = 'none';
    };

    /** Возврат в историю болезни (демо) */
    window.goBackToHistory = function () {
        alert('Переход к электронной истории болезни пациента...');
    };

    /** Форматирование даты YYYY-MM-DD → DD.MM.YYYY */
    window.formatDateRu = function (d) {
        if (!d) return '__.__.____';
        const p = d.split('-');
        return p[2] + '.' + p[1] + '.' + p[0];
    };

    document.addEventListener('DOMContentLoaded', function () {
        initPatientBar();
        initModals();
    });
})();
