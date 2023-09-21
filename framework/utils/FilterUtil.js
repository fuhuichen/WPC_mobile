import moment from 'moment'

export default class FilterUtil{

    static getStoreOptions(stores,region1List,region2List){
      let r1List =[]
      let r2List = {}
      let storeList = {};

      for(var k in stores){

          let rg1 = stores[k].contact.zone_1;
          let rg2 = stores[k].contact.zone_2;
          let id = stores[k].branch_id;
          if(!r1List.find(p=>p==rg1)){
            r1List.push(rg1);
          }
          if(region1List==null || region1List.find(p=>p==rg1)){
            if( !r2List[rg1] ){
              r2List[rg1] = []
            }
            if(!r2List[rg1].find(p=>p.id == rg2)){
              r2List[rg1].push({label:rg2,id:rg2})
            }
            if(region2List==null || region2List.find(p=>p==rg2)){
              if( !storeList[rg1] ){
                storeList[rg1]  = {}
              }
              if(!storeList[rg1][rg2]){
                storeList[rg1][rg2] = []
              }
              if(!storeList[rg1][rg2].find(p=>p.id == id )){
                storeList[rg1][rg2].push({label:stores[k].branch_name,id:stores[k].branch_id})
              }
            }
          }
      }
      return {
        region1:r1List,
        region2:r2List,
        stores:storeList,
      }
    }
    static getDataRetrieve(datas,start,mode,type,time_zone){
      let data=[];
      let status  =[];
      let label = [];
      let startTS = Math.round( new Date(start).getTime()/1000)
      //startTS = startTS - startTS%86400;
      //console.log("Filter start ts = " +startTS)
      let timeList = []
      if(mode == 1){
        for(var k =0;k<6;k++){
          let t = startTS + 3600*4*k
          timeList.push(t)
          data.push(-9999)
          label.push(moment(t*1000).format("HH:mm"))
          status.push(-9999)
        }
      }
      else if(mode == 2){
        for(var k =0;k<3;k++){
          let t = startTS + 86400*k
          timeList.push(t)
          data.push(-9999)
          label.push(moment(t*1000).format("MM/DD"))
          status.push(-9999)
        }
      }
      else if(mode == 3){
        for(var k =0;k<7;k++){
          let t = startTS + 86400*k
          timeList.push(t)
          data.push(-9999)
          label.push(moment(t*1000).format("MM/DD"))
          status.push(-9999)
        }
      }
      let index = 0;
      let tzshift = parseInt(time_zone.replace("+",""))*3600
      //console.log("TImezone shift="+tzshift)
      datas.forEach((d, i) => {
          let dataTS = d.timestamp- tzshift;
          //console.log(dataTS)

          if( dataTS > timeList[index]){
            if(data[index] == -9999){
                //console.log("Add value="+ d.value[type])
                data[index] = d.value[type];
                status[index] =d.value_status[type]
            }
            index = index+1;
          }
          //console.log(d.value[ev.monitor_rule.item])
          /*
          let timestamp = d.timestamp - parseInt(event.time_zone.replace("+",""))*3600
          ev.data.push(d.value[ev.monitor_rule.item]);
          ev.status.push(d.value_status[ev.monitor_rule.item]);
      //    console.log(item.timestamp+ " vs " + et + " vs " )
          ev.label.push(moment(d.timestamp*1000).utc().format("HH:mm"))
          //  console.log(i+ " " +timestamp +"/"+et)
          if(!init && timestamp >evtt){
             init = true;
             index = i;
          }
          */
      });
      return {data,label,status}
    }
      static getDateRange(start,end,mode){
        console.log(start)
        console.log(end)
        let s = moment(new Date(start)).format("YYYY/MM/DD")
        let e = end!=null? moment(new Date(end)).format("YYYY/MM/DD"):s
        console.log(s,e)
        if(s == e){
          return moment(new Date(start)).format("YYYY/MM/DD");
        }
        else {
          console.log("Rangr")
          return s + " ~ " + e;
        }
      }

}
