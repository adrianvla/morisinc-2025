import $ from "jquery";
import {getProjectName} from "./pathDetector";

function generateProject(){
    return new Promise((resolve, reject) => {
        $(".s1 h4 span").text(getProjectName());
        $("main").html("");



        resolve();
    });
}


export {generateProject};