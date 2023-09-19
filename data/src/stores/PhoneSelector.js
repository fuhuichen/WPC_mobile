import { observable, action } from 'mobx'

class PhoneSelector {
    @observable smallPhone = false;

    @action
    setSmallPhone (value) {
        this.smallPhone = value;
    }
}

export default new PhoneSelector()