

export default class StringUtil{

  static validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };
  static getClearEmail =(email)=>{
    if(email && email.length>0){
      return email.trim().toLowerCase();
    }
    return email;
  }
  static validateUrl(url){
      const regex = /^(?:(?:(?:[a-zA-z\-]+)\:\/{1,3})?(?:[a-zA-Z0-9])(?:[a-zA-Z0-9\-\.]){1,61}(?:\.[a-zA-Z]{2,})+|\[(?:(?:(?:[a-fA-F0-9]){1,4})(?::(?:[a-fA-F0-9]){1,4}){7}|::1|::)\]|(?:(?:[0-9]{1,3})(?:\.[0-9]{1,3}){3}))?$/
      if(regex.test(url))return true;
      return false;
  }
  static getShortName(fullname){
    let tokns  = fullname.split(" ")
    let output = ""
    if(tokns[0])output=output+tokns[0][0].toUpperCase();
    if(tokns[1])output=output+tokns[1][0].toUpperCase();
    return output;
  }
  static getByteVal(val) {
      var byteValLen = 0;
      for (var i = 0; i < val.length; i++) {
          if (val[i].match(/[^\x00-\xff]/ig) != null)
              byteValLen += 2;
          else
              byteValLen += 1;
      }
      return byteValLen;
  }
  static getFixedLenName(val,max) {
      var byteValLen = 0;
      for (var i = 0; i < val.length; i++) {
          if (val[i].match(/[^\x00-\xff]/ig) != null)
              byteValLen += 2;
          else
              byteValLen += 1;
          console.log("Current Len ="+byteValLen)
        　if(byteValLen>max){
            return val.substring(0,i)+"..."
          }
      }
      return val;
  }
  static getFixedData(val,num) {
      if(val != undefined){
        return value.toFixed(num);
      }
      else{
        return "-"
      }
  }
}
