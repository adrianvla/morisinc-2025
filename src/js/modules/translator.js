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
        // Remove the lang parameter from URL without reloading
        params.delete('lang');
        const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '') + window.location.hash;
        window.history.replaceState({}, '', newUrl);
        return lang;
    }
    lang = getLanguageCookie();
    if (lang) return lang;
    return 'en';
}

const translationStrings = {
    jp: {
        "About": "私について",
        "Home": "ホーム",
        "Lang": "言語",
        "Socials":"SNS",
        "Language Selection":"言語選択",
        "Projects":"プロジェクト",
        "Your Experience":"体験が",
        "Is Loading":"読み込んでいます"
    },
    de:{
        "About": "Uber Mich",
        "Home": "Startseite",
        "Lang": "Sprache",
        "LANGUAGE SELECTION": "SPRACHAUSWAHL",
        "Projects":"Projekte",
    },
    ru:{
        "About": "Обо мне",
        "Home": "На Главную",
        "Lang": "Язык",
        "Socials":"Социальные сети",
        "Adrian":"Адриан",
        "Vlasov":"Власов",
        "LANGUAGE SELECTION": "ВЫБОР ЯЗЫКА",
        "Projects":"Проекты",
    },
    fr:{
        "About": "À Propos",
        "Home": "Accueil",
        "Lang": "Langue",
        "Socials":"Contact",
        "LANGUAGE SELECTION": "SÉLECTION DE LA LANGUE",
        "Projects":"Projets",
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
            if(element.getAttribute('data-scramble-on-enter')){
                element.setAttribute('data-scramble-on-enter', translationStrings[lang][key]);
            }else{
                if(element.getAttribute('data-text'))
                    element.setAttribute('data-text', translationStrings[lang][key]);
                else
                    element.textContent = translationStrings[lang][key];
            }
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

export {translateEverything, getTranslation, getCurrentLanguage};
