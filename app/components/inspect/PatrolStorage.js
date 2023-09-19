import UserPojo from "../../entities/UserPojo";
import store from "../../../mobx/Store";
const Realm = require('realm');

export default class PatrolStorage {
    static maxCacheTime = 30*86400*1000;

    static init(){
        this.TABLE_NAME = 'inspection';
        this.TABLE_SCHEMA = {
            name: this.TABLE_NAME,
            primaryKey: 'uuid',
            properties: {
                uuid: {type: 'string'},
                ts: {type:'double'},
                mode: {type: 'int'},
                userId: {type: 'string'},
                accountId: {type: 'string'},
                storeName: {type: 'string'},
                tagName: {type: 'string'},
                autoState: {type: 'string', default: ''},
                manualState: {type: 'string', default: ''},
                isMysteryModeOn: {type: 'string'}
            }
        };

        this.PATH = Realm.defaultPath.substr(0, Realm.defaultPath.lastIndexOf('/')) + '/inspection.realm';
        this.REALM = {
            path: this.PATH,
            schema: [this.TABLE_SCHEMA]
        }
    }

    static save(data){
        data.isMysteryModeOn = store.userSelector.isMysteryModeOn.toString();
        try {
            let query = this.get(data.uuid);
            if (query == null) {
                let realm = new Realm(this.REALM);
                realm.write(() => {
                    data.ts = new Date().getTime();
                    data.userId = UserPojo.getUserId();
                    data.accountId = UserPojo.getAccountId();

                    realm.create(this.TABLE_NAME, data,true);
                });
            }else {
                let realm = new Realm(this.REALM);
                realm.write(() => {
                    query.ts = new Date().getTime();
                    query.autoState = data.autoState;
                    query.manualState = (data.manualState !== '') ? data.manualState : query.manualState;
                });
            }
        }
        catch (e) {
        }
    }

    static getAutoCache(){
        let realm = new Realm(this.REALM);
        return realm.objects(this.TABLE_NAME).filtered('userId = $0 and accountId = $1 and manualState = $2 and isMysteryModeOn = $3',
            UserPojo.getUserId(), UserPojo.getAccountId(), '', store.userSelector.isMysteryModeOn.toString());
    }

    static getManualCaches(){
        let realm = new Realm(this.REALM);
        return realm.objects(this.TABLE_NAME).filtered('userId = $0 and accountId = $1 and autoState = $2 and isMysteryModeOn = $3',
            UserPojo.getUserId(), UserPojo.getAccountId(), '', store.userSelector.isMysteryModeOn.toString());
    }

    static getCacheByName(name){
        let realm = new Realm(this.REALM);
        return realm.objects(this.TABLE_NAME).filtered('userId = $0 and accountId = $1 and autoState = $2 and storeName = $3 and isMysteryModeOn = $4',
            UserPojo.getUserId(), UserPojo.getAccountId(), '', name, store.userSelector.isMysteryModeOn.toString());
    }

    static get(id){
        let realm = new Realm(this.REALM);
        let data = realm.objects(this.TABLE_NAME).filtered('uuid = $0', id);
        return !this.isEmpty(data) ? data[0] : null;
    }

    static getAll(){
        let realm = new Realm(this.REALM);
        return realm.objects(this.TABLE_NAME);
    }

    static delete(id){
        let realm = new Realm(this.REALM);
        let data = realm.objects(this.TABLE_NAME).filtered('uuid = $0', id);
        !this.isEmpty(data) && realm.write(() => {
            realm.delete(data);
        });
    }

    static deleteAll(){
        let realm = new Realm(this.REALM);
        let data = realm.objects(this.TABLE_NAME).filtered('userId = $0',UserPojo.getUserId());
        !this.isEmpty(data) && realm.write(() => {
            realm.delete(data);
        });
    }

    static flush(data){
        if ((data.autoState !== '') && (data.manualState !== '')) {
            let realm = new Realm(this.REALM);
            realm.write(() => {
                data.manualState = data.autoState;
                data.autoState = '';
            });
        }
    }

    static flushState(isManual,data,value){
        let realm = new Realm(this.REALM);
        realm.write(() => {
            if (isManual){
                data.manualState = value;
            }
            else{
                data.autoState = value;
            }
        });
    }

    static abandon(id){
        let query = this.get(id);
        if (query != null) {
            let realm = new Realm(this.REALM);
            realm.write(() => {
                if (query.manualState === '') {
                    realm.delete(query);
                }else{
                    query.autoState = '';
                }
            });
        }
    }

    static clear(){
        let offsetTime = new Date().getTime() - this.maxCacheTime;
        let realm = new Realm(this.REALM);
        let data = realm.objects(this.TABLE_NAME).filtered('ts < $0', offsetTime);
        !this.isEmpty(data) && realm.write(() => {
            realm.delete(data);
        });
    }

    static isEmpty(data){
        return (JSON.stringify(data) === '{}');
    }

    static parseState(data){
        return (data.autoState !== '') ? JSON.parse(data.autoState) : (data.manualState ? JSON.parse(data.manualState) : {});
    }
}
