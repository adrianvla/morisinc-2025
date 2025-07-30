import $ from 'jquery';
import yeast from "yeast";
import {turnOffNeon, turnOnNeon} from "./neons";

function addProject(name, img_src){
    const myId = yeast().replaceAll('-', '_').replaceAll(".", "_");
    let clickable = $(`<div class="project neon" id="${myId}">${name}</div>`);
    $(".s1 .projects").append(clickable);
    if(name.includes('-')){
        turnOnNeon(document.querySelector(`#${myId}`));
        turnOffNeon(document.querySelector(`#${myId}`));
    }

    let section = $(`<section class="project">
                <h1>${name}</h1>
                <img src="${img_src}" alt="${name}">
            </section>`);
    $("main.main-content").append(section);
}

function fetchProjects() {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: '/assets/projects.json',
            method: 'GET',
            dataType: 'json',
            success: function(data) {
                console.log(data);
                try {
                    // Process each category
                    data.forEach(category => {
                        // Add category header
                        const categoryHeader = $(`<h4 class="pill"><span>${category.category}</span></h4>`);
                        $(".s1 .projects").append(categoryHeader);

                        // Add projects for this category
                        category.items.forEach(project => {
                            addProject(project.name, project.image);
                        });
                    });

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
    });
}


export {fetchProjects};