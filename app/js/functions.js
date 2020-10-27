// general functions
const { ipcRenderer, remote } = require('electron');
const dialog = remote.dialog;
const Dialogs = require('dialogs');
const dialogs = Dialogs();
const loading = new loadingOverlay('#3767B1');
const AI = new counterImages();
const canvasChart = document.getElementById('chart');
const ctx = canvasChart.getContext('2d');
var chart;
var appSettings = {};
var stateAnimationFTP;
var typeUpload = 'Imagen';
var filterData = false;
var timeAnimation = 1;
var selectedImages = [];
var selectedAgency = [];
var tempDataBase;
var allLoatedImages = [];
var indexAgency = 0;
var indexPhoto = 0;
var sessionName = '';
var uploadControl = {
    ok:0,
    fail:0
};
var openedFiles = {files:[],index:0};
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
function click(el,fx){
    $(el).addEventListener('click',fx);
}
function init(){
    $('nav')[0].style.height = (window.innerHeight-50)+'px';
    $('#app').style.height = (window.innerHeight-50)+'px';
    $('#btn-keywording').className += ' active';
    $('#keywording').style.display = 'block';
    ipcRenderer.send('getSettings',{});
}
function messageBox(message,type){
    Swal.fire({
        icon: type,
        title: message
    })
}
function structureImageSource(src){
    const srcSplit = src.split('/',500);
    let output = {
      src:'',
      name:'',
      type:''
    }
    for (var i = 0; i < srcSplit.length-1; i++) {
      output.src += srcSplit[i]+'\\';
    }
    const tmp_name = srcSplit[srcSplit.length-1].split('.',500);
    for (var i = 0; i < tmp_name.length-1; i++) {
      output.name = tmp_name[i];
    }
    output.type = '.'+tmp_name[tmp_name.length-1];
    return output;
}
function saveSelected(){
    selectedImages = [];
    for(let i=0;i<allLoatedImages.length;i++){
        if(allLoatedImages[i].selected == true){
            selectedImages.push(allLoatedImages[i]);
        }
    }
    const imagesCount = selectedImages.length;
    for(let i=0;i<imagesCount;i++){
        $('#'+selectedImages[i].container).style.borderLeftColor = '#5CFF66';
    }
    ipcRenderer.send('saveSelected',{images:selectedImages});
}
function uploadSelected(){
    selectedImages = [];
    for(let i=0;i<allLoatedImages.length;i++){
        if(allLoatedImages[i].selected == true){
            selectedImages.push(allLoatedImages[i]);
        }
    }
    $('#indicatorUpload').innerText = `${selectedImages.length} Imagenes`;
    toFront('#btn-ftp','#ftp');
}
function windowResize(){
    $('nav')[0].style.height = (window.innerHeight-55)+'px';
    $('#app').style.height = (window.innerHeight-55)+'px';
}
function closeApp(){
    ipcRenderer.send('close-app',{});
}
function minimizeApp(){
    ipcRenderer.send('minimize-app',{});
}
function toFront(btn,view){
    let lis = $('li');
    let views = $('.page');
    for(let i=0;i<lis.length;i++){
        lis[i].classList.remove("active");
    }
    $(btn).className += ' active';
    for(let i=0;i<views.length;i++){
        views[i].style.display = 'none';
    }
    $(view).style.display = 'block';
}
function createChart(uploads,year){
    clearChart();
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    let datesCount = [0,0,0,0,0,0,0,0,0,0,0,0];
    let filesCount = [0,0,0,0,0,0,0,0,0,0,0,0];
    let agencies = [0,0,0,0,0,0,0,0,0,0,0,0];
    for(let i=0;i<uploads.length;i++){
        const DT = uploads[i].date.split('-',3);
        if(DT[0] == year){
            datesCount[parseInt(DT[1])-1]++;
            filesCount[parseInt(DT[1])-1] += uploads[i].images.length;
            agencies[parseInt(DT[1])-1] += uploads[i].agencyList.length;
        }
    }
    chart = new Chart(ctx, {
        type: 'line',
        data:{
            labels:months,
            datasets:[{
                label: 'Sesiones',
                data:datesCount,
                fill:false,
                backgroundColor: '#FF6161',
                borderColor: '#FF6161',
                borderWidth:5
            },
            {
                label:'Archivos',
                data:filesCount,
                fill:false,
                backgroundColor:'#3767B1',
                borderColor:'#3767B1',
                borderWidth:5
            },
            {
                label:'Agencias',
                data:agencies,
                fill:false,
                backgroundColor:'#BDB76B',
                borderColor:'#BDB76B',
                borderWidth:5
            }]
        },
        options:{
            scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true
                }
            }]
        }
        }
    });
}
function clearChart(){
    ctx.clearRect(0, 0, canvasChart.width, canvasChart.height);
    ctx.restore();
    if(chart != undefined){
        chart.destroy();
    }
}
function createEarningsChart(uploads){
    clearChart();
    let sessions = ['','','','',''];
    let earnings = [0,0,0,0,0];
    for(let i=0;i<uploads.length;i++){
        sessions[i] = uploads[i].name;
        earnings[i] = uploads[i].earnings;
    }
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels:sessions,
            datasets:[{
                label: 'Sesiones con mejor rendimiento U$',
                backgroundColor: '#FF6161',
                data:earnings
            }]
        },
        options: {
            scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true
                }
            }]
        }
        }
    });
}
function logoAsing(text){
    if(text.length < 1){
      return "img/agencies/stockero.png";
    }
    text = text.toLowerCase();
    if(text.indexOf("shutterstock") != -1){
      return "img/agencies/shutterstock.png";
    }
    else if(text.indexOf("adobe") != -1){
      return "img/agencies/adobe.png";
    }
    else if(text.indexOf("123rf") != -1){
        return "img/agencies/123rf.png";
    }
    else if(text.indexOf("500px") != -1){
        return "img/agencies/500px.png";
    }
    else if(text.indexOf("agora") != -1){
        return "img/agencies/agora.png";
    }
    else if(text.indexOf("alamy") != -1){
        return "img/agencies/alamy.png";
    }
    else if(text.indexOf("bigstock") != -1){
        return "img/agencies/bigstock.png";
    }
    else if(text.indexOf("canstock") != -1){
        return "img/agencies/canstock.png";
    }
    else if(text.indexOf("canva") != -1){
        return "img/agencies/canva.png";
    }
    else if(text.indexOf("creative") != -1){
        return "img/agencies/creativemarket.png";
    }
    else if(text.indexOf("dreamstime") != -1){
        return "img/agencies/dreamstime.png";
    }
    else if(text.indexOf("freepik") != -1){
        return "img/agencies/freepik.png";
    }
    else if(text.indexOf("getty") != -1){
        return "img/agencies/getty.png";
    }
    else if(text.indexOf("istock") != -1){
        return "img/agencies/istock.png";
    }
    else if(text.indexOf("offset") != -1){
        return "img/agencies/offset.png";
    }
    else if(text.indexOf("photocase") != -1){
        return "img/agencies/photocase.png";
    }
    else if(text.indexOf("pond") != -1){
        return "img/agencies/pond5.png";
    }
    else if(text.indexOf("stocksy") != -1){
        return "img/agencies/stocksy.png";
    }
    else{
      return "img/agencies/stockero.png";
    }
}
ipcRenderer.on('settings',(e,dt)=>{
    appSettings = dt;
    initTheme();
    if(!dt.copy){
        $('#btn-iworkspace').classList.remove('iactive');
    }
    if(dt.copy && dt.workspace.length<1){
        Swal.fire({
            title: '¿Crear espacio de trabajo?',
            text: "Se creara una copia ordenada de las fotos subidas.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Si, vamoss!',
            cancelButtonText: 'No 😔'
          }).then((result) => {
            if (result.value) {
                dialog.showOpenDialog({properties: ['openDirectory']},folder=>{
                    appSettings.workspace = folder[0];
                    ipcRenderer.send('setSettings',appSettings);
                });
            }
            else{
                dt.copy = false;
                $('#btn-iworkspace').classList.remove('iactive');
                ipcRenderer.send('setSettings',dt);
            }
        })
    }
});

// view home functions
function openDonation(){
    ipcRenderer.send('openPaypal',{url:'https://paypal.me/MagdielL?locale.x=es_XC'});
    //open('https://paypal.me/MagdielL?locale.x=es_XC', '_blank','menubar=no');
}
function openCreator(){
    ipcRenderer.send('openPaypal',{url:'https://www.flaticon.com/authors/smashicons'});
}
function openPlaystore(){
    //messageBox('App en desarrollo, estara lista pronto 😎','info');
    //Swal.fire('Any fool can use a computer')
    ipcRenderer.send('openPaypal',{url:'https://play.google.com/store/apps/details?id=mrStockero.magmadevstudios.com'});
}
function openDirectory(){
    dialog.showOpenDialog({properties: ['openFile', 'multiSelections']},files=>{
        $('#imagesContainer').innerHTML = '';
        selectedImages = [];
        allLoatedImages = [];
        openedFiles.files = files;
        openedFiles.index = 0;
        if(files.length>0){
            for(let i=0;i<files.length;i++){
                let url = openedFiles.files[i].replace(/\\/g, "/");
                let imag = structureImageSource(url);
                    let filei ={
                        id:i+1,
                        imageName:imag.name+imag.type,
                        src:url,
                        rawSRC:openedFiles.files[i],
                        thumbnail:'',
                        description:'',
                        tags:''
                    }
                ipcRenderer.send('openImageData',filei);
            }
            loading.hide();
        }
    });
}
function filesDrop(ev) {
    //ev.preventDefault();
    let data = ev.dataTransfer;
    console.log(data);
  }
function blockRename(){
    const options = {
        title: 'Select your images',
        properties: ['showHiddenFiles', 'openFile', 'multiSelections']
    };
    dialog.showOpenDialog(null,options,filePaths=>{
        if(filePaths){
            Swal.mixin({
                input: 'text',
                confirmButtonText: 'Renombrar',
                showCancelButton: true,
                cancelButtonText: 'Cancelar'
              }).queue([
                {
                  title: 'Renombrar bloque de imagenes',
                  text: 'Ingresa el nombre'
                }
              ]).then((result) => {
                if (result.value) {
                    ipcRenderer.send('openBlockRename',{files:filePaths,name:result.value});
                }
              })
        }
    });
}
ipcRenderer.on('render_image',(e,dt)=>{
    $('#imagesContainer').append(createImageBox(dt.imageName,dt.src,dt));
});

// view keywording functions
function selectAllFiles(){
    for(let i=0;i<allLoatedImages.length;i++){
        allLoatedImages[i].selected = true;
        $('#'+allLoatedImages[i].photoId).innerText = 'SELECCIONADO';
        $('#'+allLoatedImages[i].photoId).style.filter = 'grayscale(100%)';
        $('#'+allLoatedImages[i].photoId).style.borderColor = '#f0f0f0';
    }
}
function createImageBox(imageName,src,exif){
    let id = exif.id;
    let oldIMG = imageName;
    let container = document.createElement('div');
    let photo = document.createElement('div');
    let panelRight = document.createElement('div');
    let saveButton = document.createElement('div');
    let selectButton = document.createElement('div');
    let translateButton = document.createElement('div');
    let editorialButton = document.createElement('div');
    let name = document.createElement('input');
    let description = document.createElement('input');
    let keywords = document.createElement('textarea');
    let ctrlPress=false;
    name.setAttribute('id','inName'+id);
    container.setAttribute('id','inContainer'+id);
    description.setAttribute('id','inDesc'+id);
    keywords.setAttribute('id','inKey'+id);
    container.className += 'boxImage';
    photo.className += 'photo';
    photo.setAttribute('id','photo'+id);
    photo.style.backgroundImage = `url('data:image/jpeg;base64, ${exif.thumbnail}')`;
    //photo.style.backgroundImage = `url(img/loading3.gif)`;
    photo.addEventListener('click',e=>{
        for(let i=0;i<allLoatedImages.length;i++){
            if(!allLoatedImages[i].selected && allLoatedImages[i].id == id){
                photo.innerText = 'SELECCIONADO';
                photo.style.filter = 'grayscale(100%)';
                photo.style.borderColor = '#f0f0f0';
                const data = {
                    id:id,
                    selected:true,
                    oldName:oldIMG,
                    name:name.value,
                    keywords:keywords.value.replace('\n',''),
                    description:description.value,
                    image:src,
                    container:'inContainer'+id,
                    thumbnail:exif.thumbnail,
                    inputKeywords:'inKey'+id,
                    inputDescription:'inDesc'+id,
                    photoId:'photo'+id
                }
                allLoatedImages[i] = data;
            }
            else if(allLoatedImages[i].id == id){
                photo.innerText = '';
                photo.style.filter = 'grayscale(0%)';
                photo.style.borderColor = '#21252B';
                allLoatedImages[i].selected = false;
            }
        }
    });
    container.append(photo);
    panelRight.className += 'rightPanel';
    saveButton.className += 'btnKeyword green';
    saveButton.title = 'Guardar';
    saveButton.innerHTML = '<i class="far fa-save"></i>';
    saveButton.addEventListener('click',e=>{
        container.style.borderLeftColor = '#5CFF66';
        const data = {
            oldName:oldIMG,
            title:name.value,
            keywords:keywords.value.replace('\n',''),
            description:description.value,
            DateTimeOriginal:exif.DateTimeOriginal,
            image:src
        }
        ipcRenderer.send('savePicure',data);
    });
    selectButton.innerHTML = '<i class="fas fa-language"></i>';
    selectButton.title = 'Traducir descripción';
    selectButton.className += ' btnKeyword red';
    selectButton.addEventListener('click',e=>{
        const toTranslate = {
            text:description.value,
            id:'inDesc'+id
        }
        container.style.borderLeftColor = '#ECFF53'
        ipcRenderer.send('start_translation',toTranslate);
    });
    translateButton.innerHTML = '<i class="fas fa-language"></i>';
    translateButton.title = 'Traducir titulo';
    translateButton.className += ' btnKeyword blue';
    translateButton.addEventListener('click',e=>{
        const toTranslate = {
            text:name.value,
            id:'inName'+id
        }
        container.style.borderLeftColor = '#ECFF53'
        ipcRenderer.send('start_translation',toTranslate);
    });
    editorialButton.className += ' btnKeyword gold';
    editorialButton.innerHTML = '<i class="fas fa-passport"></i>';
    editorialButton.title = 'Titulo editorial';
    editorialButton.addEventListener('click',e=>{
        Swal.mixin({
            input: 'text',
            confirmButtonText: 'Aceptar',
            cancelButtonText: 'Cancelar',
            showCancelButton: true
          }).queue([
            {
              title: 'Ubicación del disparo',
              text: 'Ejemplo: Chicago, IL, USA'
            }
          ]).then((result) => {
            if (result.value) {
                let desc = $('#'+'inName'+id);
                desc.value = result.value[0]+exif.editorial+desc.value;
                container.style.borderLeftColor = '#ECFF53';
            }
          })
    });
    panelRight.append(saveButton);
    panelRight.append(editorialButton);
    panelRight.append(translateButton);
    panelRight.append(selectButton);
    container.append(panelRight);
    name.className = 'in';
    name.type = 'text';
    name.placeholder = 'TITULO';
    name.value = exif.title;
    name.addEventListener('keyup',e=>container.style.borderLeftColor = '#ECFF53');
    name.addEventListener('change',e=>container.style.borderLeftColor = '#ECFF53');
    container.append(name);
    keywords.className += 'in ta';
    keywords.placeholder = 'ETIQUETAS';
    keywords.value = exif.tags;
    keywords.addEventListener('keyup',e=>container.style.borderLeftColor = '#ECFF53');
    keywords.addEventListener('change',e=>container.style.borderLeftColor = '#ECFF53');
    container.append(keywords);
    description.className = 'in';
    description.type = 'text';
    description.placeholder = 'DESCRIPCION';
    description.value = exif.description;
    description.addEventListener('keydown',e=>{
        if(e.keyCode == 17) ctrlPress=true;
    });
    description.addEventListener('keyup',e=>{
        container.style.borderLeftColor = '#ECFF53';
        if(ctrlPress && e.keyCode == 84){
            ctrlPress = false;
            const toTranslate = {
                text:description.value,
                id:'inDesc'+id
            }
            ipcRenderer.send('start_translation',toTranslate);
        }
    });
    description.addEventListener('change',e=>container.style.borderLeftColor = '#ECFF53');
    container.append(description);
    const ndt = {
        id:id,
        selected:false,
        oldName:oldIMG,
        name:name.value,
        keywords:keywords.value.replace('\n',''),
        description:description.value,
        image:src,
        container:'inContainer'+id,
        thumbnail:exif.thumbnail,
        inputKeywords:'inKey'+id,
        inputDescription:'inDesc'+id,
        photoId:'photo'+id
    }
    allLoatedImages.push(ndt);
    return container;
}
ipcRenderer.on('end_translation',(e,data)=>{
    $('#'+data.id).value = data.text;
});
ipcRenderer.on('end_render',(e,data)=>{
    toFront('#btn-keywording','#keywording');
});
ipcRenderer.on('end_initAI',(e,counter)=>{
    AI.clear(counter);
    //$('#btn-aiCounter').innerText = AI.count()+' Images';
});
function openImstocker(){
    loading.show();
    ipcRenderer.send('openImstocker',{url:'https://imstocker.com/en/keyworder'});
}
function deepl(){
    loading.show();
    ipcRenderer.send('openImstocker',{url:'https://www.deepl.com/translator'});
}
async function aiKeyword(image){
    let response = await fetch("https://microsoft-azure-microsoft-computer-vision-v1.p.rapidapi.com/analyze?visualfeatures=Description", {
        "method": "POST",
        "headers": {
            "x-rapidapi-host": "microsoft-azure-microsoft-computer-vision-v1.p.rapidapi.com",
            "x-rapidapi-key": "f56e06d88dmsh497fa76ec9a5cdep127189jsn1e0ae43df03f",
            "content-type": "application/json",
            "accept": "application/json"
        },
        "body": {
            "url": image
        }
    })
    let jsonResponse = await response.json();
    return jsonResponse;
}
async function aiKeywordSelections(){
    for (const image in selectedImages) {
        let dataImage = await aiKeyword(image.src);
    }
}
ipcRenderer.on('end_imstoker',(e,data)=>{
    loading.hide();
});
ipcRenderer.on('renameEnd',(e,data)=>{
    Swal.fire(
        'Listo!',
        'Bloque de archivos renombrado',
        'success'
      )
});
ipcRenderer.on('end_pay',(e,data)=>{
    AI.newBuy(1500);
    $('#btn-aiCounter').innerText = AI.count()+' Images';
});
function btnCounter(){
    ipcRenderer.send('start_pay',{});
}
function uploadToServer(){
    const imagesCount = selectedImages.length;
    let continueKeywording = true;
    if(imagesCount > AI.count()){
        dialogs.confirm("Buy 1500 images of capacity for U$10 ?",ok=>{
            if(ok){
                ipcRenderer.send('start_pay',{});
            }
            else{
                continueKeywording = false;
            }
        });
    }
    if(continueKeywording){
        for(let i=0;i<imagesCount;i++){
            let image = {
                position:i,
                image:selectedImages[i].image
            }
            console.log(image);
            ipcRenderer.send('uploadImage',image);
        }
    }
}
ipcRenderer.on('end_upload',function(e,data){
    if(!data.webUrl){
        return;
    }
    if(AI.notLimited){
        ipcRenderer.send('analizeImage',data);
    }
    else{
        alert('The limit of images with AI has been reached');
    }
});
ipcRenderer.on('end_analize',(e,data)=>{
    AI.useOne();
    $('#btn-aiCounter').innerText = AI.count()+' Images';
    let inDesc = selectedImages[data.position].inputDescription;
    let inKeys = selectedImages[data.position].inputKeywords;
    let inCont = selectedImages[data.position].container;
    $('#'+inDesc).value = data.description;
    let textWords = '';
    for(let i=0;i<data.tags.length;i++){
        textWords += data.tags[i]+', ';
    }
    $('#'+inCont).style.borderLeftColor = '#ECFF53';
    $('#'+inKeys).value = textWords.substring(0,(textWords.length-2));
});
// view FTP functions
ipcRenderer.on('initDataFTP',(e,data)=>{
    selectedAgency = data;
    $('#aToUpload').innerText = 'AGENCIAS A SUBIR: '+data.length;
});
function selectVideos(){
    const openOptions = {
        filters: [
            { name: 'Videos', extensions: ['mkv', 'avi', 'mp4', 'mov', 'flv', 'wmv', 'csv'] }
        ],
        properties: ['openFile', 'multiSelections']
    }

    dialog.showOpenDialog(openOptions,videos=>{
        if(videos.length>0){
            typeUpload = 'Video';
            $('#indicatorUpload').innerText = `${videos.length} Video`;
            selectedImages = [];
            for(let i=0; i<videos.length; i++){
                const vname = videos[i].split('\\',500);
                selectedImages.push({image:videos[i],name:vname[vname.length-1]});
            }
        }
    });
}
function startFTP(){
    Swal.mixin({
        input: 'text',
        confirmButtonText: 'Iniciar subida',
        showCancelButton: true,
        cancelButtonText: 'Cancelar'
      }).queue([
        {
          title: 'Subir sesión',
          text: 'Ingresa el nombre de la sesión'
        }
      ]).then((result) => {
            if(result.value[0].length>1){
                if(selectedAgency.length < 1){
                    messageBox('La lista de agencias esta vacia','warning');
                    return;
                }
                if(selectedImages.length < 1){
                    messageBox('La lista de archivos esta vacia','warning');
                    return;
                }
                $('#img-ftp').src = 'img/cloud.png';
                animationFTP(true);
                let date = new Date();
                let m = ((date.getMonth()+1) < 10)?'0'+(date.getMonth()+1):(date.getMonth()+1);
                let d = (date.getDate() < 10)?'0'+date.getDate():date.getDate();
                let data = {
                    date:`${date.getFullYear()}-${m}-${d}`,
                    time:`${date.getHours()}:${date.getMinutes()}`,
                    name:result.value[0],
                    agencyList:[],
                    images:[],
                    earnings:0
                };
                sessionName = result.value[0];
                for(let i=0;i<selectedAgency.length;i++){
                    data.agencyList.push(selectedAgency[i].name);
                }
                for(let i=0;i<selectedImages.length;i++){
                    data.images.push(selectedImages[i].name);
                }
                ipcRenderer.send('saveUpload',data);
                startUpload();
            }
      })
}
function animationFTP(state){
    if(state){
        stateAnimationFTP = window.setInterval(e=>{
            if(timeAnimation%2 == 0){
                $('#img-ftp').style.transform = 'scale(1.2)';
            }
            else{
                $('#img-ftp').style.transform = 'scale(1)';
            }
            timeAnimation++;
        },1000);
    }
    else{
        clearInterval(stateAnimationFTP);
        timeAnimation = 1;
    }
}
function addAgency(){
    ipcRenderer.send('viewAddAgency',{});
}
function deleteAgency(){
    ipcRenderer.send('viewDeleteAgency',{});
}
function uploadList(){
    ipcRenderer.send('addListUploads',{});
}
ipcRenderer.on('listedFTP',(e,ftpList)=>{
    $('#aToUpload').innerText = 'AGENCIAS A SUBIR: '+ftpList.length;
    selectedAgency = ftpList;
});
// view uploads functions
function createUploadBox(item,index){
   let tr = document.createElement('tr');
   let money = document.createElement('td');
   let date = document.createElement('td');
   let name = document.createElement('td');
   let time = document.createElement('td');
   let files = document.createElement('td');
   let agencies = document.createElement('td');
   let filesNames = "";
   money.innerText = 'U$ '+item.earnings;
   money.title = 'Agregar ingresos';
   money.style.cursor = 'pointer';
   money.addEventListener('click',e=>{
       Swal.mixin({
        input: 'text',
        confirmButtonText: 'Actualizar',
        showCancelButton: true,
        inputValue:'0.00',
        cancelButtonText: 'Cancelar'
      }).queue([
        {
          title: 'Agregar ingresos',
          text: 'La cantidad que ingreses se sumara a los '+money.innerText+' actuales'
        }
      ]).then((result) => {
        if (result.value[0]){
            Array.from(result.value[0]).map(k=>{
                if(k!='1' || k!='0' || k!='3' || k!='4' || k!='5' || k!='6' || k!='7' || k!='8' || k!='9' || k!= '.'){
                    messageBox('Error en el formato de la moneda','error');
                    return;
                }
            });
            const earnings = parseFloat(result.value[0]);
            const totalEarnings = {
                earnings: item.earnings+earnings,
                indexSession:index
            }
            tempDataBase.uploads[totalEarnings.indexSession].earnings = totalEarnings.earnings;
            ipcRenderer.send('updateEarnings',totalEarnings);
            money.innerText = 'U$ '+totalEarnings.earnings;
            messageBox('Actualizado!','success');
        }
      })
   });
   name.innerText = item.name;
   date.innerText = item.date;
   time.innerText = item.time;
   files.innerText = item.images.length+' 📋';
   for(let i=0;i<item.images.length;i++){
       filesNames += item.images[i]+'\n';
   }
   name.title = 'Abrir en el explorador de archivos';
   name.style.cursor = 'pointer';
   name.addEventListener('click',e=>{
    Swal.fire({
        title: '¿Abrir en el explorador?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Si',
        cancelButtonText:'No'
      }).then((result) => {
        if (result.value) {
            const montsNames = (appSettings.lang == 'ES')?['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']:['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            const dateSplit = item.date.split('-',3);
            let data = {
                folder:appSettings.workspace+'\\'+dateSplit[0]+'\\'+montsNames[parseInt(dateSplit[1])-1]+'\\'+item.name
            };
            ipcRenderer.send('openFolder',data);
        }
      })
   });
   files.title = filesNames;
   let agencyList = item.agencyList;
   for(let i=0;i<agencyList.length;i++){
       let img = document.createElement('img');
       img.title = agencyList[i];
       img.src = logoAsing(agencyList[i]);
       agencies.append(img);
    }
   tr.append(money);
   tr.append(files);
   tr.append(name);
   tr.append(date);
   tr.append(time);
   tr.append(agencies);
   return tr;
}
ipcRenderer.on('end_uploadPhoto',(e,data)=>{
    if(data.status){
        uploadControl.ok++;
    }
    else{
        uploadControl.fail++;
    }
    $('#ftpIndicator').innerText = `exito:${uploadControl.ok} error:${uploadControl.fail}`;
    indexPhoto--;
    if(indexPhoto<0){
        indexAgency--;
        indexPhoto = selectedImages.length-1;
    }
    if(indexAgency<0){
        $('#img-ftp').src = 'img/miscellaneous.png';
        $('#aToUpload').innerText = 'AGENCIAS A SUBIR: 0';
        $('#indicatorUpload').innerText = `Listo`;
        typeUpload = 'Imagenes';
        selectedImages = [];
        selectedAgency = [];
        animationFTP(false);
        return;
    }
    $('#aToUpload').innerText = 'AGENCIAS A SUBIR: '+(indexAgency+1);
    $('#indicatorUpload').innerText = (selectedImages.length-indexPhoto)+`/${selectedImages.length} ${typeUpload}`;
    uploadPhoto(selectedAgency[indexAgency],selectedImages[indexPhoto]);
});
function uploadPhoto(agency,photo){
    let data = {
        agency:agency,
        photo:photo,
        session:sessionName
    };
    ipcRenderer.send('uploadPhoto',data);
}
function startUpload(){
    indexAgency = selectedAgency.length-1;
    indexPhoto = selectedImages.length-1;
    uploadControl.ok = 0;
    uploadControl.fail = 0;
    $('#indicatorUpload').innerText = (selectedImages.length-indexPhoto)+`/${selectedImages.length} ${typeUpload}`;
    uploadPhoto(selectedAgency[indexAgency],selectedImages[indexPhoto]);
}
function initUploads(){
    $('#tableSessions').innerHTML = '';
    ipcRenderer.send('getUploads',{});
}
ipcRenderer.on('render_uploads',(e,data)=>{
    tempDataBase = data;
    createChart(data.uploads,$('#in-year').value);
    for(let i=0;i<data.uploads.length;i++){
        $('#tableSessions').append(createUploadBox(data.uploads[i],i));
    }
});
function viewAllUploads(){
    $('#tableSessions').innerHTML = '';
    filterData = false;
    let uploads = tempDataBase.uploads;
    let year = $('#in-year').value;
    createChart(uploads,year);
    for(let i=0;i<uploads.length;i++){
        $('#tableSessions').append(createUploadBox(uploads[i],i));
    }
}
function organizeUploads(uploads){
    let orderArr = uploads;
    for(let index in uploads){
        for(let i=0;i<orderArr.length-1;i++){
            if(orderArr[i].earnings < orderArr[i+1].earnings){
            let tmp = orderArr[i];
            orderArr[i] = orderArr[i+1];
            orderArr[i+1] = tmp;
            }
        }
    }
    orderArr = (orderArr.length>5)?orderArr.slice(0,5):orderArr;
    return orderArr;
}
function filterUploads(){
    $('#tableSessions').innerHTML = '';
    filterData = true;
    let uploads = tempDataBase.uploads;
    let mount = $('#in-mount').value;
    let year = $('#in-year').value;
    createChart(uploads,year);
    for(let i=0;i<uploads.length;i++){
        let y = uploads[i].date.split('-',3)[0];
        let m = uploads[i].date.split('-',3)[1];
        if(y == year && m == mount){
            $('#tableSessions').append(createUploadBox(uploads[i],i));
        }
    }
}
function exportDataBase(){
    const options = {
        name:'database.json',
        filters:[{ name: 'JSON', extensions: ['json'] }]
    }
    const savePath = dialog.showSaveDialog(null,options);
    if(savePath) ipcRenderer.send('export',savePath);
}
function importDataBase(){
    const options = {
        name:'database.json',
        filters:[{ name: 'JSON', extensions: ['json'] }]
    }
    const savePath = dialog.showOpenDialog(null,options);
    if(savePath) ipcRenderer.send('import',savePath[0]);
}
function viewRegister(){
    ipcRenderer.send('viewRegister',{});
}
function ExportCSV(){
    const options = {
        name:'my uploads.csv',
        filters:[{ name: 'CSV', extensions: ['csv'] }]
    }
    const savePath = dialog.showSaveDialog(null,options);
    if(savePath){
        let uploads = tempDataBase.uploads;
        let mount = $('#in-mount').value;
        let year = $('#in-year').value;
        let tmpUploads = [];
        for(let i=0;i<uploads.length;i++){
            let y = uploads[i].date.split('-',3)[0];
            let m = uploads[i].date.split('-',3)[1];
            if(filterData){
                if(y == year && m == mount){
                    tmpUploads.push(uploads[i]);
                }
            }
            else{
                if(y == year){
                    tmpUploads.push(uploads[i]);
                }
            }
        }
        const data = {
            file:savePath,
            registers:tmpUploads
        }
        ipcRenderer.send('exportCSV',data);
        dialogs.alert('Exported!', ok => {});
    }
}
function viewMoneyChart(){
    let uploads = organizeUploads(tempDataBase.uploads);
    createEarningsChart(uploads);
}

//extras
async function checkUpdates(){
    loading.show();
    const request = await fetch("http://stockero.magdielstorage.com/version.json");
    const version = await request.json();
    loading.hide();
    if(appSettings.version === version.version){
        Swal.fire(
            'Actualizaciones',
            'Tienes la ultima versión',
            'success'
        );
    }
    else{
        Swal.fire(
            'Nueva versión disponible: '+version.version,
            'Cambios: '+version.info,
            'info'
        );
    }
}
function changeWorkspace(){
    if(appSettings.copy){
        appSettings.copy = false;
        appSettings.workspace = '';
        $('#btn-iworkspace').classList.remove('iactive');
        ipcRenderer.send('setSettings',appSettings);
    }
    else{
        dialog.showOpenDialog({properties: ['openDirectory']},folder=>{
            appSettings.copy = true;
            $('#btn-iworkspace').className += ' iactive';
            appSettings.workspace = folder[0];
            ipcRenderer.send('setSettings',appSettings);
        });
    }
}
function initTheme(){
    if(!appSettings.dark){
        $('#btn-changeTheme').classList.remove('iactive');
        const pages = $('.page');
        for(let i=0;i<pages.length;i++){
            pages[i].style.backgroundColor = '#fff';
        }
        const texts = $('p');
        for(let i=0;i<texts.length;i++){
            texts[i].style.color = '#282C34';
        }
        const labels = $('label');
        for(let i=0;i<labels.length;i++){
            labels[i].style.color = '#282C34';
        }
        const mainPanels = $('.mainPanel');
        for(let i=0;i<mainPanels.length;i++){
            mainPanels[i].style.backgroundColor = '#f0f0f0';
        }
        $('footer')[0].style.backgroundColor = '#f0f0f0';
        $('footer')[1].style.backgroundColor = '#f0f0f0';
        const buttons = $('button');
        for(let i=0;i<buttons.length;i++){
            buttons[i].style.backgroundColor = '#f0f0f0';
            buttons[i].style.color = '#21252B';
            buttons[i].style.borderColor = '#f0f0f0';
        }
        $('#agencyList').style.backgroundColor = '#f0f0f0';
        $('nav')[0].style.backgroundColor = '#f0f0f0';
        $('#frame').style.backgroundColor = '#f0f0f0';
        $('#frame').style.color = '#282C34';
        $('body')[0].style.backgroundColor = '#fff';
        $('#app').style.backgroundColor = '#fff';
        const bclear = $('.bclear');
        for(let i=0;i<bclear.length;i++){
            bclear[i].style.backgroundColor = '#f0f0f0';
            bclear[i].style.color = 'var(--main-secundary-color)';
        }
        $('.scrolling')[0].style.backgroundColor = '#fff';
    }
}
function changeTheme(){
    if(appSettings.dark){
        appSettings.dark = false;
        $('#btn-changeTheme').classList.remove('iactive');
        ipcRenderer.send('setSettings',appSettings);
        messageBox('Reiniciar programa para aplicar cambios','info');
    }
    else{
        appSettings.dark = true;
        $('#btn-changeTheme').className += ' iactive';
        ipcRenderer.send('setSettings',appSettings);
        messageBox('Reiniciar programa para aplicar cambios','info');
    }
}
function randomTips(){
    const tips = ['visita el <b>podcast</b> de fotografia stock','el atajo de teclado ctrl+t te ayudara a traducir descripciones','si usas tu telefono para tomar fotos, investiga app para sacar fotos en RAW','Busca nichos!','Inspirate de los fotógrafos top','No necesitas la mejor camara, pero quiza si un flash decente','filtros ND y polarizador siempre en la mochila 😉','Invita al desarrolador de este programa a un cafe','Los familiares y amigos no siempre son la mejor opcion para modelos','Busca modelos en instagram','Es bueno estar atento a las tendencias','Sesiones de salud y tecnología funcionan bien','Invierte en lo que te gusta','siempre es mejor un MR en papel y en ingles','En lifestyle trata de capturar momentos no muy ensayados','El etiquetado es de lo mas importante','Quedate con las agencias que mas funcionan','Sal a tomar fotos!','Planea con tiempo tus sesiones','Envianos tu feedback'];
    const n = Math.floor(Math.random() * tips.length);
    Swal.fire(
        'Tips!',
        tips[n],
        'info'
      )
}
ipcRenderer.on('endOnlineBackup',(e,data)=>{
    loading.hide();
      Swal.mixin({
        input: 'text',
        confirmButtonText: 'Aceptar',
        showCancelButton: false,
        inputValue:data.code
      }).queue([
        {
          title: 'Código de restauración',
          text: 'Guarda este código para poder importar la copia de seguridad'
        }
      ]).then((result) => {
      })
});
ipcRenderer.on('endOnlineReadBackup',(e,data)=>{
    loading.hide();
    messageBox('Copia de seguridad importada con exito!','success');
});
ipcRenderer.on('fail_backup',(e,data)=>{
    loading.hide();
    messageBox('Algo salió mal, intenta de nuevo','error');
});
async function generateBackup(){
    const { value: type } = await Swal.fire({
        title: 'Tipo de copia de seguridad',
        input: 'select',
        inputOptions: {
          local: 'Local',
          online: 'En linea'
        },
        inputPlaceholder: 'Selecciona un tipo de copia de seguridad',
        showCancelButton: true,
        cancelButtonText: 'Cancelar'
    });   
      if (type) {
        if(type == 'local'){
            const { value: action } = await Swal.fire({
                title: '¿Qué desea hacer?',
                input: 'select',
                inputOptions: {
                  Importar: 'Importar',
                  Exportar: 'Exportar'
                },
                inputPlaceholder: 'Selecciona una opción',
                showCancelButton: true,
                cancelButtonText: 'Cancelar'
            });
            if(action){
                if(action == 'Importar'){
                    importDataBase();
                }
                else{
                    exportDataBase();
                }
            }
        }
        else{
            const { value: action } = await Swal.fire({
                title: '¿Qué desea hacer?',
                input: 'select',
                inputOptions: {
                  Importar: 'Importar',
                  Exportar: 'Exportar'
                },
                inputPlaceholder: 'Selecciona una opción',
                showCancelButton: true,
                cancelButtonText: 'Cancelar'
            });
            if(action){
                if(action == 'Importar'){
                    Swal.mixin({
                        input: 'text',
                        confirmButtonText: 'Aceptar',
                        showCancelButton: true,
                        cancelButtonText:'Cancelar'
                      }).queue([
                        {
                          title: 'Código de restauración',
                          text: 'Ingresa el código para poder importar la copia de seguridad'
                        }
                      ]).then((result) => {
                          if(result.value[0].length>10){
                              loading.show();
                            ipcRenderer.send('getOnlineBackup',{folder:result.value[0]});
                          }
                      })
                }
                else{
                    loading.show();
                    const response = await fetch('http://stockero.magdielstorage.com/export.php');
                    const code = await response.text();
                    ipcRenderer.send('saveOnlineBackup',{folder:code});
                }
            }
        }
      }
}