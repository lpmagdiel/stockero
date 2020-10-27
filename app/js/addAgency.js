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
$('#app').style.height = (window.innerHeight)+'px';
$('#app').style.width = (window.innerWidth)+'px';
const loading = new loadingOverlay('#3767B1');
const { ipcRenderer, remote } = require('electron');

$('#nameFTP').addEventListener('keyup',e=>{
    const result = getDataFTP($('#nameFTP').value);
    if(result.status){
        $('#serverFTP').value = result.data.server;
    }
});

$('#btn-conection').addEventListener('click',e=>{
    let ftp ={
        name:$('#nameFTP').value,
        server:$('#serverFTP').value,
        port:$('#portFTP').value,
        user:$('#userFTP').value,
        pass:$('#passFTP').value
    }
    loading.show();
    ipcRenderer.send('listFTP',ftp);
});
ipcRenderer.on('end_list',(e,data)=>{
    loading.hide();
    for(let i=0;i<data.length;i++){
        if(data[i].length > 1){
            let option = document.createElement('option');
            option.value = data[i];
            option.innerText = data[i];
            $('#folder').append(option);
        }
    }
});
$('#btn-saveData').addEventListener('click',e=>{
    const agency = {
        name:$('#nameFTP').value,
        server:$('#serverFTP').value,
        port:$('#portFTP').value,
        user:$('#userFTP').value,
        password:$('#passFTP').value,
        folder:$('#folder').value
    }
    ipcRenderer.send('saveNewAgency',agency);
    Swal.fire(
        'Exito!',
        'Agencia Guardada!',
        'success'
      )
});