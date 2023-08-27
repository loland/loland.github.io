let article = document.getElementsByTagName('article')[0];
let toc = document.getElementsByClassName('toc')[0];
let body_content = document.getElementsByClassName('post-content')[0];

toc.style.top = "194px";

function adjust_toc() {
    let article_bounds = article.getBoundingClientRect();
    let toc_left = article_bounds.x + article_bounds.width + 30;
    toc.style.left = toc_left + "px";
}

adjust_toc()



window.addEventListener('resize', adjust_toc);


const HEADINGS = ['H2', 'H3', 'H4', 'H5', 'H6'];

let content = document.getElementsByClassName('post-content')[0];
let content_children = content.childNodes;

let h_array = [];
for (let i = 0; i < content_children.length; i ++) {
    let tag = content_children[i].tagName
    if (HEADINGS.includes(tag)) {
        h_array.push(content_children[i]);
    }
}

let base_ul = document.createElement('ul');
base_ul.classList.add('toc-ul');

let new_ul = null;
for (let i = 0; i < h_array.length; i ++) {
    let current = h_array[i];
    let previous = null;

    if (i == 0) {
        previous = current;
    } else {
        previous = h_array[i - 1];
    }

    let current_h = current.tagName;
    let previous_h = previous.tagName;
    let heading = current.innerHTML;

    let new_li = document.createElement('li');
    new_li.classList.add('toc-li');
    
    let a = document.createElement('a');
    a.classList.add('toc-a');
    a.href = "#" + current.id;
    a.innerHTML = heading;
    new_li.appendChild(a);

    if (current_h == previous_h && new_ul == null) {
        base_ul.appendChild(new_li);
        console.log('b1')

    } else if (current_h == previous_h && new_ul != null) {
        new_ul.appendChild(new_li);
        console.log('b2')

    } else if (current_h < previous_h) {
        base_ul.appendChild(new_ul);
        base_ul.appendChild(new_li);
        new_ul = null;
        console.log('b3')
        
    } else if (current_h > previous_h) {
        new_ul = document.createElement('ul');
        new_ul.classList.add('toc-ul');
        new_ul.appendChild(new_li);
        console.log('b4')
    }
}

if (new_ul != null) {
    base_ul.appendChild(new_ul);
}

toc.appendChild(base_ul);


let rate_limiter = 20;
let current_rate = rate_limiter - 1;
let toc_li_array = document.getElementsByClassName('toc-li');

function highlight_toc() {
    current_rate += 1;
    if (current_rate != rate_limiter) {
        return;
    }

    let found = false;
    for (let i = h_array.length - 1; i >= 0; i --) {
        let h = h_array[i];
        let y = h.getBoundingClientRect().y;

        if (y <= window.innerHeight / 2 && !found) {
            console.log(h.innerHTML);
            toc_li_array[i].classList.add('toc-active');
            toc_li_array[i].classList.remove('toc-inactive');
            found = true;
        } else {
            toc_li_array[i].classList.remove('toc-active');
            toc_li_array[i].classList.add('toc-inactive');
        }

    }
        
    current_rate = 0;
}

highlight_toc();
document.addEventListener("scroll", highlight_toc);