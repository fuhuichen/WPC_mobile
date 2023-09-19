import { observable, action } from 'mobx'
import I18n from 'react-native-i18n';
import store from "./Store";


class StoreSelector {
    @observable storeType = store.enumSelector.storeType;
    @observable screen = '';

    @observable visible = false;
    @observable collection = null;

    @observable select = null;

    @observable tempReportStore = null;
    @observable storeList = null;
    @observable tempReportStoreBI = null;
    @observable storeListBI = null;
    @observable catchStore = {
        country:'',
        province:'',
        city:''
    };
    @observable catchEventStore = {
        country:'',
        province:''
    };

    @observable catchApproveStore = {
        country:'',
        province:''
    };
    @observable catchRecordStore = {
        country:'',
        province:'',
        city:''
    };


    @observable basicList = [];
    @observable storeType = null;
    @observable storeGroup = null;
    @observable inspectTable = null;

    @action
    setStoreList (storeList) {
        this.storeList = storeList;
    }

    @action
    setStore(store){
        this.store = store;
    }

    @action
    setTempReportStore(store){
        this.tempReportStore = store;
    }

    @action
    setStoreListBI (storeList) {
        this.storeListBI = storeList;
    }
    @action
    setTempReportStoreBI(store){
        this.tempReportStoreBI = store;
    }
}

export default new StoreSelector()
