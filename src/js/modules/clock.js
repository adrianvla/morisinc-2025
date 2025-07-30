/**
 * Clock module - displays and updates current date/time with translation support
 */

import { getCurrentLanguage } from './translator.js';

class Clock {
    constructor() {
        this.clockElement = null;
        this.intervalId = null;
        this.init();
    }

    init() {
        // Find the clock element in the sidebar
        this.clockElement = document.querySelector('.s2 span');

        if (this.clockElement) {
            this.updateClock();
            this.startClock();
        }
    }

    getLocalizedDayNames(lang) {
        const dayNames = {
            en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            jp: ['日', '月', '火', '水', '木', '金', '土'],
            de: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
            ru: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
            fr: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
        };
        return dayNames[lang] || dayNames.en;
    }

    getLocalizedMonthNames(lang) {
        const monthNames = {
            en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            jp: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
            de: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
            ru: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
            fr: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
        };
        return monthNames[lang] || monthNames.en;
    }

    formatDate(date) {
        const lang = getCurrentLanguage();
        const days = this.getLocalizedDayNames(lang);
        const months = this.getLocalizedMonthNames(lang);

        const dayName = days[date.getDay()];
        const monthName = months[date.getMonth()];
        const day = date.getDate().toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');

        // Different date formats for different languages
        switch (lang) {
            case 'jp':
                // Japanese format: 年月日 曜日 時:分:秒
                return `${year}年${monthName}${day}日 ${dayName} ${hours}:${minutes}:${seconds}`;
            case 'de':
                // German format: Day DD.MM.YYYY HH:MM:SS
                return `${dayName} ${day}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${year} ${hours}:${minutes}:${seconds}`;
            case 'ru':
                // Russian format: Day DD Mon YYYY HH:MM:SS
                return `${dayName} ${day} ${monthName} ${year} ${hours}:${minutes}:${seconds}`;
            case 'fr':
                // French format: Day DD Mon YYYY HH:MM:SS
                return `${dayName} ${day} ${monthName} ${year} ${hours}:${minutes}:${seconds}`;
            default:
                // English format: Day Mon DD HH:MM:SS YYYY
                return `${dayName} ${monthName} ${day} ${hours}:${minutes}:${seconds} ${year}`;
        }
    }

    updateClock() {
        if (this.clockElement) {
            const now = new Date();
            this.clockElement.textContent = this.formatDate(now);
        }
    }

    startClock() {
        // Update every second
        this.intervalId = setInterval(() => {
            this.updateClock();
        }, 1000);
    }

    stopClock() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    destroy() {
        this.stopClock();
        this.clockElement = null;
    }
}

// Export the clock class
export default Clock;

// Auto-initialize when DOM is loaded
if (typeof window !== 'undefined') {
    let clockInstance = null;

    const initClock = () => {
        clockInstance = new Clock();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initClock);
    } else {
        initClock();
    }

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        if (clockInstance) {
            clockInstance.destroy();
        }
    });
}
