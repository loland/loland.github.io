const HEADINGS = ['H2', 'H3', 'H4', 'H5', 'H6'];

let content = document.getElementsByClassName('post-content')[0];
let content_children = content.childNodes;

let previous_h = "";
for (let i = 0; i < content_children.length; i ++) {
    let tag = content_children[i].tagName
    
    if (HEADINGS.includes(tag)) {
        if (tag > previous_h) {}
    }
}