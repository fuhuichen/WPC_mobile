import { observable, action } from 'mobx'
import store from "./Store";

class CashCheckSelector {
    @observable uuid = null;
    @observable formId = null;
    @observable store = null;
    @observable categoryType = null;
    @observable categories = [];
    @observable rootGroups = [];
    @observable attachments = [];
    @observable signatures = [];
    @observable appViewConfig = null;
    @observable tagName = '';
    @observable status = null;
}

export default new CashCheckSelector()
