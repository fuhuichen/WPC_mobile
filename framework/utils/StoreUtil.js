//import UserPojo from "../entities/UserPojo";
const Realm = require('realm');
//import store from "../../mobx/Store";
export default class StoreUtil{

    static init(){
        this.tableName = 'ccmIQMINotificationTable';
        this.MessageSchema = {
            name: this.tableName,
            primaryKey: 'event_id',
            properties: {
                product_name:{type: 'string', default: 'system'},
                acc_id:{type: 'string', default: ''},
                event_id: {type: 'string', default: ""},
                notify: {type: 'string', default: ""},
                service_name: {type: 'string', default: ""},
                stores: {type: 'string', default: ""},
                sources: {type: 'string', default: ""},
                date: {type: 'string', default: ""},
                ts:{type: 'double', default: 0},
                read:{type: 'bool', default: false},
            }
        };
    }

    static save(data){
        console.log("Store Util save" +data.length)
        try {
            let realm = new Realm({schema: [this.MessageSchema]});
            realm.write(() => {
                data.forEach((item,index)=>{
                    if(item.ts)item.ts = parseInt(item.ts)
                    realm.create(this.tableName, item,true);
                });
            })
        }
        catch (e) {
          console.log("Save item fail"+e)
        }
    }
    static getSrpType(srpType ){
        let realm = new Realm({schema: [this.MessageSchema]});
        let result = realm.objects(this.tableName).filtered('product_name= $0 and acc_id = $1',srpType,accountId);
        return result;
    }
    static getEventId(event_id){
        let realm = new Realm({schema: [this.MessageSchema]});
        let result = realm.objects(this.tableName).filtered('event_id = $0',event_id);
        return result;
    }

    static deleteMessage(event_id){
        let realm = new Realm({schema: [this.MessageSchema]});
        let result = realm.objects(this.tableName).filtered('event_id = $0',event_id);
        realm.write(() => {
            realm.delete(result);
        });
        return true;
    }

    static deleteAll(){
        let realm = new Realm({schema: [this.MessageSchema]});
        let result = realm.objects(this.tableName).filtered();
        realm.write(() => {
            realm.delete(result);
        });
        return true;
    }
    static clear(){
        console.log("StoreUtil deleteAll")
        console.log(this.MessageSchema)
        let realm = new Realm({schema: [this.MessageSchema]});
        let result = realm.objects(this.tableName);
        realm.write(() => {
            realm.delete(result);
        });
        return true;
    }

    static getAll(accountId){
        console.log("Get ALl")
        let realm = new Realm({schema: [this.MessageSchema]});
  //      console.log("Table Name "+this.tableName)
  //      console.log(this.MessageSchema)
        let result = realm.objects(this.tableName).filtered('acc_id = $0',accountId);
        console.log(result.length)
        return result;
    }

    static getType(messageType,accountId){
    //    console.log("To get type",accountId, messageType);
        let realm = new Realm({schema: [this.MessageSchema]});
        let result = realm.objects(this.tableName).filtered('acc_id = $0',accountId);
        console.log(result)
        return result;
    }

    static getSize(accountId){
        let realm = new Realm({schema: [this.MessageSchema]});
        let result = realm.objects(this.tableName).filtered('acc_id = $0 and read = $1',accountId, false);
        return result.length;
    }

    static refresh(accountId){
        let minTime = new Date().getTime()/1000 -86400*31;
        console.log("Refresh Min time="+ minTime)
        let realm = new Realm({schema: [this.MessageSchema]});
        let oldResults = realm.objects(this.tableName).filtered('ts < $0',minTime);
        console.log("Refresh Len-"+oldResults.length)
      //  realm.write(() => {
      //    realm.delete(oldResults);
    // });
    }
}
