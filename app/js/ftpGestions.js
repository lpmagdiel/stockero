function getDataFTP(text){
    const stockAgencies = [{name:"shutter",server:"ftp.shutterstock.com"},{name:"adobe",server:"ftp.contributor.adobestock.com"},{name:"dreamstime",server:"upload.dreamstime.com"},{name:"alamy",server:"upload.alamy.com"},{name:"deposit",server:"ftp.depositphotos.com"},{name:"123rf",server:"ftp.123rf.com"},{name:"freepik",server:"contributor-ftp.freepik.com"},{name:"big",server:"ftp.bigstockphoto.com"},{name:"pond",server:"ftp.pond5.com"}];
    let out = {
        status:false,
        data:{}
    }
    for(let i in stockAgencies){
        if(stockAgencies[i].name.indexOf(text.toLowerCase()) > -1){
            out.status = true;
            out.data = stockAgencies[i];
            break;
        }
    }
    return out;
}