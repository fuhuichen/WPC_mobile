/**
 * Login user information.
 */

export default class UserPojo{
    static userId = ''
    static roleId = ''
    static token =  ''
    static accountId = ''
    static accountIds = [];
    static userName = '';
    static notificationId = '';

    static setUser(data){
        this.userId = (data != null) ? data.userId : "";
        this.roleId = (data != null) ? data.roleId : "";
        this.token = (data != null) ? data.token : "";
    }

    static setAccountId(id){
        this.accountId = id;
    }

    static getToken(){
        return this.token;
    }

    static getUserId(){
        return this.userId;
    }

    static getRoleId(){
        return this.roleId;
    }

    static getAccountId(){
        return this.accountId;
    }

    static setAccountIds(ids){
        this.accountIds = [];
        this.accountIds = this.accountIds.concat(ids);
    }

    static getAccountIds(){
        return this.accountIds;
    }

    static setUserName(userName){
        this.userName = userName;
    }

    static getUserName(){
        return this.userName;
    }

    static setNotificationId(id){
        this.notificationId = id;
    }

    static getNotificationId(id){
        return this.notificationId;
    }

    static isMultiAccount(){
        return this.accountIds.length > 1;
    }

    static isValidAccount(userId,accountId){
        return (this.userId === userId) && (this.getAccountIndex(accountId) !== -1);
    }

    static getAccountIndex(accountId){
        return this.accountIds.findIndex(p=>p.accountId === accountId);
    }

    static isEqualAccount(accountId){
        return accountId === this.accountId;
    }

    static getAccountName(accountId){
        let index = this.getAccountIndex(accountId);
        return (index !== -1) ? this.accountIds[index].name : '';
    }
}
