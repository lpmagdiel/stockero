window.addEventListener("resize", windowResize);
window.addEventListener("load",init);

// window
$('#btn-closeWindow').addEventListener('click',e=>{
    closeApp();
});
$('#btn-minimizeWindow').addEventListener('click',e=>{
    minimizeApp();
});

// nav events
$('#btn-uploads').addEventListener('click',e=>{
    initUploads();
    toFront('#btn-uploads','#uploads');
});
$('#btn-ftp').addEventListener('click',e=>{
    toFront('#btn-ftp','#ftp');
});
$('#btn-keywording').addEventListener('click',e=>{
    toFront('#btn-keywording','#keywording');
});
$('#btn-main').addEventListener('click',e=>{
    toFront('#btn-main','#main');
});
$('#btn-extras').addEventListener('click',e=>{
    toFront('#btn-extras','#extras');
});

// view home events
$('#btn-donation').addEventListener('click',openDonation);
$('#creatorMedia').addEventListener('click',openCreator);
$('#btn-mrApp').addEventListener('click',openPlaystore);
//$('#btn-openFolder').addEventListener('click',openDirectory);
$('#btn-blockRename').addEventListener('click',blockRename);
// view keywording events
$('#btn-openFolder2').addEventListener('click',openDirectory);
$('#imagesContainer').addEventListener('drag',filesDrop);
$('#imagesContainer').addEventListener('drop',filesDrop);
$('#btn-selectAllFiles').addEventListener('click',selectAllFiles);
$('#btn-imstocker').addEventListener('click',openImstocker);
$('#btn-saveSelected').addEventListener('click',saveSelected);
$('#btn-uploadSelected').addEventListener('click',uploadSelected);
$('#btn-aiKeywording').addEventListener('click',uploadToServer);
$('#btn-deepl').addEventListener('click',deepl);
$('#btn-aiKeywording').style.display = 'none';
//$('#btn-aiCounter').addEventListener('click',btnCounter);
//$('#btn-aiCounter').style.display = 'none';
// view FTP events
$('#btn-uploadFTP').addEventListener('click',startFTP);
$('#btn-addAgency').addEventListener('click',addAgency);
$('#btn-uploadList').addEventListener('click',uploadList);
$('#btn-deleteAgency').addEventListener('click',deleteAgency);
$('#btn-uploadVideo').addEventListener('click',selectVideos);
// view uploads events
$('#btn-filterUploads').addEventListener('click',filterUploads);
$('#btn-viewAllUploads').addEventListener('click',viewAllUploads);
$('#btn-viewRegister').addEventListener('click',viewRegister);
$('#btn-viewMoney').addEventListener('click',viewMoneyChart);
$('#btn-csv').addEventListener('click',ExportCSV);
// view extras
$('#btn-update').addEventListener('click',checkUpdates);
$('#btn-iworkspace').addEventListener('click',changeWorkspace);
$('#btn-changeTheme').addEventListener('click',changeTheme);
$('#btn-tips').addEventListener('click',generateBackup);