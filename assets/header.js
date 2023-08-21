let title = document.getElementsByClassName('site-title')[0];
let word_list = [title.innerHTML, title.getAttribute('alt')];
let word = word_list[0];

title.innerHTML = word + '<span id="bar">|</span>';

let backspace = true;
let currentWord = word;
let stop = false;

function blink() {
    let bar = document.getElementById('bar');
    if (bar.style.display == '') {
        bar.style.display = 'none';
    } else {
        bar.style.display = '';
    }
    
}

function type() {
    if (stop) {
        return
    }

    if (currentWord.length == 0) {
        backspace = false;
        if (word == word_list[0]) {
            word = word_list[1];
        } else {
            word = word_list[0];
        }
    } else if (currentWord.length == word.length) {
        backspace = true;
        
    }

    if (backspace) {
        currentWord = currentWord.slice(0, -1);
    } else {
        currentWord = word.slice(0, currentWord.length + 1);
    }
    
    title.innerHTML = currentWord + '<span id="bar">|</span>';

    if (currentWord.length == word.length) {
        stop = true;
        var blinkInterval = setInterval(blink, 600);
        setTimeout(function(){stop = false; clearInterval(blinkInterval)}, 3000);
        return
    }
}

setInterval(type, 200);