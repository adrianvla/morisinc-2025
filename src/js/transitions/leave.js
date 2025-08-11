import leaveBecauseOfLang from "./leave/lang";
import leaveHomeToProject from "./leave/homeToProject";
import defaultLeave from "./leave/default";
import {lenis, lenis2} from "../modules/smoothScrolling";
import $ from "jquery";

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
    let returnable = null;
    if(window.redirectType === 'home-to-project') {
        returnable = leaveHomeToProject();
    }else{
        returnable = defaultLeave();
    }

    $("body").append("<div class='transition-overlay'></div>");
    let bounds = $(".main").get(0).getBoundingClientRect();
    $(".transition-overlay").css("opacity",0)
        .css("background","var(--background)")
        .css("pointer-events","none")
        .css("z-index","99")
        .css("position","fixed")
        .css("top",bounds.top)
        .css("left",bounds.left)
        .css("width",bounds.width)
        .css("height",bounds.height);

    returnable.eventCallback("onComplete",()=>{
        $(".transition-overlay").css("opacity",1);
    });

    return returnable;
};