import { observable, action } from 'mobx'

class UserSelector {
    @observable LoginInfo = null;
    @observable Token = '';
    @observable UserId = '';
    @observable accountList = [];
    @observable accountId = '';
    @observable accountIndex = 0;
    @observable roleId = -1;
    @observable serviceIndex = -1;
    @observable openDrawer = false;
    @observable backDrawer = false;
    @observable enableVisitor = false;
    @observable email = '';
    @observable password = '';
    @observable isMysteryMode = false;
    @observable isMysteryModeOn = false;
    @observable isWaterPrintOn = false;

    @observable services = [];
    @observable userList = null;
    @observable userPosition = null;
    
    @observable launcherSelectTab = '';
    @observable approveType = '';
    @observable scheduleType = '';

    @action
    setUserInfo(userInfo) {
        this.userInfo = userInfo;
    }

}

export default new UserSelector()
