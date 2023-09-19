import { observable, action } from 'mobx'

class NetInfoSelector {
    @observable offline = false;
}

export default new NetInfoSelector()
