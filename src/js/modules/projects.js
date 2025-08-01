import $ from "jquery";
import {getProjectName} from "./pathDetector";
import {initAutoFitText} from "./autoFitText";
import gsap from "gsap";

function fetchProjFile(){
    return new Promise((resolve, reject) => {
        $.ajax({
            url: '../assets/projects.json',
            method: 'GET',
            dataType: 'json',
            success: function(data) {
                console.log(data);
                resolve(data);
            },
            error: function(xhr, status, error) {
                console.error('Error fetching projects:', error);
                reject(new Error(`Failed to fetch projects: ${error}`));
            }
        });
    });
}

function fetchProjectContent(projectName) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: `../assets/site-content/${projectName}`,
            method: 'GET',
            dataType: 'html',
            success: function(data) {
                resolve(data);
            },
            error: function(xhr, status, error) {
                console.error('Error fetching project content:', error);
                reject(new Error(`Failed to fetch project content: ${error}`));
            }
        });
    });

}

function generateProject(){
    $("[data-barba-namespace='home']").remove();
    return new Promise(async (resolve, reject) => {
        const name = getProjectName();
        let projs = await fetchProjFile();
        let p = null;
        //find project in the list
        projs.forEach(cat => {
            cat.items.forEach(proj => {p = proj.name.replaceAll(' ', '-').replaceAll('.', '_') === name.replaceAll(' ', '-').replaceAll('.', '_') ? proj : p;});
        });
        console.log(p)
        if(p == null){
            console.error("Project not found: " + name);
            reject(new Error("Project not found"));
            alert("Project not found: " + name);
            return;
        }
        const img_src = ".."+p.image;
        const content = await fetchProjectContent(p.url);

        $(".s1 h4 span").text(name);
        $("main").html("");
        //create section
        $("main").append(`
            <section class="project hero">
                <h1>${name}</h1>
                <img src="${img_src}" alt="${name}">
            </section>
        `);
        $("main").append(`
            <section class="content grid-item">
                ${content}
            </section>
        `);
        gsap.timeline().set("[data-barba-namespace='home']",{
            position:"absolute"
        }).to("[data-barba-namespace='home']",{
            opacity:0,
            duration:0.5,
        }).fromTo("section.content",{
            "--grid-item-width": "0%",
            "--grid-item-width2": "100%",
        },{
            "--grid-item-width": "0%",
            "--grid-item-width2": "0%",
            ease: "power3.inOut",
            duration:1
        },"<")
        initAutoFitText();


        resolve();
    });
}


export {generateProject};