import { observable, action } from 'mobx'

class NetInfoSelector {
    @observable offline = false;

    @action
    setOffline (value) {
        this.offline = value;
    }
}

export default new NetInfoSelector()
