import { observable, action,computed } from 'mobx'

class UserSelector {
    @observable token = null;
    @observable userId = '';
    @observable loginInfo = {email:'',password:''};
    @observable accountList = null;
    @observable accountId = null;
    @observable userInfo = null;

    @action
    setToken (token) {
        this.token = token;
    }

    @action
    setUserId (userId) {
        this.userId = userId;
    }

    @action
    setLoginInfo (loginInfo) {
        this.loginInfo = loginInfo;
    }

    @action
    setAccountList(accountList) {
        this.accountList = accountList;
    }

    @action
    setAccountId(accountId) {
        this.accountId = accountId;
    }

    @action
    setUserInfo(userInfo) {
        this.userInfo = userInfo;
    }
}

export default new UserSelector()