import moment from 'moment'
import {AsyncStorage} from 'react-native';
import I18n from "react-native-i18n";

exports.getHourRange=function(hour) {
  if(hour) {
    hour = hour.toString();
    var output;
    var arr = hour.split(":");
    var k = parseInt(arr[0]);
    return ''+ k + ':00 - '+ (k+1) + ':00';
  } else {
    return '';
  }
}

exports.getYearTitle=function(d) {
    if(I18n.locale=='en'){
        return moment(d).format('YYYY');
    }
    else{
        return moment(d).format('YYYY年');
    }
}
exports.fixNegtiveData=function(data) {

    //console.log('fixNegtiveData',data)
    var startIndex =-1;
    var endIndex =data.labels.length ;

    for(var k in data.labels){
        var empty = true;
        for(var n in data.datasets){
            if(data.datasets[n].data[k]>=0){
                empty = false;
                break;
            }
        }
        if(data.barDataset){
            if(data.barDataset[k]>=0){
                empty = false;
                break;
            }
        }
        if(data.barDataset2){
            if(data.barDataset2[k]>=0){
                empty = false;
                break;
            }
        }
        if(empty){
            startIndex = parseInt(k);
            //console.log('Change StartIndex',startIndex)
        }
        else{
            break;
        }
    }
    for(k=data.labels.length-1;k>startIndex;k-- ){
        var empty = true;
        for(var n in data.datasets){
            if(data.datasets[n].data[k]>=0){
                empty = false;
                break;
            }
        }
        if(data.barDataset){
            if(data.barDataset[k]>=0){
                empty = false;
                break;
            }
        }
        if(data.barDataset2){
            if(data.barDataset2[k]>=0){
                empty = false;
                break;
            }
        }
        if(empty){
            endIndex = parseInt(k);
            //console.log('Change EndtIndex',endIndex)
        }
        else{
            break;
        }

    }

    //console.log('Start index ', startIndex)
    //console.log('End index ', endIndex)
    if(startIndex < data.labels.length-1  && endIndex-startIndex>1 ){
        data.labels = data.labels.slice(startIndex+ 1,endIndex);
        //console.log(data)
        data.labels2 = data.labels2.slice(startIndex+ 1,endIndex);
        //console.log(data)
        if(data.barDataset){
            data.barDataset = data.barDataset.slice(startIndex+ 1,endIndex);
        }
        if(data.barDataset2){
            data.barDataset2 = data.barDataset2.slice(startIndex+ 1,endIndex);
        }
        for(var n in data.datasets){
            data.datasets[n].data = data.datasets[n].data.slice(startIndex+ 1,endIndex);
        }
    }

    //console.log(data)
    return data;
}

exports.fixNegtiveDataHeatmap=function(data) {
    //console.log('fixNegtiveDataHeatmap',data.labels3)
    var startIndex =-1;
    var endIndex =data.labels3.length ;

    for(var k in data.labels3){
        var empty = true;
        for(var n in data.datasets){
            console.log("data.datasets[n]:",data.datasets[n])
            if(data.datasets[n].data[k]>=0){
                empty = false;
                break;
            }
        }
        if(empty){
            startIndex = parseInt(k);
            //console.log('Change StartIndex',startIndex)
        }
        else{
            break;
        }
    }
    for(k=data.labels3.length-1;k>startIndex;k-- ){
        var empty = true;
        for(var n in data.datasets){
            if(data.datasets[n].data[k]>=0){
                empty = false;
                break;
            }
        }
        if(empty){
            endIndex = parseInt(k);
        }
        else{
            break;
        }

    }
    //console.log('Start index ', startIndex)
    //console.log('End index ', endIndex)
    if(startIndex < data.labels3.length-1  ){
        data.labels3 = data.labels3.slice(startIndex+ 1,endIndex);
        for(var n in data.datasets){
            data.datasets[n].data = data.datasets[n].data.slice(startIndex+ 1,endIndex);
        }
    }

    //console.log(JSON.stringify(data))
    return data;
}

exports.numberFormat =function(n) {
    n =  parseInt(n)
    if(n<0)return '  -  ';
    n += "";
    var arr = n.split(".");
    var re = /(\d{1,3})(?=(\d{3})+$)/g;
    return arr[0].replace(re,"$1,") + (arr.length == 2 ? "."+arr[1] : "");
}

exports.numberFormat_Float =function(n) {
    //n =  parseInt(n)
    n = parseFloat(n).toFixed(2);
    if(n<0)return '  -  ';
    n += "";
    var arr = n.split(".");
    var re = /(\d{1,3})(?=(\d{3})+$)/g;
    return arr[0].replace(re,"$1,") + (arr.length == 2 && arr[1] != 0 ? "."+arr[1] : "");
}

exports.getStoreTarget =function(email,store_id){
  var name = email  + '_' + store_id  + '_target';
  ////console.log('gettarget',name)
  return  AsyncStorage.getItem(name)
}

exports.setStoreTarget =function(email,store_id,target){
  var name = email  + '_' + store_id  + '_target';
  ////console.log('settarget',name)
  return  AsyncStorage.setItem(name,target)
}

exports.getExportName =function(p, range, date){

    var prefix = I18n.t(p);
    if( prefix )
        prefix = prefix.replace(/\//g,'');
    else
        prefix = '';

    var c = new Date()
    var datePrefix = ( Math.round( c.getTime()  / 1000)) + ''
    return "BI-"+datePrefix+ '-' + prefix +  '.jpg'
}

exports.getExportNameSimple =　function(prefix, range, date){
    var d = new Date();
    if(date){
      d = moment(date, 'YYYY/MM/DD').toDate();
    }
    var dateContent =  this.getDateDisplay(date,range).replace(/\//g,'');

    var c = new Date()
    var datePrefix = ( Math.round( c.getTime()  / 1000)) + ''
    return "BI"+datePrefix+ '-' + prefix +  '-' + dateContent+ '.jpg'
}

exports.getWeekDate = function(date,index){
  var dateContent ;
  var d = new Date();
  if(date){
    d = moment(date, 'YYYY/MM/DD').toDate();
  }
  var dif = d.getDay() || 7 ;
  d.setDate(d.getDate() -dif +1 +  parseInt(index));
  dateContent  =moment(d).format('YYYY/MM/DD');
  ////console.log(dateContent)
  return dateContent;
}

exports.createHeatmapRequest = function(token,data_source,range,unit,date,store){

  var req = {
    data_source: JSON.parse(JSON.stringify(data_source)),
    token: token,
    module_id: 0
  };
  req.data_source.data_range  = range;
  req.data_source.data_unit   = unit;
  req.data_source.time_compare = "";

  if(range=='dd'){
    req.data_source.time_compare = "on";
    req.data_source.date = [];
    var wd =( date.getDay()+6)%7;
    date.setDate(date.getDate() -wd);
    for(var n= 0;n<7;n++){
        var tdate  = moment(date).format('YYYY/MM/DD');
        req.data_source.date.push(tdate)
        date.setDate(date.getDate() +1);
    }
  }
  else{
    req.data_source.time_compare = "on";
    req.data_source.date = [];
    date.setDate(1);
    var wd =( date.getDay()+6)%7;
    var cm = date.getMonth()
    date.setDate(date.getDate() -wd);
    for(var n= 0;n<6;n++){

        var tdate  = moment(date).format('YYYY/MM/DD');
        req.data_source.date.push(tdate)
        date.setDate(date.getDate() +7);
        if(cm!=date.getMonth())
          break;
    }
  }
  for(var k in req.data_source.source){
    req.data_source.source[k].sources = [store];
  }
  return req;
}

exports.createSimpleRequest = function(token,data_source,range,unit,date,store,compare,isYesterday){

  var req = {
    data_source: JSON.parse(JSON.stringify(data_source)),
    token: token,
    module_id: 0
  };

  req.data_source.data_range  = range;
  req.data_source.data_unit   = unit;
  req.data_source.time_compare = "";
  if(isYesterday){
    req.data_source.time_compare = "on";
  }
  if(compare){
    req.data_source.time_compare = "on";
    req.data_source.data_unit= range;
    req.data_source.date = [];
    if(range == 'dd' || range == 'ww'){
        date.setDate(date.getDate() -49);
        for(var n= 0;n<8;n++){
            var tdate  = moment(date).format('YYYY/MM/DD');
            req.data_source.date.push(tdate)
            date.setDate(date.getDate() +7);
        }
    }
    else if(range == 'mm'){
      req.data_source.data_unit= 'dd';
      date.setYear(1900+date.getYear() -2);
      for(var n= 0;n<3;n++){
          var tdate  = moment(date).format('YYYY/MM/DD');
          req.data_source.date.push(tdate)
          date.setYear(1900+date.getYear() +1);
      }
    }
    else if(range == 'yyyy'){
      //req.data_source.data_range = 'mm';
      req.data_source.data_unit = 'mm';
      date.setYear(1900+date.getYear() -2);
      for(var n=0 ; n<3 ; n++){
          var tdate = moment(date).format('YYYY/MM/DD');
          req.data_source.date.push(tdate)
          date.setYear(1900+date.getYear() +1);
      }
    }
  } else {
      var tdate  = moment(date).format('YYYY/MM/DD');
      req.data_source.date = [tdate];
  }
  for(var k in req.data_source.source){
    req.data_source.source[k].sources = [store];
  }
  return req;
}

exports.createMultiDateRequest = function(token,data_source,range
    ,unit,sdate,duration,store){
 // console.log('createMultiDateRequest')
  var req = {
    data_source: JSON.parse(JSON.stringify(data_source)),
    token: token,
    module_id: 0
  };

  req.data_source.data_range  = range;
  req.data_source.data_unit   = unit;
  req.data_source.time_compare = "on";
 // var stdate  = moment(sdate).format('YYYY/MM/DD');
  req.data_source.date=[]
 // console.log('duration',duration)
 if(range == 'ww'){
   for(var k=0 ;k<duration;k++){
     //  console.log(moment(sdate).format('YYYY/MM/DD'))
       req.data_source.date.push(moment(sdate).format('YYYY/MM/DD'));
       sdate.setDate(sdate.getDate()+27);
   }
 }
 else{
   for(var k=0 ;k<duration;k++){
     //  console.log(moment(sdate).format('YYYY/MM/DD'))
       req.data_source.date.push(moment(sdate).format('YYYY/MM/DD'));
       sdate.setDate(sdate.getDate()+1);
   }
 }

 // var etdate  = moment(edate).format('YYYY/MM/DD');
  //console.log(req.data_source.date)
  for(var k in req.data_source.source){
    req.data_source.source[k].sources = [store];
  }
  //console.log(req)
  return req;
}

exports.getDateDisplay = function(date, range){
  var dateContent ;
  var d = new Date();
  if(date){
    d = moment(date, 'YYYY/MM/DD').toDate();
  }
  if( range == 'dd'){
      dateContent = moment(d).format('YYYY/MM/DD');
  }
  else if( range == 'ww'){
      var dif = d.getDay() || 7 ;
      d.setDate(d.getDate() -dif +1);
      var startDate =  moment(d).format('MM/DD')
      d.setDate(d.getDate() +6)
      var endDate =  moment(d).format('MM/DD')
      dateContent = startDate + '-' +  endDate ;
  }
  else if( range == 'mm'){
    dateContent = moment(d).format('YYYY/MM');
  }
  else if( range == 'yyyy'){
      dateContent = moment(d).format('YYYY');
  }
  return dateContent;
}

exports.getSimpleDateDisplay = function(date, range){
  var dateContent ;
  var d = new Date();
  if(date){
    d = moment(date, 'YYYY/MM/DD').toDate();
  }
  if( range == 'dd'){
      dateContent = moment(d).format('MM/DD');
  }
  else if( range == 'ww'){
      var dif = d.getDay() || 7 ;
      d.setDate(d.getDate() -dif +1);
      var startDate =  moment(d).format('MM/DD')
      d.setDate(d.getDate() +6)
      var endDate =  moment(d).format('MM/DD')
      dateContent = startDate + '-' +  endDate ;
  }
  else if( range == 'mm'){
    dateContent = moment(d).format('YYYY/MM');
  }
  else if( range == 'yyyy'){
      dateContent = moment(d).format('YYYY');
  }
  return dateContent;
}
exports.getDateByType = function(type){
    var d = new Date();
    if( type == '上一日' || type== '昨天' ){
      d.setDate(d.getDate() -1);
    }
    else if(type == '上周同日' ||type == '上周'|| type == '前一周'){
      d.setDate(d.getDate() -7);
    }
    else if( type == '上月' ){
      d.setMonth(d.getMonth() -1);
    }
    return moment(d).format('YYYY/MM/DD');
}

exports.getWeekDateList = function(date){
    var d = new Date();
    if(date != null){
      d = moment(date, 'YYYY/MM/DD').toDate();
    }
    var dateList = [];
    var dif = d.getDay() || 7 ;
    d.setDate(d.getDate() -dif +1);

    for(var i=0 ;i<7;i++){
      var m = moment(d);
      var cday= m.format('YYYY/MM/DD')
      dateList.push(cday);
      d.setDate(d.getDate() + 1);
    }
    return dateList;
}

exports.getNearThirteenDateList = function(date,simple){

    var dateList = [];
    for(var i=12 ;i>=0;i--){

      var d = moment(date, 'YYYY/MM/DD').toDate();
      d.setDate(d.getDate()- i*7);
      var m = moment(d);
      var cday;
      if(simple){
          cday = m.format('MM/DD')
      }
      else{
          cday = m.format('YYYY/MM/DD')
      }

      dateList.push(cday);

    }
    return dateList;
}

exports.getCompareDate = function(date,compareTime, range){
        var dateList = [];
        var d = new Date();

        if(date != null){
          d = moment(date, 'YYYY/MM/DD').toDate();
        }

        var now = moment(d);
        var today = now.format('YYYY/MM/DD');
        dateList = [];
        dateList.push(today);

        if( compareTime){
          var compare = compareTime[range];
          //////console.log(compare );
          if( compare == '上一日' || compare == '昨天' ){
            d.setDate(d.getDate() -1);
            var m = moment(d);
            var cday= m.format('YYYY/MM/DD')
            dateList.push(cday);
          }
          else if( compare == '上周' || compare == '上周同日' || compare == '前一周'){
            d.setDate(d.getDate() -7);
            var m = moment(d);
            var cday= m.format('YYYY/MM/DD')
            dateList.push(cday);
          }
          else if( compare == '上月' ||compare == '前一月'){
            d.setDate(1);
            d.setMonth(d.getMonth() -1);
            var m = moment(d);
            var cday= m.format('YYYY/MM/DD')
            dateList.push(cday);
          }
          else if( compare == '去年'  || compare == '去年同月' ){
            d.setYear(1900+d.getYear() -1);
            var m = moment(d);
            var cday= m.format('YYYY/MM/DD')
            dateList.push(cday);
          }
          else if( compare == '本周平均' || compare == '當周平均'){
            var dif = d.getDay() || 7 ;
            d.setDate(d.getDate() -dif +1);
            for(var i=0 ;i<7;i++){
              var m = moment(d);
              var cday= m.format('YYYY/MM/DD')
              dateList.push(cday);
              d.setDate(d.getDate() + 1);
            }
          }
          else if( compare == '前一周平均' ||  compare == '上周平均' ){
            var dif = d.getDay() || 7 ;
            d.setDate(d.getDate() -dif +1);
            d.setDate(d.getDate()-7)
            for(var i=0 ;i<7;i++){
              var m = moment(d);
              var cday= m.format('YYYY/MM/DD')
              dateList.push(cday);
              d.setDate(d.getDate() + 1);
            }
          }
          else if( ( compare == '近28天平均' )&& range == 'dd' ){
            for(var i=0 ;i<28;i++){
              d.setDate(d.getDate() -1);
              var m = moment(d);
              var cday= m.format('YYYY/MM/DD')
              dateList.push(cday);
            }
          }
          else if( (compare == '本月平均' || compare == '當月平均' )&& range == 'dd' ){
            d.setDate(1);
            for(var i=0 ;i<30;i++){
              var m = moment(d);
              var cday= m.format('YYYY/MM/DD')
              dateList.push(cday);
              d.setDate(d.getDate() + 1);
            }
          }
          else if( (compare == '本月平均' || compare == '當月平均' ) && range == 'ww' ){
            d.setDate(1);
            for(var i=0 ;i<5;i++){
              var m = moment(d);
              var cday= m.format('YYYY/MM/DD')
              dateList.push(cday);
              d.setDate(d.getDate()+7);
            }
          }
          else if( (compare == '上月平均' ) && range == 'ww' ){
            d.setDate(1);
            d.setMonth(d.getMonth() -1);
            for(var i=0 ;i<5;i++){
              var m = moment(d);
              var cday= m.format('YYYY/MM/DD')
              dateList.push(cday);
              d.setDate(d.getDate()+7);
            }
          }
          else if( compare == '近13周平均' ){
            for(var i=0 ;i<13;i++){
              d.setDate(d.getDate() -7);
              var m = moment(d);
              var cday= m.format('YYYY/MM/DD')
              dateList.push(cday);

            }
          }
          else if( compare == '近3月平均' ){
            for(var i=0 ;i<3;i++){
              d.setMonth(d.getMonth() -1);
              var m = moment(d);
              var cday= m.format('YYYY/MM/DD')
              dateList.push(cday);

            }
          }
        }
        return dateList;

};

exports.convertWeekday = function(wd){
  switch(wd){
    case 'Mo':
      return '星期一';
    case 'Tu':
      return '星期二';
    case 'We':
      return '星期三';
    case 'Th':
      return '星期四';
    case 'Fr':
      return '星期五';
    case 'Sa':
      return '星期六';
    case 'Su':
      return '星期日';
  }
};
exports.convertWeekdayEn = function(wd){
  switch(wd){
    case 'Mo':
      return 'Monday';
    case 'Tu':
      return 'Tuesday';
    case 'We':
      return 'Wednesday';
    case 'Th':
      return 'Thursday';
    case 'Fr':
      return 'Friday';
    case 'Sa':
      return 'Saturday';
    case 'Su':
      return 'Sunday';
  }
};

exports.unitToString = function(unit){
  switch(unit){
    case 'ww':
      return I18n.t("bi_du_week");
    case 'wd':
      return I18n.t("bi_du_day");
    case 'mm':
      return I18n.t("bi_du_month");
    case 'yyyy':
      return I18n.t("bi_du_year");
    case 'dd':
      return I18n.t("bi_du_day");
    case 'hh':
      return I18n.t("bi_du_hour");
    default:
      return '';

  }
};

exports.stringToUnit = function(str){
  switch(str){
    case '周':
      return 'ww';
    case '日':
      return 'wd';
    case '月':
      return 'mm';
    case '時':
      return 'hh';
  }
};

exports.getSimpleWeekList = function(item){
     if( I18n.locale=='en'){
       return ['(Mon)','(Tue)','(Wed)','(Thu)','(Fri)','(Sat)','(Sun)']
     }
     return ['(一)','(二)','(三)','(四)','(五)','(六)','(日)'];

}
exports.getFullWeekList = function(item){
     if( I18n.locale=='en'){
       return ['Monday','Tuesday', 'Wednesday','Thursday','Friday','Saturday','Sunday']
     }
     return ['星期一','星期二','星期三','星期四','星期五','星期六','星期日'];

}

exports.gconverEngWeekend = function(item){
     if( I18n.locale!='en'){
       if( item == 'Monday')
        item='星期一';
       else if( item == 'Tuesday')
         item = '星期二';
       else if( item == 'Wednesday')
           item = '星期三';
       else if( item == 'Thursday')
          item = '星期四';
       else if( item == 'Friday')
          item = '星期五';
       else if( item == 'Saturday')
          item = '星期六';
       else if( item == 'Sunday')
          item = '星期日';
     }
     return item;

}
exports.getStoreName = function(selectedStoreSetting){
  if(selectedStoreSetting ){
  //  ////console.log(selectedStoreSetting )
      if(selectedStoreSetting.type == 'group' || selectedStoreSetting.type == 'store'){

        return I18n.t(selectedStoreSetting.name);
      }
      else{
         var name = selectedStoreSetting.country ;
         if( selectedStoreSetting.province &&
              selectedStoreSetting.province != '全區'){
                  name = name + selectedStoreSetting.province;
         }
         if( selectedStoreSetting.city &&
              selectedStoreSetting.city  != '全區'){
                  name = name + selectedStoreSetting.city ;
         }
         return I18n.t(name);
      }
  }
  else{
    return I18n.t('全部門店');
  }
}

exports.createAnalyticRequest = function(token,data_source,range,unit,date, time ,storeList){
    var reqList = [];
    var req = this.createRequest(token,data_source,range,unit,date,null,storeList);
    var dates = this.getCompareDate(date, time, range);
    if( dates.length > 1)
      dates.shift();
    req.data_source.time_compare = "";
    if(dates.length > 1){
        req.data_source.time_compare = "on";
    }
    req.data_source.date  = dates;
    //////console.log(dates)

    return req;
}
exports.createCompountRequest = function(token,data_source,range,unit,date,compareTime,storeList){
    var reqList = [];
    var req = this.createRequest(token,data_source,range,unit,date,null,storeList);
    reqList.push(req);
    var dates = this.getCompareDate(date, compareTime, range);
    dates.shift();
    var newReq = JSON.parse(JSON.stringify(req));
    newReq.data_source.date  = dates;
    if(dates.length > 1){
      newReq.data_source.time_compare = "on";
    }
    reqList.push(newReq);

    return reqList;
}
exports.parseAvgData = function(dataList){
  var len = dataList.length;
  if(len == 0) return null;
  if(len == 1) return dataList[0];
  var target = {};
  target.max = 0 ;
  target.min = 0;
  target.avg = 0;
  target.sum = 0;
  target.row = [];
  for(var i in dataList[0].row){
    target.row.push(0)
  }
  var count = 0;
  for(var k in dataList){
    var d = dataList[k];
    target.max  = target.max  + d.max;
    target.min  = target.min  + d.min;
    target.avg = target.avg  + d.avg;
    target.sum = target.sum  + d.sum;
    for(var i in target.row){
      if( d.row[i]){
        target.row[i] = target.row[i] + d.row[i];
      }
    }
    if( d.avg != 0 ) count = count +1;

  }
  //////console.log('Count=' + count)
  //////console.log(dataList)
  if( count >0 ){
    target.max  = Math.round(target.max / count);
    target.min  = Math.round(target.min / count);
    target.avg = Math.round(target.avg  / count);
    target.sum = Math.round(target.sum / count);
    for(var i in target.row){
      target.row[i] = Math.round(target.row[i] / count)
    }
  }
  return target;
}


exports.createRequest = function(token,data_source,range,unit,date,compareTime,storeList){
  //////console.log(storeList);

  var req = {
    data_source: JSON.parse(JSON.stringify(data_source)),
    token: token,
    module_id: 0
  };
  req.data_source.data_range  = range;
  req.data_source.data_unit   = unit;
  dates = this.getCompareDate(date, compareTime, range);
  if(compareTime){
    req.data_source.time_compare = "on";
  }
  else{
    req.data_source.time_compare = "";
  }
  req.data_source.date = dates;
  for(var k in req.data_source.source){
  //  ////console.log(req.data_source.source[k])
  //  ////console.log(storeList)
    req.data_source.source[k].sources = storeList;
  }
  return req;
}

exports.getDateLabel = function(date,range){
  var dateContent ;
  var d = new Date();
  if(date){
    d = moment(date, 'YYYY/MM/DD HH:mm:ss').toDate();
    d.setMinutes(0);
  }
   if( range == 'hh'){
     return  moment(d).format('HH:mm');
   }
   else{
     return  moment(d).format('DD');
   }
}

exports.getDateTitle = function(date,range){
  var dateContent ;
  var d = new Date();
  if(date){
    d = moment(date, 'YYYY/MM/DD').toDate();
  }

  if(range == 'dd') {
      dateContent = moment(d).format('YYYY/MM/DD (dd)');
  } else if( range == 'ww') {
      var dif = d.getDay() || 7 ;
      d.setDate(d.getDate() -dif +1);
      var startDate =  moment(d).format('MM/DD')
      d.setDate(d.getDate() +6)
      var endDate =  moment(d).format('MM/DD')
      dateContent = startDate + '-' +  endDate ;
  } else if(range == 'mm') {
    //if(I18n.locale=='en'){
        dateContent = moment(d).format('YYYY/MM');
    //} else {
       //dateContent = moment(d).format('YYYY年MM月');
    //}
  } else if(range == 'yyyy') {
    if(I18n.locale=='en'){
        dateContent = moment(d).format('YYYY');
    } else {
       dateContent = moment(d).format('YYYY年');
    }
  }

  return dateContent;
}
exports.fixDataValue = function(val, widget){
  ////console.log('fixDataValu'+widget.title + ' ' + val)
  if( widget.title == '提袋率' ||
        widget.title == "bi_teturncustom_rate"
        ){
          ///val = val * 100 ;
          val = val.toFixed(1) + '%'
  }
  else if( widget.title == "bi_turnin_rate" ){
          val = val.toFixed(1) + '%'
  }
  else if(
            widget.title == '連帶率' ||
          widget.title == 'PM 2.5' ||
          widget.title == 'PM 10'||
          widget.title == '一氧化碳'||
          widget.title == '二氧化碳'||
          widget.title == '甲醛'||
          widget.title == '揮發有機物'||
          widget.title == '濕度'){

          val = val.toFixed(2)
  }
  else{
        val = this.fixQuoteValue(val)
  }
  return val;
}
exports.getCompleteMessage = function(n) {
    if(n>80){
        return I18n.t("bi_almost_done");
    }
    else if(n>60){
        return I18n.t("bi_final_rush");
    }
    else if(n>40){
        return I18n.t("bi_half_done");
    }
    else if(n>20){
        return I18n.t("bi_going_up");
    }
    else{
        return I18n.t("bi_new_beginning");
    }
}
/*
1. 0%~20% - 又是新的开始, 期待今天表现唷:)
2. 21%~40% - 不断向上攀升中!
3. 41%~60% - 突破一半目标了加油!
4. 61%~80% - 最后冲刺, 快到达顶标!
5. 81%~100 - 即将完成目标!
*/
exports.isFloat = function(n) {
    return n === +n && n !== (n|0);
}
exports.parseDataResponse = function(data, dataSource){
  var list = [];
  if(data.status!=1){
    return list;
  }
  if( dataSource.analytic.length > 0 ){
    for( var k in dataSource.analytic){
      var datas = data.analytic[k].data;
      var type = dataSource.analytic[k].preprocess_data[0];
      for(var i in datas){
        var d = datas[i];
        if(d){
          var out  = JSON.parse(JSON.stringify(d[type]));
          out.date = d.date;
          out.store_id = d.store_id;
          if(!out.store_id)
            out.store_id = data.retrived[k].data[i].store_id;
          list.push(out);
        }
      }
    }
  } else {
    for( var k in dataSource.source) {
      var datas = data.retrived[k].data;
      var type = dataSource.source[k].preprocess_data[0];
      for(var i in datas) {
        var d = datas[i];
        var out = d[type];
        if(d){
          out.date = d.date;
          out.store_id = d.store_id;
          list.push(out);
        }
      }
    }
  }
  return list;
}

exports.getCompareOption = function(range){
      var list=[];
      if(range == 'dd'){
        list.push('昨天')
        list.push('上周同日')
      }
      else if(range == 'ww'){
        list.push('前一周')
      }
      else if(range == 'mm'){
        list.push('上月')
        list.push('去年同月')
      }
      else if(range == 'yyyy'){
        list.push('去年')
      }
      list.push('自訂日期')
      return list;
}


exports.createNewStoreList = function(storeList,groupList,selectedStatus){
    ////console.log(storeList);
    ////console.log(selectedStatus)
    var stores = [];

    if(selectedStatus.type == 'store' ){

        for(var k in storeList ){
           var store = storeList[k];
           if( store.store_id == selectedStatus.id ){
             var s = {selected:true, tag_ids: store.tag_ids,store_id:store.store_id, sensors:store.sensors,register_key:store.register_key,store_name: store.store_name};
             stores.push(s)
             break;
           }
        }

    }
    else if(selectedStatus.type == 'region' ){
        for(var k in storeList ){
           var store = storeList[k];
           var isAdd = false;
           if( selectedStatus.country == '全部門店' ||
              ( selectedStatus.province == '全區' && store.country == selectedStatus.country) ||
              ( selectedStatus.city == '全區' && store.country == selectedStatus.country && store.province == selectedStatus.province)  ||
              (  store.country == selectedStatus.country && store.province == selectedStatus.province && store.city == selectedStatus.city) ){
             var s = {selected:true, tag_ids: store.tag_ids,store_id:store.store_id, sensors:store.sensors,register_key:store.register_key,store_name: store.store_name};
             stores.push(s)
           }
        }

    }
    else if(selectedStatus.type == 'group' ){
    //  //console.log('Group ' + selectedStatus.id)
      var group = groupList[parseInt(selectedStatus.id)];
      if(!group) return null;
      if(group.type == 'store'){

        for(var k in group.storeList ){
          var find = true;
          for(var n in storeList){
            var store = storeList[n];
            if( store.store_id == group.storeList[k].store_id){
              var s = {selected:true, sensors:store.sensors,store_id:store.store_id, store_name: store.store_name};
              stores.push(s)
              break;
            }
          }
        }
        //console.log(stores)
      }
      else{

        var tags = [];
        tags = tags.concat(group.system)
        tags = tags.concat(group.user)
        ////console.log(tags)
        for(var k in storeList ){
          var store = storeList[k];
          if(store.tag_ids){
            for(var x in tags){
                //console.log(tags[x])
                var index = store.tag_ids.indexOf(tags[x]);
                if( index != -1 ){
                  var s = {selected:true, store_id:store.store_id, store_name: store.store_name};
                  stores.push(s)
                  break;
                }
            }
          }
        }
      }


      /*
      for(var k in storeList ){
        var store = storeList[k];
        if(store.tag_ids){
          ////console.log(store.tag_ids)
          var index = store.tag_ids.indexOf(selectedStatus.id);
          if( index != -1 ){
            var s = {selected:true, store_id:store.store_id, store_name: store.store_name};
            stores.push(s)
          }
        }
      }
      */
    }
    return stores;
}


exports.cleanData = function(list, widget){
  for( var k in list){
     var d = list[k];
     /*
     if(   widget.title == '連帶率' ||
         widget.title == '編制服務數'){
             d.avg = 0;
             d.sum = 0;
             d.min = 0;
             d.max = 0;
             for(var x in d.row){
               d.row[x] = 0;
             }
     }
     else
     */
     if(  widget.title == '提袋率' ||
          widget.title == "bi_turnin_rate" ||
           widget.title == "bi_teturncustom_rate"  ){
             d.avg = d.avg * 100;
             d.sum =  d.sum * 100 ;
             d.min = d.min * 100;
             d.max = d.max * 100;
             for(var x in d.row){
               d.row[x] = d.row[x]*100;
             }
     }
  }
  return list;
}

exports.padLeft = function(str, len) {
  str = '' + str;
  if (str.length >= len) {
      return str;
  } else {
      return this.padLeft("0" + str, len);
  }
}
exports.fixQuoteValue = function(value){
    var str = value +'';
    if(str.indexOf('%') > -1)
      return value;



    var end = ''
    var arr = str.split('.')
    if(arr.length>1){
      ////console.log('tempValue')
      var tempValue = value.toFixed(1)
      ////console.log('tempValue'+  tempValue)
      //arr =  tempValue.split('.')
      ////console.log(arr[1])
      var subs =  arr[1].substring(0, 1);
      ////console.log(subs)
      end = '.' +  subs
    }


    value = Math.round(value)
    if( value > 100000 ){
      value = Math.round(value /1000)
      end = end + 'K'
    }
    var sign = '';
    if(value <0 ){
      value = -1 * value;
      sign = '-'
    }
  //  //console.log(value)
    var output = '';
    var list = [] ;
    var c = value;
    while(c > 1000){
       var temp = c % 1000;
       list.push(temp)
       c = Math.round((c -temp)/1000);
    }
    list.push(c);
    list =list.reverse()
    for(var k in list){
      //  //console.log(list[k])
       if(k!=0){
        var n = this.padLeft(list[k],3)
        output = output +  n;
      }
       else {
        output = output + list[k];
       }
       if(k!=(list.length -1)) output = output + ','
    }
    return sign + output + end;

}

exports.createReportRequest = function(token,data_source,range,timeType,start,end,storeList){
  ////console.log(token);
  ////console.log(data_source)
  var req = {
    token,
    data_source: JSON.parse(JSON.stringify(data_source)),
    module_id: 0
  };
  req.data_source.data_range  = range;
  req.data_source.data_unit   = range;
  dates = this.ceateDateRange(timeType, start,end,range);
  req.data_source.time_compare = "on";
  req.data_source.date = dates;
  for(var k in req.data_source.source){
    req.data_source.source[k].sources = storeList;
  }
  ////console.log(req)
  return req;
}

exports.ceateDatePeriod = function(date,range){
  var dateList = [];
  var d = new Date();
  if(date) {
    d = moment(date, 'YYYY/MM/DD').toDate();
  }

  if( range == 'dd'){
    dateList.push(moment(d).format('YYYY/MM/DD'))
    dateList.push(moment(d).format('YYYY/MM/DD'))
  } else if( range == 'ww') {
    var dif = d.getDay() || 7 ;
    d.setDate(d.getDate() -dif +1);
    dateList.push(moment(d).format('YYYY/MM/DD'))
    d.setDate(d.getDate() +6);
    dateList.push(moment(d).format('YYYY/MM/DD'))
  } else if(range == 'mm') {
    d.setDate(1);
    dateList.push(moment(d).format('YYYY/MM/DD'))
    d.setMonth(d.getMonth()+1);
    d.setDate(d.getDate()-1);
    dateList.push(moment(d).format('YYYY/MM/DD'))
  } else if(range == 'yyyy') {
    d.setDate(1);
    d.setMonth(0);
    dateList.push(moment(d).format('YYYY/MM/DD'))

    d.setDate(31);
    d.setMonth(11);
    dateList.push(moment(d).format('YYYY/MM/DD'))
  }
  return dateList;
}

exports.ceateDatePeriodRange = function(date,range){
  var dateList = [];
  var d = new Date();
  if(date) {
    d = moment(date, 'YYYY/MM/DD').toDate();
  }

  if( range == 'dd'){
    var startDate = date ? moment(date, 'YYYY/MM/DD').toDate() : new Date();
    startDate.setDate(d.getDate() - 49);
    dateList.push(moment(startDate).format('YYYY/MM/DD'))
    dateList.push(moment(d).format('YYYY/MM/DD'))
  } else if( range == 'ww') {
    var startDate = date ? moment(date, 'YYYY/MM/DD').toDate() : new Date();
    startDate.setDate(d.getDate() - 49);
    var dif = startDate.getDay() || 7 ;
    startDate.setDate(startDate.getDate() - dif + 1);
    dateList.push(moment(startDate).format('YYYY/MM/DD'));
    dif = d.getDay() ? 7 - d.getDay() : 0 ;
    d.setDate(d.getDate() + dif);
    dateList.push(moment(d).format('YYYY/MM/DD'));
    /*var dif = d.getDay() || 7 ;
    d.setDate(d.getDate() -dif +1);
    dateList.push(moment(d).format('YYYY/MM/DD'))
    d.setDate(d.getDate() +6);
    dateList.push(moment(d).format('YYYY/MM/DD'))*/
  } else if(range == 'mm') {
    d.setDate(1);
    dateList.push(moment(d).format('YYYY/MM/DD'))
    d.setMonth(d.getMonth()+1);
    d.setDate(d.getDate()-1);
    dateList.push(moment(d).format('YYYY/MM/DD'))
  } else if(range == 'yyyy') {
    d.setDate(2);
    d.setMonth(1);
    dateList.push(moment(d).format('YYYY/MM/DD'))

    d.setDate(1);
    d.setMonth(11);
    dateList.push(moment(d).format('YYYY/MM/DD'))
  }
  return dateList;
}


exports.parsePosData = function(dataList, date , range,unit){
          //console.log('ParsePosData ',date,' ',range, ' ', unit);
         // console.log(dataList)
          var outputData ={total_amount:[],transaction_count:[],item_count:[],labels:[],labels2:[]};
          var startd ,endd
          var d = new Date();
          if(date){
              d = moment(date, 'YYYY/MM/DD').toDate();
          }
          if( range == 'dd'){
              if(unit == 'dd'){
                outputData.labels.push('');
                outputData.labels2.push('');
                outputData.total_amount.push(-1);
                outputData.transaction_count.push(-1);
                outputData.item_count.push(-1);
                if(dataList[0]){
                  outputData.total_amount[0] = dataList[0].total_amount;
                  outputData.transaction_count[0] = dataList[0].transaction_count;
                  outputData.item_count[0] = dataList[0].item_count;
                }
              }
              else if(unit == 'hh'){
                  for(var k =0;k<24;k++){
                    outputData.labels.push(k+':00');
                    outputData.labels2.push('');
                    outputData.total_amount.push(-1);
                    outputData.transaction_count.push(-1);
                    outputData.item_count.push(-1);
                  }
                  for(var k  in dataList){
                       var tempData = moment(dataList[k].date_time, 'YYYY/MM/DD HH:mm:ss').toDate();
                       var h  = tempData.getHours();
                       outputData.total_amount[h] = dataList[k].total_amount;
                       outputData.transaction_count[h] = dataList[k].transaction_count;
                       outputData.item_count[h] = dataList[k].item_count;
                  }

              }
          }
          else if( range == 'ww'){
              if(unit == 'ww'){
                outputData.labels.push('');
                outputData.labels2.push('');
                outputData.total_amount.push(-1);
                outputData.transaction_count.push(-1);
                outputData.item_count.push(-1);
                if(dataList[0]){
                  outputData.total_amount[0] = dataList[0].total_amount;
                  outputData.transaction_count[0] = dataList[0].transaction_count;
                  outputData.item_count[0] = dataList[0].item_count;
                }
              }
              else if(unit == 'wd' || unit == 'dd'){
                outputData.labels = this.getSimpleWeekList();
                outputData.labels2 = ['','','','','','',''];
                for(var k =0;k<7;k++){
                  outputData.total_amount.push(-1);
                  outputData.transaction_count.push(-1);
                  outputData.item_count.push(-1);
                }
                for(var k  in dataList){
                     var tempData = moment(dataList[k].date_time, 'YYYY/MM/DD HH:mm:ss').toDate();
                     var h =( tempData.getDay()+6)%7
                     outputData.total_amount[h] = dataList[k].total_amount;
                     outputData.transaction_count[h] = dataList[k].transaction_count;
                     outputData.item_count[h] = dataList[k].item_count;
                }
              }
          }
          else if(range == 'mm'){
             if(unit == 'mm'){
               outputData.labels.push('');
               outputData.labels2.push('');
               outputData.total_amount.push(-1);
               outputData.transaction_count.push(-1);
               outputData.item_count.push(-1);
               if(dataList[0]){
                 outputData.total_amount[0] = dataList[0].total_amount;
                 outputData.transaction_count[0] = dataList[0].transaction_count;
                 outputData.item_count[0] = dataList[0].item_count;
               }
             }
             else if(unit == 'dd'){
               console.log('unit dd--')
               d.setDate(1);
               d.setMonth(d.getMonth()+1);
               d.setDate(d.getDate()-1);
               var dayOfMonth = d.getDate();
               var month = d.getMonth();
               console.log('DayOfMon:',dayOfMonth);
               console.log('Month=',month)
               for(var k =0;k<dayOfMonth;k++){
                 outputData.labels.push((k+1));
                 outputData.labels2.push('');
                 outputData.total_amount.push(-1);
                 outputData.transaction_count.push(-1);
                 outputData.item_count.push(-1);
               }
               for(var k  in dataList){
                    var tempData = moment(dataList[k].date_time, 'YYYY/MM/DD HH:mm:ss').toDate();

                    if(tempData <= d){
                      var h  = tempData.getDate()-1;
                      outputData.total_amount[h] = dataList[k].total_amount;
                      outputData.transaction_count[h] = dataList[k].transaction_count;
                      outputData.item_count[h] = dataList[k].item_count;
                    }

               }
             }
          }
          else if(range == 'yyyy'){
            if(unit == 'yyyy'){
              outputData.labels.push('');
              outputData.labels2.push('');
              outputData.total_amount.push(-1);
              outputData.transaction_count.push(-1);
              outputData.item_count.push(-1);
              if(dataList[0]){
                outputData.total_amount[0] = dataList[0].total_amount;
                outputData.transaction_count[0] = dataList[0].transaction_count;
                outputData.item_count[0] = dataList[0].item_count;
              }
            }
            else if(unit == 'mm'){
              for(var k =0;k<12;k++){
                outputData.labels.push((k+1));
                outputData.labels2.push(' ');
                outputData.total_amount.push(-1);
                outputData.transaction_count.push(-1);
                outputData.item_count.push(0-1);
              }
              for(var k  in dataList){
                //console.log("yyyy dataList[k] : ", dataList[k]);
                 var tempDate = moment(dataList[k].date_time, 'YYYY/MM/DD HH:mm:ss').toDate();
                 //if(tempDate <= d){
                   //console.log(d);console.log(tempDate)
                   var h  = tempDate.getMonth();
                   outputData.total_amount[h] = dataList[k].total_amount;
                   outputData.transaction_count[h] = dataList[k].transaction_count;
                   outputData.item_count[h] = dataList[k].item_count;
                 //}
              }
            }
            else if(unit == 'dd'){
              for(var k =0;k<12;k++){
                outputData.labels.push((k+1));
                outputData.labels2.push(' ');
                outputData.total_amount.push(0);
                outputData.transaction_count.push(0);
                outputData.item_count.push(0);
              }
              for(var k in dataList){
                var tempDate = moment(dataList[k].date_time, 'YYYY/MM/DD HH:mm:ss').toDate();
                var h  = tempDate.getMonth();
                outputData.total_amount[h] += parseInt(dataList[k].total_amount);
                outputData.transaction_count[h] += parseInt(dataList[k].transaction_count);
                outputData.item_count[h] += dataList[k].item_count;
              }
              for(var k =0;k<12;k++){
                if(outputData.total_amount[k] == 0) { outputData.total_amount[k] = -1; }
                if(outputData.transaction_count[k] == 0) { outputData.transaction_count[k] = -1; }
                if(outputData.item_count[k] == 0) { outputData.item_count[k] = -1; }
              }
            }
          }
          return outputData;
}


exports.parseReturnData = function(dataList, date , range,unit){
          console.log('ParsePosData ',date,' ',range, ' ', unit);
          console.log('parseReturnData')
          //console.log(dataList)
          var outputData ={total_count:[],return_count:[],rate:[],labels:[],labels2:[]};
          var startd ,endd
          var d = new Date();
          if(date){
              d = moment(date, 'YYYY/MM/DD').toDate();
          }
          if( range == 'ww'){
              if(unit == 'wd' || unit == 'dd'){
                outputData.labels = this.getSimpleWeekList();
                outputData.labels2 = ['','','','','','',''];
                for(var k =0;k<7;k++){
                  outputData.total_count.push(-1);
                  outputData.return_count.push(-1);
                  outputData.rate.push(-1);
                }
                //console.log(outputData)
                for(var k  in dataList){
                     var tempData = moment(dataList[k].date_time, 'YYYY/MM/DD HH:mm:ss').toDate();
                     var h =( tempData.getDay()+6)%7
                     if(outputData.total_count[h]<0)outputData.total_count[h]=0;
                     if(outputData.return_count[h]<0)outputData.return_count[h]=0;
                     outputData.total_count[h] = outputData.total_count[h] + dataList[k].total_count;
                     outputData.return_count[h] = outputData.return_count[h] + dataList[k].return_count;
                }
                //console.log(outputData)
                for(var k =0;k<7;k++){
                  var rate = -1 ;
                  if(outputData.total_count[k]>=0 && outputData.return_count[k]>=0){
                    rate = 0;
                  }
                  if(outputData.total_count[k]>0 && outputData.return_count[k]>0){
                    rate = outputData.return_count[k] / outputData.total_count[k];
                  }
                  if(rate>0){
                    rate = rate * 100;
                    rate = rate.toFixed(2);
                  }
                  outputData.rate[k] = rate;
                }
              }
          }
          else if(range == 'mm'){
             if(unit == 'dd'){
               console.log('unit dd--')
               d.setDate(1);
               d.setMonth(d.getMonth()+1);
               d.setDate(d.getDate()-1);
               var dayOfMonth = d.getDate();
               var month = d.getMonth();
               console.log('DayOfMon:',dayOfMonth);
               console.log('Month=',month)
               for(var k =0;k<dayOfMonth;k++){
                 outputData.labels.push((k+1));
                 outputData.labels2.push('');
                 outputData.total_count.push(-1);
                 outputData.return_count.push(-1);
                 outputData.rate.push(-1);
               }
               for(var k  in dataList){
                    var tempData = moment(dataList[k].date_time, 'YYYY/MM/DD HH:mm:ss').toDate();
                    if(tempData <= d){
                      var h  = tempData.getDate()-1;
                      if(outputData.total_count[h]<0)outputData.total_count[h]=0;
                      if(outputData.return_count[h]<0)outputData.return_count[h]=0;
                      outputData.total_count[h] = outputData.total_count[h] + dataList[k].total_count;
                      outputData.return_count[h] = outputData.return_count[h] + dataList[k].return_count;
                    }

               }
               for(var k =0;k<dayOfMonth;k++){
                 var rate = -1 ;
                 if(outputData.total_count[k]>=0 && outputData.return_count[k]>=0){
                   rate = 0;
                 }
                 if(outputData.total_count[k]>0 && outputData.return_count[k]>0){
                   rate = outputData.return_count[k] / outputData.total_count[k];
                 }
                 if(rate>0){
                   rate = rate * 100;
                   rate = rate.toFixed(2);
                 }
                 outputData.rate[k] = rate;
               }
             }
          }
          else if(range == 'yyyy'){
            if(unit == 'mm'){
              console.log(dataList);
              for(var k =0;k<12;k++){
                outputData.labels.push((k+1));
                outputData.labels2.push(' ');
                outputData.total_count.push(-1);
                outputData.return_count.push(-1);
                outputData.rate.push(-1);
              }
              console.log(dataList);
              for(var k  in dataList){
                console.log(dataList[k]);
                 var tempDate = moment(dataList[k].date_time, 'YYYY/MM/DD HH:mm:ss').toDate();
                 if(tempDate <= d){
                   //console.log(d);console.log(tempDate)
                   var h  = tempDate.getMonth();
                   if(outputData.total_count[h]<0)outputData.total_count[h]=0;
                   if(outputData.return_count[h]<0)outputData.return_count[h]=0;
                   outputData.total_count[h] = outputData.total_count[h] + dataList[k].total_count;
                   outputData.return_count[h] = outputData.return_count[h] + dataList[k].return_count;

                 }
              }
              for(var k =0;k<12;k++){
                var rate = -1 ;
                if(outputData.total_count[k]>=0 && outputData.return_count[k]>=0){
                  rate = 0;
                }
                if(outputData.total_count[k]>0 && outputData.return_count[k]>0){
                  rate = outputData.return_count[k] / outputData.total_count[k];
                }
                if(rate>0){
                  rate = rate * 100;
                  rate = rate.toFixed(2);
                }
                outputData.rate[k] = rate;
              }
            }

          }
          return outputData;
}

exports.parseReturnAnalytic = function(dataList, date , range,unit){
          console.log('ParsePosData ',date,' ',range, ' ', unit);
          console.log('parseReturnData')
          //console.log(dataList)
          var outputData ={amount:[[],[],[]],stastic:[0,0,0],labels:[],labels2:[]};
          var startd ,endd
          var d = new Date();
          if(date){
              d = moment(date, 'YYYY/MM/DD').toDate();
          }
          if( range == 'ww'){
              if(unit == 'wd' || unit == 'dd'){
                outputData.labels = this.getSimpleWeekList();
                outputData.labels2 = ['','','','','','',''];
                for(var k =0;k<7;k++){
                  outputData.amount[0].push(0);
                  outputData.amount[1].push(0);
                  outputData.amount[2].push(0);
                }
                //console.log(outputData)
                for(var k  in dataList){
                     var tempData = moment(dataList[k].date_time, 'YYYY/MM/DD HH:mm:ss').toDate();
                     var h =( tempData.getDay()+6)%7
                     for(var n in dataList[k].items){
                       if(dataList[k].items[n].count>=3){
                         outputData.amount[0][h] = outputData.amount[0][h] +1
                         outputData.stastic[0] = outputData.stastic[0] +1;
                       }
                       else if(dataList[k].items[n].count==2){
                         outputData.amount[1][h] = outputData.amount[1][h] +1
                         outputData.stastic[1] = outputData.stastic[1] +1;
                       }

                     }
                     var dif = dataList[k].total_count - dataList[k].return_count;
                     outputData.amount[2][h] = outputData.amount[2][h] + dif
                     outputData.stastic[2] = outputData.stastic[2] + dif;

                }
              }
          }
          else if(range == 'mm'){
             if(unit == 'dd'){
               console.log('unit dd--')
               d.setDate(1);
               d.setMonth(d.getMonth()+1);
               d.setDate(d.getDate()-1);
               var dayOfMonth = d.getDate();
               var month = d.getMonth();
               console.log('DayOfMon:',dayOfMonth);
               console.log('Month=',month)
               for(var k =0;k<dayOfMonth;k++){
                 outputData.labels.push((k+1));
                 outputData.labels2.push('');
                 outputData.amount[0].push(0);
                 outputData.amount[1].push(0);
                 outputData.amount[2].push(0);
               }
               for(var k  in dataList){
                    var tempData = moment(dataList[k].date_time, 'YYYY/MM/DD HH:mm:ss').toDate();
                    if(tempData <= d){
                      var h  = tempData.getDate()-1;
                      for(var n in dataList[k].items){
                        if(dataList[k].items[n].count>=3){
                          outputData.amount[0][h] = outputData.amount[0][h] +1
                          outputData.stastic[0] = outputData.stastic[0] +1;
                        }
                        else if(dataList[k].items[n].count==2){
                          outputData.amount[1][h] = outputData.amount[1][h] +1
                          outputData.stastic[1] = outputData.stastic[1] +1;
                        }

                      }
                      var dif = dataList[k].total_count - dataList[k].return_count;
                      outputData.amount[2][h] = outputData.amount[2][h] + dif
                      outputData.stastic[2] = outputData.stastic[2] + dif;
                    }

               }
             }
          }
          else if(range == 'yyyy'){
            if(unit == 'mm'){
              console.log(dataList);
              for(var k =0;k<12;k++){
                outputData.labels.push((k+1));
                outputData.labels2.push(' ');
                outputData.amount[0].push(0);
                outputData.amount[1].push(0);
                outputData.amount[2].push(0);
              }
            //  console.log(dataList);
              for(var k  in dataList){
                console.log(dataList[k]);
                 var tempDate = moment(dataList[k].date_time, 'YYYY/MM/DD HH:mm:ss').toDate();
                 if(tempDate <= d){
                   //console.log(d);console.log(tempDate)
                   var h  = tempDate.getMonth();
                   for(var n in dataList[k].items){
                     if(dataList[k].items[n].count>=3){
                       outputData.amount[0][h] = outputData.amount[0][h] +1
                       outputData.stastic[0] = outputData.stastic[0] +1;
                     }
                     else if(dataList[k].items[n].count==2){
                       outputData.amount[1][h] = outputData.amount[1][h] +1
                       outputData.stastic[1] = outputData.stastic[1] +1;
                     }

                   }
                   var dif = dataList[k].total_count - dataList[k].return_count;
                   outputData.amount[2][h] = outputData.amount[2][h] + dif
                   outputData.stastic[2] = outputData.stastic[2] + dif;

                 }
              }
            }

          }
          return outputData;
}
exports.ceateDateRange = function(timeType,start,end,range){
          var dateList = [];
          var startd ,endd

          if( timeType==null ||  timeType != '自訂日期'){
            startd = new Date()
            endd = new Date()
            if( range == 'dd'){
                endd.setDate(endd.getDate()-1)
                startd.setDate(startd.getDate()-28)
            }
            else if(range == 'ww'){
              startd.setDate(startd.getDate()-7*13);
              endd.setDate(endd.getDate()-7);
            }
            else if(range == 'mm'){
              startd.setMonth(startd.getMonth()-7);
              endd.setMonth(endd.getMonth()-1);
            }
            start = moment(startd).format('YYYY/MM/DD')
            end = moment(endd).format('YYYY/MM/DD')
          }
          else{
            startd = moment(start, 'YYYY/MM/DD').toDate();
            endd = moment(end, 'YYYY/MM/DD').toDate();
          }
          if( range == 'dd'){
            while(startd <= endd){
              var m = moment(startd);
              var cday= m.format('YYYY/MM/DD')
              dateList.push(cday);
              startd.setDate(startd.getDate() +1)
            }
          }
          else if( range == 'ww'){
            while(startd <= endd){
              var m = moment(startd);
              var cday= m.format('YYYY/MM/DD')
              dateList.push(cday);
              startd.setDate(startd.getDate() +7)
            }
          }
          else if(range == 'mm'){
            startd.setDate(1);
            while(startd<= endd){
              var m = moment(startd);
              var cday= m.format('YYYY/MM/DD')
              dateList.push(cday);
              startd.setMonth(startd.getMonth()+1);
            }
          }
          return dateList;


}

exports.getMainMenuTitles = function(apptype){
  if( apptype=='NT'){
    return ['綜合指標','市場排行','交叉分析','報表查詢'];
  }
  else{
    return [I18n.t('績效指標'),
            I18n.t('分店分析'),
            I18n.t('交叉分析'),
            I18n.t('綜合報表')];
  }

}

exports.getHeatmapAnalyticReq = function(token,range,date, store, sensor, type, favors){
  var d = new Date();
  if(date){
    d = moment(date, 'YYYY/MM/DD').toDate();
  }
  var dateContent = moment(d).format('YYYY/MM/DD');
  //console.log(dateContent)

  var dateContent
  var unit ;
  if( range == 'ww'){
    unit = 'wd'
  }
  else if( range == 'mm'){
    unit = 'dd'
  }
  else if( range == 'dd'){
    unit = 'hh'
  }
  else if( range == 'yyyy'){
    unit = 'mm'
  }

  var data_source  = {
        'analytic':[],
        'data_range':range,
        'data_unit':unit,
        'date':[dateContent],
        'date_display':'specified',
        'date_end':'',
        'folding_unit':'',
        'row_type':'chart',
        'source':[
          { 'caption': sensor.sensor_name,
            'chart_type':['line'],
            'merge_type':'sum',
            'preprocess_data':['freq','dwell'],
            'preprocess_type':'hot_area',
            'sources':[
              {
                'extension' :{'peaks':[],'favors':favors},
                'store_id':store.store_id,
                'store_name':store.store_name,
                'sensors':[
                    sensor
                ]
              }
            ]
          }]
  }

  var req = {
    token,
    data_source: JSON.parse(JSON.stringify(data_source)),
    module_id: 0
  };
  return  req;
}

exports.getWidgetHeatmapReq = function(token,range,date,period,store, sensor, favors){
  var d = new Date();
  if(date){
    d = moment(date, 'YYYY/MM/DD').toDate();
  }
  //console.log(date)

  var dateContent
  var unit ;
  if( range == 'ww'){
    ran = 'dd'
    unit = 'dd'
    var dif = d.getDay() || 7 ;
    //console.log(d.getDate() -dif +1 + period)
    d.setDate(d.getDate() -dif +1 + period);
    dateContent = moment(d).format('YYYY/MM/DD');
    dateContent = dateContent + ' 0:00:01'
  }
  else if( range == 'mm'){
    ran = 'ww'
    unit = 'ww'
    d.setDate(1 + 7 * period);
    dateContent = moment(d).format('YYYY/MM/DD');
    dateContent = dateContent + ' 0:00:01'
  }
  else if( range == 'dd'){
    ran = 'hh'
    unit = 'hh'
    dateContent = moment(d).format('YYYY/MM/DD');
    dateContent = dateContent + ' ' + (period + 7) + ':00:01'
  }
  else if( range == 'yyyy'){
    ran = 'mm'
    unit = 'mm'
    d.setMonth( period );
    dateContent = moment(d).format('YYYY/MM/DD');
    dateContent = dateContent + ' 0:00:01'
  }


  var data_source  = {
        'analytic':[],
        'data_range':ran,
        'data_unit':unit,
        'date':[dateContent],
        'date_display':'specified',
        'date_end':'',
        'folding_unit':'',
        'row_type':'picture',
        'source':[
          { 'caption': sensor.sensor_name,
            'chart_type':['picture'],
            'merge_type':'sum',
            'preprocess_data':['overlay'],
            'preprocess_type':'hot_area',
            'sources':[
              {
                'extension' :{'peaks':[],'favors':favors},
                'store_id':store.store_id,
                'store_name':store.store_name,
                'sensors':[
                    sensor
                ]
              }
            ]
          }]
  }

  var req = {
    token,
    data_source: JSON.parse(JSON.stringify(data_source)),
    module_id: 0
  };
  return  req;
}

exports.getWidgetHeatmapBackgroundReq = function(token,store, sensor){
  var d = new Date();
  var date = moment(d).format('YYYY/MM/DD');

  var data_source  = {
        'analytic':[],
        'data_range':'ww',
        'data_unit':'ww',
        'date':[date],
        'date_display':'today',
        'date_end':'',
        'folding_unit':'',
        'row_type':'picture',
        'source':[
          { 'caption': sensor.sensor_name,
            'chart_type':['picture'],
            'merge_type':'sum',
            'preprocess_data':['background'],
            'preprocess_type':'hot_area',
            'sources':[
              {
                'store_id':store.store_id,
                'store_name':store.store_name,
                'sensors':[
                    sensor
                ]
              }
            ]
          }]
  }

  var req = {
    token,
    data_source: JSON.parse(JSON.stringify(data_source)),
    module_id: 0
  };
  return  req;
}

exports.getDateStartEnd = function(date, range){
  var  list = [];
  var d = new Date();
  if(date){
    d = moment(date, 'YYYY/MM/DD').toDate();
  }
  if( range == 'dd'){
      var dateContent = moment(d).format('YYYY/MM/DD');
      list.push(dateContent)
      list.push(dateContent)
  }
  else if( range == 'ww'){
      var dif = d.getDay() || 7 ;
      d.setDate(d.getDate() -dif +1);
      var startDate =  moment(d).format('YYYY/MM/DD');
      d.setDate(d.getDate() +6)
      var endDate =  moment(d).format('YYYY/MM/DD');
      list.push(startDate)
      list.push(endDate)
  }
  else if( range == 'mm'){
    d.setDate(1);
    var startDate =  moment(d).format('YYYY/MM/DD');
    d.setMonth(d.getMonth()+1)
    d.setDate(-1);
    var endDate =  moment(d).format('YYYY/MM/DD');
    list.push(startDate)
    list.push(endDate)
  }

  return  list;
}
