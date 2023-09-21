import RNFetchBlob from 'rn-fetch-blob'
import { DeviceEventEmitter} from 'react-native';
let ERROR_COUNT  = 0;
export default class HttpUtil{
    static async postAsync(httpUrl,data){
        if(!data)data={}
        httpUrl= httpUrl.trim();
      //  console.log("URL="+httpUrl)
        return await new Promise((resolve,reject) => {
            let timer = setTimeout(function() {
                console.log("On Timer")
                resolve({status:1});
            }, 15000);
            RNFetchBlob.config({
          timeout:20000,
          trusty : true
          }).fetch('POST', httpUrl, {
            'Accept': 'application/json',
            'Content-Type' : 'application/json',
          },JSON.stringify(data))
                .then(response =>{
                    //console.log(response.text())
                    ERROR_COUNT= 0;
                    let json = response.json();
                    return json;
                 })
                .then(result => {
                    clearTimeout(timer);
                    if(result.error_code === "403"){

                    }
                    resolve(result);
                })
                .catch(error =>{
              //      console.log("Error="+error)
                    ERROR_COUNT++;
                    clearTimeout(timer);
                    if(ERROR_COUNT>2){
                      DeviceEventEmitter.emit("NETWORK_FAIL",{})
                    }

                    resolve({status:9999});
                })
        })
    }
    static async testget(url, timeout = 3){
        let httpUrl =url
        console.log("TESTGET="+httpUrl)
        return await new Promise((resolve,reject) => {
            let timer = setTimeout(function() {
                resolve({status:0});
            }, timeout*1000);
            RNFetchBlob.config({
          timeout:20000,
          trusty : true
        }).fetch('GET',httpUrl)
                .then(response =>response.text())
                .then(result => {
                    console.log("GETRESULT")
                  //  console.log(JSON.parse(JSON.stringify(result)))
                    resolve(JSON.parse(result));
                })
                .catch(error => {
                    clearTimeout(timer);
                    console.log(error)
                    resolve({status:0});
                })
        })
    }
}
