import { observable, action } from 'mobx'
import store from "./Store";

class ApproveSelector {
    @observable type = store.enumSelector.approveType.PENDING;
    @observable collection = null;

    @observable screen = 0;
    @observable screenType = {
        MAIN: 0,
        SEARCH: 1,
        NOTIFY: 2
    };
}

export default new ApproveSelector()
