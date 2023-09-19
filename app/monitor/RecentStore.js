import UserPojo from "../entities/UserPojo";
import {LATEST_STORE} from "../common/Constant";
import store from "react-native-simple-store";

export default class RecentStore {
    static update(storeId){
        let latest = UserPojo.getUserId()+UserPojo.getAccountId()+ LATEST_STORE;
        store.get(latest).then((res)=>{
            if(res != null){
                let index = res.findIndex(p=>p.storeId === storeId);
                (index !== -1) && res.splice(index,1);
                res.push({storeId:storeId});
            }else{
                res = [{storeId:storeId}];
            }

            store.delete(latest).then(()=>{
                store.save(latest,res);
            });
        });
    }
}