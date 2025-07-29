import leaveBecauseOfLang from "./leave/lang";

export default function leave(){
    if(window.redirectType === 'lang-button') {
        return leaveBecauseOfLang();
    }
};