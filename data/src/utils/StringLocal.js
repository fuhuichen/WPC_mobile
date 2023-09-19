import LocalizedStrings from 'react-native-localization';


let strings = new LocalizedStrings({
  "zh-TW":{
  }
 });
var lang= 'zh-CN'
exports.setLanguage =　function(l){
   //console.log('Lang Set Languate',l)
   strings.setLanguage(l);
   lang = l;
}
exports.getLanguage =　function(){
 // console.log('Lang ',lang)
  //var lan = lang;
  return lang;
}

exports.getString =　function(str){
  if(this.getLanguage() =='zh-TW' ){
    return str;
  }
  else{
    strings.setLanguage(lang)
    var out  = strings[str];
    if(out == null || out =='')
       return str;
    return out;
  }
}
