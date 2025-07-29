import yeast from 'yeast';

function setLanguageCookie(lang) {
    document.cookie = `lang=${lang}; path=/; max-age=31536000`; // 1 year
}

function getLanguageCookie() {
    const match = document.cookie.match(/(?:^|; )lang=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : null;
}

function getCurrentLanguage() {
    const params = new URLSearchParams(window.location.search);
    let lang = params.get('lang');
    if (lang) {
        setLanguageCookie(lang);
        return lang;
    }
    lang = getLanguageCookie();
    if (lang) return lang;
    return 'en';
}

const translationStrings = {
    jp: {
        "My": "私の",
        "Featured": "おすすめ",
        "Projects": "プロジェクト",
        "Creative": "クリエイティブ",
        "Software": "ソフトウェア",
        "Developer": "開発者",
        "Menu": "メニュー",
        "MENU": "メニュー",
        "Close": "閉じる",
        "CLOSE": "閉じる",
        "About Me": "私について",
        "Home": "ホーム",
        "Lang": "言語",
    },
    de:{
        "My": "&EMPTY&",
        "Featured": "Ausgewählte",
        "Projects": "Projekte",
        "Creative": "Kreativer",
        "Software": "Software",
        "Developer": "Entwickler",
        "Menu": "MENÜ",
        "MENU": "MENÜ",
        "Close": "Schließen",
        "CLOSE": "SCHLIEßEN",
        "About Me": "Uber Mich",
        "Home": "Startseite",
        "Lang": "Sprache",
    },
    ru:{
        "A": "A",
        "D": "Д",
        "R": "P",
        "I": "И",
        "N": "H",
        "V": "B",
        "L": "Л",
        "S": "C",
        "O": "O",
        "Featured": "Избранные",
        "Projects": "Проекты",
        "Creative": "Креативный",
        "Software": "Разработчик",
        "Developer": "ПО",
        "Menu": "МЕНЮ",
        "MENU": "МЕНЮ",
        "Close": "Закрыть",
        "CLOSE": "ЗАКРЫТЬ",
        "About Me": "Обо мне",
        "Home": "На Главную",
        "Lang": "Язык",
    },
    fr:{
        "My": "Mes",
        "Featured": "en Vedette",
        "Projects": "Projets",
        "Creative": "Développeur",
        "Software": "Créatif",
        "Developer": "de Logiciel",
        "Menu": "MENU",
        "MENU": "MENU",
        "Close": "Fermer",
        "CLOSE": "FERMER",
        "About Me": "À Propos",
        "Home": "Accueil",
        "Lang": "Langue",
    }
}

function getTranslation(key) {
    const lang = getCurrentLanguage();
    if (translationStrings[lang] && translationStrings[lang][key]) {
        if( translationStrings[lang][key] === "&EMPTY&") {
            console.warn(`Translation for "${key}" is empty in language "${lang}"`);
            return ''; // Return empty string if translation is marked as empty
        }
        return translationStrings[lang][key];
    } else {
        console.warn(`Translation for "${key}" not found in language "${lang}"`);
        return key; // Return the key itself if no translation is found
    }
}

function translateEverything(){
    const lang = getCurrentLanguage();
    console.log("Language set to:", lang);
    if(lang === 'en') {
        console.log("No translation needed for English");
        return; // No translation needed for English
    }

    let elements = document.querySelectorAll(`[data-${lang}-change-attr]`);
    elements.forEach(element => {
        try{
            const json = JSON.parse(element.getAttribute('data-'+lang+'-change-attr'));
            for (const [attr, value] of Object.entries(json)) {
                element.setAttribute(attr, value);
            }
        }catch(e){
            console.error(`Error processing data-${lang}-change-attr for element`, element, e);
        }
    });

    elements = document.querySelectorAll('[data-translation]');
    elements.forEach(element => {
        const key = element.getAttribute('data-translation');
        if (translationStrings[lang] && translationStrings[lang][key]) {
            if(translationStrings[lang][key] === "&EMPTY&") {
                console.warn(`Translation for "${key}" is empty in language "${lang}"`);
                element.textContent = ''; // Set to empty if translation is marked as empty
                return; // Skip if translation is marked as empty
            }
            element.textContent = translationStrings[lang][key];
        } else {
            console.warn(`Translation for "${key}" not found in language "${lang}"`);
        }
    });

    // Handle CSS from data-<lang>
    elements = document.querySelectorAll('[data-'+lang+']');
    let css = '';
    elements.forEach(element => {
        const cssString = element.getAttribute('data-'+lang);
        // yeast() can return dots, which are invalid in class names. Replace dots with underscores.
        let className = "tr-" + yeast().replace(/\./g, '_');
        css += `.${className}{${cssString}}\n`;
        element.classList.add(className);
    });
    if (css) {
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    } else {
        console.warn(`No CSS found for language "${lang}"`);
    }


}

export {translateEverything,getTranslation};