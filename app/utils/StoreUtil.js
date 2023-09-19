import UserPojo from "../entities/UserPojo";
const Realm = require('realm');

export default class StoreUtil{

    static init(){
        this.tableName = 'notification';
        this.MessageSchema = {
            name: this.tableName,
            primaryKey: 'messageId',
            properties: {
                messageId: {type: 'int', default: 0},
                messageType: {type: 'int', default: 0},
                eventId: {type: 'int', default: 0},
                ts:{type: 'double', default: 0},
                accountId: 'string',
                userId:'string',
                content:'string',
                subject:'string',
                extContent:{type: 'string', default: ''},
                read:{type: 'bool', default: false},
            }
        };
    }

    static getRealm() {
        return new Realm({
            schema: [this.MessageSchema],
            schemaVersion: 1,
            migration: (oldRealm, newRealm) => {
                // only apply this change if upgrading to schemaVersion 1
                /*if (oldRealm.schemaVersion < 1) {
                    const oldObjects = oldRealm.objects('schema');
                    const newObjects = newRealm.objects('schema');
        
                    // loop through all objects and set the name property in the new schema
                    for (let i = 0; i < oldObjects.length; i++) {
                        newObjects[i].extContent = '';
                    }
                }*/
            },
        });
    }

    static save(data){
        try {
            let realm = this.getRealm(); //new Realm({schema: [this.MessageSchema]});
            realm.write(() => {
                data.forEach((item,index)=>{
                    realm.create(this.tableName, item,true);
                });
            })
        }
        catch (e) {}
    }

    static getMessageId(messageId){
        let realm = this.getRealm(); //new Realm({schema: [this.MessageSchema]});
        let result = realm.objects(this.tableName).filtered('messageId = $0',messageId);
        return result;
    }

    static deleteMessage(messageId){
        let realm = this.getRealm(); //new Realm({schema: [this.MessageSchema]});
        let result = realm.objects(this.tableName).filtered('messageId = $0',messageId);
        realm.write(() => {
            realm.delete(result);
        });
        return true;
    }

    static deleteAll(){
        let realm = this.getRealm(); //new Realm({schema: [this.MessageSchema]});
        let result = realm.objects(this.tableName).filtered('userId = $0',UserPojo.getUserId());
        realm.write(() => {
            realm.delete(result);
        });
        return true;
    }

    static getAll(){
        let realm = this.getRealm(); //new Realm({schema: [this.MessageSchema]});
        let result = realm.objects(this.tableName).filtered('userId = $0',UserPojo.getUserId());
        return result;
    }

    static getType(messageType){
        let realm = this.getRealm(); //new Realm({schema: [this.MessageSchema]});
        let result = realm.objects(this.tableName).filtered('userId = $0 and messageType = $1',UserPojo.getUserId(), messageType);
        return result;
    }

    static getSize(){
        let realm = this.getRealm(); //new Realm({schema: [this.MessageSchema]});
        let result = realm.objects(this.tableName).filtered('userId = $0 and read = $1',UserPojo.getUserId(), false);
        return result.length;
    }

    static refresh(){
        let minTime = new Date().getTime() -86400*1000*30;
        let realm = this.getRealm(); //new Realm({schema: [this.MessageSchema]});
        let oldResults = realm.objects(this.tableName).filtered('ts < $0',minTime);
        realm.write(() => {
            realm.delete(oldResults);
        });
    }
}
