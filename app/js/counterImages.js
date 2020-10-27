class counterImages{
    constructor(){
        this.render = require('electron').ipcRenderer;
        this.images = 0;
        this.render.send('initAI',{});
    }
    useOne(){
        this.images--;
        this.render.send('counterAI',{count:this.images});
    }
    newBuy(n){
        this.images+=n;
        this.render.send('counterAI',{count:this.images});
    }
    notLimited(){
        return (this.images > 0)?true:false;
    }
    count(){
        return this.images;
    }
    clear(n){
        this.images = n;
    }
}