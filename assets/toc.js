const HEADINGS = ['H2', 'H3', 'H4', 'H5', 'H6'];

let content = document.getElementsByClassName('post-content')[0];
let content_children = content.childNodes;
let base_ul = document.createElement('ul');


let h_array = [];
for (let i = 0; i < content_children.length; i ++) {
    let tag = content_children[i].tagName
    if (HEADINGS.includes(tag)) {
        h_array.push(content_children[i]);
    }
}

let new_ul = null;
for (let i = 1; i < h_array.length; i ++) {
    let current = h_array[i];
    let previous = h_array[i - 1];
    let current_h = current.tagName;
    let previous_h = previous.tagName;
    let heading = current.innerHTML;

    let new_li = document.createElement('li');
    new_li.innerHTML = heading;
    if (current_h == previous_h && new_ul == null) {
        console.log('b1');
        base_ul.appendChild(new_li);

    } else if (current_h == previous_h && new_ul != null) {
        console.log('b2');
        new_ul.appendChild(new_li);

    } else if (current_h < previous_h) {
        console.log('b3');
        base_ul.appendChild(new_li);
        new_ul = null;
        
    } else if (current_h > previous_h) {
        console.log('b4');
        new_ul = document.createElement('ul');
        new_ul.appendChild(new_li);
    }
}

if (new_ul != null) {
    base_ul.appendChild(new_ul);
}