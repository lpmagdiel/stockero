const {app, BrowserWindow, ipcMain, shell} = require('electron');
//const ftp = require("basic-ftp");
const { exec } = require("child_process");
//const jsftp = require("jsftp");
const path = require('path');
const exiftool = require('node-exiftool');
const exifProcess = new exiftool.ExiftoolProcess();
const imageThumbnail = require('image-thumbnail');
const converter = require('json-2-csv');
const open = require("open");
const fs = require('fs');
//const cloudinary = require('cloudinary').v2;
const request = require("request");
const translate = require('@vitalets/google-translate-api');
var appSettings = {};
/* cloudinary.config({
  cloud_name: 'lpzmagdiel',
  api_key: '697158815497467',
  api_secret: 'z3Zr4B1yLepUqDOKVPDEDCrcrkM'
}); */
app.allowRendererProcessReuse = true;
var addAgencies;
var listToUpload;
var removeAgencies;
var payout;
var uploadsRegisters;
  function bin2String(array) {
    var result = "";
    for (var i = 0; i < array.length; i++) {
      result += String.fromCharCode(parseInt(array[i], 2));
    }
    return result;
  }
  function structureImageSource(src){
    const srcSplit = src.split('\\',500);
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
  function winPlek(str){
    let out = '';
    Array.from(str).map(t=>{
      out += (t == '/')?'\\':t;
    });
    return out;
  }
  function saveNewPicture(data){
    let partImage = structureImageSource(winPlek(data.image));
      partImage.src = winPlek(partImage.src);
      const oldName = partImage.src+partImage.name+partImage.type;
      const metadata = {
        all:'',
        Title: data.title,
        Description: data.description,
        DateTimeOriginal:data.DateTimeOriginal,
        Keywords: data.keywords.split(',',200)
      }
      exifProcess.open()
      // use codedcharacterset
      .then(() => exifProcess.writeMetadata(oldName, metadata, ['codedcharacterset=utf8']))
      .then(() => {
        exifProcess.close();
        fs.unlink(oldName+'_original', function (err) {
          if (err) throw err;
          console.log('File deleted!');
        });
      })
      .catch(console.error);
  }
  function createWindow () {
    // Crea la ventana del navegador.
    var win = new BrowserWindow({
      width: 1280,
      height: 720,
      frame:false,
      backgroundColor: '#f0f0f0',
      show: false
    });
    win.maximize();
    //win.webContents.openDevTools();
    async function getFTP(ftpHost,ftpUser,ftpPass,ftpPort) {
      exec(`simpleFTP.exe get ${ftpHost} ${ftpUser} ${ftpPass}`, (error, stdout, stderr) => {
        const folderText = stdout.replace(/\r/g,"");
        const folders = folderText.split('\n',500);
        addAgencies.webContents.send('end_list',folders);
      });
    }
    // y carga el archivo index.html de la aplicación.
    win.loadFile(path.join(__dirname, 'app/index.html'));
    win.setMenu(null);
    win.on('ready-to-show', function () { 
        win.show();
        let DB = JSON.parse(fs.readFileSync('store.json', 'utf8'));
        win.webContents.send('initDataFTP',DB.agencies);
    });
    ipcMain.on('close-app',(e,data)=>{
      win.close();
    });
    ipcMain.on('minimize-app',(e,data)=>{
      win.minimize();
    });
    ipcMain.on('openPaypal',(e,data)=>{
      open(data.url);
    });
    ipcMain.on('listFTP',(e,data)=>{
      getFTP(data.server,data.user,data.pass,data.port);
    });
    ipcMain.on('openBlockRename',(e,data)=>{
      const files = data.files;
      const filesCount = files.length;
      if(filesCount>0){
        for (let i = 0; i < filesCount; i++) {
          let partsOfPicture = structureImageSource(files[i]);
          fs.rename(files[i], partsOfPicture.src+data.name+(i+1)+partsOfPicture.type, (err) => {
            if (err) throw err;
          });
        }
        win.webContents.send('renameEnd', filesCount);
      }
    });
    ipcMain.on('saveUpload',(e,data)=>{
      let DB = JSON.parse(fs.readFileSync('store.json', 'utf8'));
      DB.uploads.push(data);
      fs.writeFile('store.json', JSON.stringify(DB), function (err) { 
        if (err)
          console.log(err);
        });
        if(appSettings.copy){
          let d = new Date();
          const montsNames = (appSettings.lang == 'ES')?['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']:['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
          const year = d.getFullYear();
          let sessionPath = appSettings.workspace+'\\'+year+'\\'+montsNames[d.getMonth()];
          if (!fs.existsSync(appSettings.workspace+'\\'+year)){
              fs.mkdirSync(appSettings.workspace+'\\'+year);
          }
          if (!fs.existsSync(sessionPath)){
              fs.mkdirSync(sessionPath);
          }
          sessionPath += '\\'+data.name;
          if (!fs.existsSync(sessionPath)){
            fs.mkdirSync(sessionPath);
          }
        }
    });
    ipcMain.on('updateUploads',(e,data)=>{
      fs.writeFile('store.json', JSON.stringify(data), function (err) { 
        if (err) console.log(err);
        });
    });
    ipcMain.on('getUploads',(e,data)=>{
      let DB = JSON.parse(fs.readFileSync('store.json', 'utf8'));
      win.webContents.send('render_uploads',DB);
    });
    ipcMain.on('addListUploads',(e,data)=>{
      listToUpload = new BrowserWindow({
        width: 400,
        height: 550,
        minHeight:550,
        minWidth:400,
        backgroundColor: '#282C34',
        show: false,
        resizable:false,
        parent:win
      });
      listToUpload.loadFile(path.join(__dirname, 'app/listToSubmit.html'));
      listToUpload.setMenu(null);
      listToUpload.on('ready-to-show', e=>{
        listToUpload.show();
        let DB = JSON.parse(fs.readFileSync('store.json', 'utf8'));
        listToUpload.webContents.send('select_agencies',DB.agencies);
      });
    });
    ipcMain.on('viewAddAgency',(e,data)=>{
      addAgencies = new BrowserWindow({
        width: 400,
        height: 550,
        minHeight:550,
        minWidth:400,
        backgroundColor: '#282C34',
        show: false,
        resizable:false,
        parent:win
      });
      //addAgencies.webContents.openDevTools();
      addAgencies.loadFile(path.join(__dirname, 'app/addAgency.html'));
      addAgencies.setMenu(null);
      addAgencies.on('ready-to-show', e=>{
        addAgencies.show(); 
      });
      ipcMain.on('saveNewAgency',(e,data)=>{
        console.log('saved');
        try {
          let DB = JSON.parse(fs.readFileSync('store.json', 'utf8'));
          data.id = DB.agencies.length+1;
          DB.agencies.push(data);
          fs.writeFile('store.json', JSON.stringify(DB), function (err) { 
            if (err)
              console.log(err);
            });
            console.log('saved');
        
        } catch (error) {
          
        }
      });
    });
    ipcMain.on('viewDeleteAgency',(e,data)=>{
      removeAgencies = new BrowserWindow({
        width: 400,
        height: 200,
        minHeight:200,
        minWidth:400,
        backgroundColor: '#282C34',
        show: false,
        resizable:false,
        parent:win
      });
      removeAgencies.loadFile(path.join(__dirname, 'app/deleteAgency.html'));
      removeAgencies.setMenu(null);
      removeAgencies.on('ready-to-show', e=>{
        removeAgencies.show();
        let DB = JSON.parse(fs.readFileSync('store.json', 'utf8'));
        removeAgencies.webContents.send('select_agencies',DB.agencies);
      });
    });
    ipcMain.on('agenciesToDalete',(e,data)=>{
      let DB = JSON.parse(fs.readFileSync('store.json', 'utf8'));
      for(let i=0;i<DB.agencies.length;i++){
        if(DB.agencies[i].id == data.id){
          DB.agencies.splice(i,1);
        }
      }
      fs.writeFile('store.json', JSON.stringify(DB), function (err) { 
        if (err)
          console.log(err);
        });
    });
    ipcMain.on('openImageData',(e,imageInfo)=>{
      try {
        const dates = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
          const url = imageInfo.rawSRC;
          exifProcess.open()
          .then(() => exifProcess.readMetadata(url, ['-File:all']))
          .then(async (exifData) => {
            //console.log(exifData);
            if(exifData.data[0].DateTimeOriginal){
              imageInfo.DateTimeOriginal = exifData.data[0].DateTimeOriginal;
              imageInfo.editorial = exifData.data[0].DateTimeOriginal.split(' ',3)[0].split(':',3);
              imageInfo.editorial = ` - ${dates[parseInt(imageInfo.editorial[1])]} ${imageInfo.editorial[2]}, ${imageInfo.editorial[0]}: `;
            }
            else{
              imageInfo.editorial = ' - Mes Dia, Año: ';
            }
            imageInfo.title = (exifData.data[0].Title)?exifData.data[0].Title:'';
            imageInfo.tags = (exifData.data[0].Keywords)?exifData.data[0].Keywords.toString():'';
            imageInfo.description = (exifData.data[0].Description)?exifData.data[0].Description:'';
            let thumbnailOptions = { jpegOptions: {force:true, quality:50},responseType:'base64', responseType: 'base64' };
            imageInfo.thumbnail = await imageThumbnail(imageInfo.src, thumbnailOptions);
            exifProcess.close();
            win.webContents.send('render_image',imageInfo);
          })
          .catch(err => console.log(err));
      } catch (error) {
        console.log('exifTool error');
      }
          
          
    });
    ipcMain.on('savePicure',(e,data)=>{
      saveNewPicture(data);
    });
    ipcMain.on('openImstocker',(e,data)=>{
      let imstockerWindow = new BrowserWindow({
        width: 900,
        height: 600,
        minHeight:600,
        minWidth:900,
        backgroundColor: '#f0f0f0',
        show: false,
        parent:win
      });
      imstockerWindow.loadURL(data.url);
      imstockerWindow.setMenu(null);
      imstockerWindow.on('ready-to-show', e=>{
        win.webContents.send('end_imstoker');
        imstockerWindow.show(); 
      });
    });
    ipcMain.on('saveSelected',(e,data)=>{
      const images = data.images;
      const imagesCount = images.length;
      for(let i=0;i<imagesCount;i++){
        saveNewPicture(images[i]);
      }
      console.log('saved');
    });
    ipcMain.on('uploadImage',(e,data)=>{
      cloudinary.uploader.upload(data.image,  {width: 500, crop: "scale"},(error, result)=>{
        try {
          let output = {
            webUrl:result.url,
            position:data.position
          }
          win.webContents.send('end_upload',output);
        } catch (error) {
          
        }
      });
    });
    ipcMain.on('uploadPhoto',async (e,data)=>{
      try{
        const ftpHost = data.agency.server;
        const ftpUser = data.agency.user;
        const ftpPass = data.agency.password;
        const ftpFolder = (data.agency.folder === 'ROOT')?'/':data.agency.folder+'/';
        const image = data.photo.image;
        const secuence = `simpleFTP.exe upload ${ftpHost} ${ftpUser} ${ftpPass} ${ftpFolder} "${image}"`;
        exec(secuence, (error, stdout, stderr) => {
          if(error){
            win.webContents.send('end_uploadPhoto',{status:false});
            return;
          }
          win.webContents.send('end_uploadPhoto',{status:true});
          if(appSettings.copy){
            let d = new Date();
            const montsNames = (appSettings.lang == 'ES')?['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']:['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            const year = d.getFullYear();
            const sessionPath = appSettings.workspace+'\\'+year+'\\'+montsNames[d.getMonth()]+'\\'+data.session;
            fs.copyFile(data.photo.image, sessionPath+'\\'+data.photo.oldName, (err) => {
              if (err) throw err;
            });
          }
        });
      }
      catch(err){
        console.log(err);
        win.webContents.send('end_uploadPhoto',{status:false});
      }
    });
    function analizeImage(urlImage,position){
      const options = {
        method: 'POST',
        url: 'https://microsoft-azure-microsoft-computer-vision-v1.p.rapidapi.com/analyze',
        qs: {visualfeatures: 'Description'},
        headers: {
          'x-rapidapi-host': 'microsoft-azure-microsoft-computer-vision-v1.p.rapidapi.com',
          'x-rapidapi-key': 'f56e06d88dmsh497fa76ec9a5cdep127189jsn1e0ae43df03f',
          'content-type': 'application/json',
          accept: 'application/json'
        },
        body: {
          url: urlImage
        },
        json: true
      };
      request(options, function (error, response, body) {
        if (error) throw new Error(error);
        try {
          const output = {
            description:body.description.captions[0].text,
            tags:body.description.tags,
            position:position
          }
          win.webContents.send('end_analize',output);
        } catch (error) {
          
        }
      });
    }
    ipcMain.on('analizeImage',(e,data)=>{
      try {
        analizeImage(data.webUrl, data.position);
      } catch (error) {
        
      }
    });
    ipcMain.on('initAI',(e,data)=>{
      let counter = JSON.parse(fs.readFileSync('settings.json', 'utf8'));
      win.webContents.send('end_initAI',counter.AI);
    });
    ipcMain.on('counterAI',(e,data)=>{
      let counter = JSON.parse(fs.readFileSync('settings.json', 'utf8'));
      counter.AI = data.count;
      fs.writeFile('settings.json', JSON.stringify(counter), function (err) { 
        if (err)
          console.log(err);
      });
    });
    ipcMain.on('getSettings',(e,data)=>{
      let settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'));
      appSettings = settings;
      win.webContents.send('settings',settings);
    });
    ipcMain.on('setSettings',(e,data)=>{
      appSettings = data;
      fs.writeFile('settings.json', JSON.stringify(data), function (err) { 
        if (err)
          console.log(err);
      });
    });
    ipcMain.on('agenciesToSubmit',(e,data)=>{
      win.webContents.send('listedFTP',data);
      listToUpload.close();
    });
    ipcMain.on('viewRegister',(e,data)=>{
      uploadsRegisters = new BrowserWindow({
        width: 400,
        height: 430,
        minHeight:430,
        minWidth:400,
        backgroundColor: '#282C34',
        show: false,
        resizable:false,
        parent:win
      });
      //addAgencies.webContents.openDevTools();
      uploadsRegisters.loadFile(path.join(__dirname, 'app/register.html'));
      uploadsRegisters.setMenu(null);
      uploadsRegisters.on('ready-to-show', e=>{
        uploadsRegisters.show(); 
      });
    });
    ipcMain.on('export',(e,savePath)=>{
      let DB = JSON.parse(fs.readFileSync('store.json', 'utf8'));
      let DB2 = {
        uploads:DB.uploads
      }
      fs.writeFile(savePath, JSON.stringify(DB2), function (err) { 
        if (err)
          console.log(err);
      });
    });
    ipcMain.on('exportCSV',(e,data)=>{
      let options = {
        delimiter : {
            field : ';'
        },
        expandArrayObjects:true
    };
      converter.json2csv(data.registers, (err,csv)=>{
        let text = csv.replace(/\[/g,'');
        text = text.replace(/\]/g,'');
        text = text.replace(/\"/g,'');
        fs.writeFile(data.file, text, function (err) { 
          if (err)
            console.log(err);
        });
      },options);
    });
    ipcMain.on('import',(e,openPath)=>{
      let DB = JSON.parse(fs.readFileSync('store.json', 'utf8'));
      let DB2 = JSON.parse(fs.readFileSync(openPath, 'utf8'));
      DB.uploads = DB2.uploads;
      fs.writeFile('store.json', JSON.stringify(DB), function (err) { 
        if (err)
          console.log(err);
      });
    });
    ipcMain.on('saveOnlineBackup',async (e,data)=>{
      const client = new ftp.Client();
      client.ftp.verbose = true;
      try {
          await client.access({
              host: 'ftp.magdielstorage.com',
              user: 'stockero@magdielstorage.com',
              password: 'stoker1234+desktop'
          });
          await client.ensureDir('stocker'+data.folder);
          await client.uploadFrom(path.join(__dirname, 'store.json'), 'store.json');
          win.webContents.send('endOnlineBackup',{status:true,code:data.folder});
      }
      catch(err) {
          console.log(err);
          win.webContents.send('fail_backup',{status:false});
      }
      client.close();
    });
    ipcMain.on('getOnlineBackup',async (e,data)=>{
      const client = new ftp.Client();
      client.ftp.verbose = true;
      try {
          await client.access({
              host: 'ftp.magdielstorage.com',
              user: 'stockero@magdielstorage.com',
              password: 'stoker1234+desktop'
          });
          await client.ensureDir('stocker'+data.folder);
          await client.downloadTo(path.join(__dirname, 'store.json'), 'store.json');
          win.webContents.send('endOnlineReadBackup',{status:true});
      }
      catch(err) {
          console.log(err);
          win.webContents.send('fail_backup',{status:false});
      }
      client.close();
    });
    ipcMain.on('start_pay',(e,data)=>{
      payout = new BrowserWindow({
        width: 400,
        height: 500,
        minHeight:500,
        minWidth:400,
        backgroundColor: '#282C34',
        show: false,
        parent:win
      });
      payout.loadFile(path.join(__dirname, 'app/payout.html'));
      payout.setMenu(null);
      payout.on('ready-to-show', e=>{
        payout.show();
      });
      payout.on('page-title-updated', (e,title)=>{
        if(title == 'Thanks'){
          win.webContents.send('end_pay',{count:1500});
          let counter = JSON.parse(fs.readFileSync('settings.json', 'utf8'));
          counter.AI += 1500;
          fs.writeFile('settings.json', JSON.stringify(counter), function (err) { 
            if (err)
              console.log(err);
          });
          payout.close();
        }
      });
    });
    ipcMain.on('start_translation',(e,data)=>{
      translate(data.text, {to: 'en'}).then(res => {
        win.webContents.send('end_translation',{text:res.text,id:data.id});
      }).catch(err => {
          console.error(err);
      });
    });
    ipcMain.on('openFolder',(e,data)=>{
      shell.openItem(data.folder);
    });
    ipcMain.on('manualCopy',(e,data)=>{
      if(appSettings.copy){
        const montsNames = (appSettings.lang == 'ES')?['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']:['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const year = data.date.split('-',3)[0];
        const mont = parseInt(data.date.split('-',3)[1])-1;
        let sessionPath = appSettings.workspace+'\\'+year+'\\'+montsNames[mont];
        if (!fs.existsSync(appSettings.workspace+'\\'+year)){
            fs.mkdirSync(appSettings.workspace+'\\'+year);
        }
        if (!fs.existsSync(sessionPath)){
            fs.mkdirSync(sessionPath);
        }
        sessionPath += '\\'+data.name;
        if (!fs.existsSync(sessionPath)){
          fs.mkdirSync(sessionPath);
        }
        for(let i=0;i<data.files.length;i++){
          fs.copyFile(data.files[i].rawSRC, sessionPath+'\\'+data.files[i].imageName, (err) => {
            if (err) throw err;
          });
        }
      }
    });
    ipcMain.on('updateEarnings',(e,data)=>{
      let DB = JSON.parse(fs.readFileSync('store.json', 'utf8'));
      DB.uploads[data.indexSession].earnings = data.earnings;
      fs.writeFile('store.json', JSON.stringify(DB), function (err) { 
        if (err) console.log(err);
      });
    });
  }

  app.on('ready', createWindow);