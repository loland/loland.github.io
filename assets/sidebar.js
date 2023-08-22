const arrows = document.querySelectorAll(".arrow");
let page_body = document.getElementsByClassName('page-content')[0].getElementsByClassName('wrapper')[0];

arrows.forEach((arrow) => {
arrow.addEventListener("click", (e) => {
    const arrowParent = e.target.closest(".arrow").parentElement.parentElement;
    arrowParent.classList.toggle("showMenu");
});
});

const sidebar = document.querySelector(".sidebar");
const sidebarBtn = document.querySelector(".bx-menu");

// sidebarBtn.addEventListener("click", () => {
//     sidebar.classList.toggle("close");
// });

function initial_adjust_sidebar() {
    let sidebar_width = 260; 
    let page_body_x = page_body.getBoundingClientRect().x;
    if (page_body_x <= sidebar_width) {
        sidebar.classList.add("sidebar-hidden");
    }
}

initial_adjust_sidebar();

function adjust_sidebar() {
    let sidebar_width = 260; 
    let page_body_x = page_body.getBoundingClientRect().x;
    let is_closed = sidebar.classList.contains('close');

    sidebar.classList.remove("sidebar-hidden");
    if (page_body_x <= sidebar_width && !is_closed) {
        sidebar.classList.toggle('close');
    } else if (page_body_x > sidebar_width && is_closed) {
        sidebar.classList.toggle('close');
    }
}

window.addEventListener("resize", adjust_sidebar);


