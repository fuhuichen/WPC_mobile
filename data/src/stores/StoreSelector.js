import { observable, action } from 'mobx'

class StoreSelector {
    @observable storeList = [{id: 0, name: "三民", type: "Hyper", subtype: "TNR"},
        {id: 1, name: "土城", type: "Hyper", subtype: "TNR"},
        {id: 2, name: "文心", type: "Hyper", subtype: "TSR"},
        {id: 3, name: "斗六", type: "Hyper", subtype: "TSR"},
        {id: 4, name: "北大", type: "Hyper", subtype: "CR"},
        {id: 5, name: "北投", type: "Hyper", subtype: "CR"},
        {id: 6, name: "台東", type: "Hyper", subtype: "SR"},
        {id: 7, name: "天母", type: "Hyper", subtype: "SR"},
        {id: 8, name: "三民建工", type: "Supermarket", subtype: "Taipei1"},
        {id: 9, name: "土城福益", type: "Supermarket", subtype: "Taipei1"},
        {id: 10, name: "大里內新", type: "Supermarket", subtype: "Taipei2"},
        {id: 11, name: "台北濟南", type: "Supermarket", subtype: "Taipei2"},
        {id: 12, name: "員林大同", type: "Supermarket", subtype: "CR1"},
        {id: 13, name: "台中興安", type: "Supermarket", subtype: "CR2"},
        {id: 14, name: "麻豆中山", type: "Supermarket", subtype: "Tainan"},
        {id: 15, name: "高雄小港", type: "Supermarket", subtype: "SR"}];

    @observable storeBI = '全部门店';
    @observable tempReportStoreBI = null;

    @action
    setStoreListBI (storeList) {
        this.storeList = storeList;
    }

    @action
    setStore(store){
        this.store = store;
    }

    @action
    setTempReportStoreBI(store){
        this.tempReportStore = store;
    }
}

export default new StoreSelector()