/*  generic funcions     */
function $(el){
    let out;
    switch (Array.from(el)[0]) {
        case '.':
            out = document.getElementsByClassName(el.slice(1));
            break;
        case '#':
            out = document.getElementById(el.slice(1));
            break;
        default:
            out = document.getElementsByTagName(el);
            break;
    }
    return out;
}
function $click(el,fx){
    $(el).addEventListener('click',fx);
}
$click('#btn_donation',e=>{
    window.open("https://paypal.me/MagdielL", "_blank");
});
$click('#btn_download',e=>{
    window.open("https://www.dropbox.com/s/a6gbtht7q34jfoe/stockero_1.2.0.zip?dl=0", "_blank");
});