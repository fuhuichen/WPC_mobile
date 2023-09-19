import { observable, action } from 'mobx'

class VisitSelector {
    @observable beginTs = null;
    @observable endTs = null;
    @observable mode = true;
    @observable storeId = '';
    @observable popScreen = null;

    @action
    setBeginTs (value) {
        this.beginTs = value;
    }

    @action
    setEndTs(value) {
        this.endTs = value;
    }

    @action
    setMode (value) {
        this.mode = value;
    }

    @action
    setStoreId(value) {
        this.storeId = value;
    }

    @action
    setPopScreen(value) {
        this.popScreen = value;
    }
}

export default new VisitSelector()
