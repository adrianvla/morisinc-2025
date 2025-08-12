import $ from 'jquery';
import yeast from "yeast";
import {turnOffNeon, turnOnNeon} from "./neons";
import barba from "@barba/core";
import {getProjectName} from "./pathDetector";
import {getCurrentLanguage, getTranslation} from "./translator";
import {colors} from "./changeTheme";
import initLazyLoad from "./lazyLoad";
let index = 0;
function addProject(name, desc, img_src, directURL, url){
    const myId = yeast().replaceAll('-', '_').replaceAll(".", "_");
    let clickable = $(`<div class="project neon" id="${myId}">${name}</div>`);
    $(".s1 .projects").append(clickable);
    if(name.includes('-')){
        turnOnNeon(document.querySelector(`#${myId}`));
        turnOffNeon(document.querySelector(`#${myId}`));
    }

    let section = $(`<section class="project" id="section-${myId}" style="--border:${colors[index]}" data-change-color-index="${index}">
                <h1>${name}</h1>
                <h2>${desc}</h2>
                <img data-src="${img_src}" src="${img_src.replace('img','img-low-res')}" alt="${name}">
            </section>`);
    $("main.main-content").append(section);
    $(section).on("click", ()=>{
        if(directURL) {
            window.open(url, "_blank");
            return;
        }
        window.redirectType = "home-to-project";
        window.projectSectionID = `section-${myId}`;
        barba.go(`/project?${name.replaceAll(' ', '-').replaceAll('.', '_')}`);
    });
    index = (index + 1) % colors.length;
}

function fetchProjects() {
    index = 0;
    $(".s1 .projects").html("");
    $(".s1 h4 span").text(getTranslation("PROJECTS"));
    $("[data-barba-namespace='project']").remove();
    return new Promise((resolve, reject) => {
        $.ajax({
            url: '/assets/desc_translations.json',
            method: 'GET',
            dataType: 'json',
            success: function(translations) {
                $.ajax({
                    url: '/assets/projects.json',
                    method: 'GET',
                    dataType: 'json',
                    success: function(data) {
                        // console.log(data);
                        try {
                            // Process each category
                            data.forEach(category => {
                                if(category.category === "HIDDEN") return;
                                // Add category header
                                const categoryHeader = $(`<h4 class="pill"><span>${getTranslation(category.category)}</span></h4>`);
                                $(".s1 .projects").append(categoryHeader);

                                const currentLang = getCurrentLanguage();
                                // Add projects for this category
                                category.items.forEach(project => {
                                    let desc = project.desc;
                                    if(project.name in translations)
                                        if(currentLang in translations[project.name])
                                            desc = translations[project.name][currentLang];
                                    addProject(project.name, desc, project.image, project.directURL, project.url);
                                });
                            });
                            initLazyLoad();

                            resolve(data);
                        } catch (error) {
                            console.error('Error processing projects data:', error);
                            reject(error);
                        }
                    },
                    error: function(xhr, status, error) {
                        console.error('Error fetching projects:', error);
                        reject(new Error(`Failed to fetch projects: ${error}`));
                    }
                });
            },
            error: function(xhr, status, error) {
                console.error('Error fetching translations:', error);
                reject(new Error(`Failed to fetch translations: ${error}`));
            }
        });
    });
}


export {fetchProjects};