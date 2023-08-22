const arrows = document.querySelectorAll(".arrow");
let body = document.getElementsByClassName('page-content')[0].getElementsByClassName('wrapper')[0];

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

function adjust_sidebar() {
    let sidebar_width = 260; 
    let body_x = body.getBoundingClientRect().x;
    let is_closed = sidebar.classList.contains('close');
    if (body_x <= sidebar_width && !is_closed) {
        sidebar.classList.toggle('close');
    } else if (body_x > sidebar_width && is_closed) {
        sidebar.classList.toggle('close');
    }
}

window.addEventListener("resize", adjust_sidebar);