import { observable, action } from 'mobx';
import store from "./Store";


class EventSelector {
    @observable data = [];
    @observable inspect = [];

    @observable collection = null;
    @observable visible = false;
    @observable type = [];
}

export default new EventSelector()
