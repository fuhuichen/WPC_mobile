import { observable, action } from 'mobx';
import store from "./Store";


class NotifySelector {
    @observable type = store.enumSelector.notifyType.EVENT;
    @observable active = false;
}

export default new NotifySelector()
