import leaveBecauseOfLang from "./leave/lang";
import leaveHomeToProject from "./leave/homeToProject";
import defaultLeave from "./leave/default";
import {lenis, lenis2} from "../modules/smoothScrolling";

export default function leave(){
    try{
        lenis.destroy();
    }catch(e){}
    try{
        lenis2.destroy();
    }catch(e){}
    if(window.redirectType === 'lang-button') {
        return leaveBecauseOfLang();
    }
    if(window.redirectType === 'home-to-project') {
        return leaveHomeToProject();
    }
    return defaultLeave();
};