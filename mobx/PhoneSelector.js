import { observable} from 'mobx'

class PhoneSelector {
    @observable smallPhone = false;
}

export default new PhoneSelector()