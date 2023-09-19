var Uint64BE = require("int64-buffer").Uint64BE;

export default class AccessHelper {
    /**
     * index(0) => ID(1): Overview
     * index(1) => ID(2): Inspection
     * index(2) => ID(4): Event
     * index(3) => ID(8): Statistics
     * index(4) => ID(16): Settings
     */
    static data = [];

    static setData(data){
        this.data = data;
    }

    static enableAuthorities(index,bigEndian,littleEndian){
        if(this.data.length == 0 || index > this.data.length - 1){
            return false;
        }

        let authority = new Uint64BE(this.data[index].toString()).toString(10);
        let base = new Uint64BE(bigEndian,littleEndian).toString(10);

        return authority&base;
    }

    static enableLocalInspect(){
       return this.enableAuthorities(1,0x0,0x2);
    }

    static enableRemoteInspect(){
        return this.enableAuthorities(1,0x0,0x1);
    }

    static enableInspectReport(){
        return this.enableAuthorities(1,0x0,0x4);
    }

    static enablePatrolTask(){
        return this.enableAuthorities(1,0x0,0x8);
    }

    static enableStoreMonitor() {
      return this.enableAuthorities(1, 0x0, 0x10);
    }

    static enableTransactionPatrol(){
        return this.enableAuthorities(1,0x0,0x20);
    }

    static enableVisitor(){
        return this.enableAuthorities(1,0x0,0x80);
    }

  // index(2) => ID(4): Event
    static enableEventHandle(){
        return this.enableAuthorities(2,0x0,0x1);
    }

    static enableEventAdd(){
        return this.enableAuthorities(2,0x0,0x4);
    }

    static enableEventClose(){
        return this.enableAuthorities(2,0x0,0x2);
    }

    static enableEventReject(){
        return this.enableAuthorities(2,0x0,0x8);
    }

    // index(3) => ID(8): Statistics
    static enablePatrolEvaStatistics() {
      return this.enableAuthorities(3, 0x0, 0x1);
    }
  
    static enableInspectStatistics() {
      return this.enableAuthorities(3, 0x0, 0x2);
    }
  
    static enableEventStatistics() {
      return this.enableAuthorities(3, 0x0, 0x4);
    }
  
    static enableSupervisionEffStatistics() {
      return this.enableAuthorities(3, 0x0, 0x8);
    }
  
    static enableSingleStoreStatStatistics() {
      return this.enableAuthorities(3, 0x0, 0x10);
    }

    static enableAppraisalCompareStatistics() {
      return this.enableAuthorities(3, 0x0, 0x20);
    }

    /*static enableStatistics(){
        return this.enableReportStatistics() || this.enableEventStatistics();
    }

    static enableReportStatistics(){
        return this.enableAuthorities(0, 0x0,0x1);
    }

    static enableEventStatistics(){
        return this.enableAuthorities(0, 0x0,0x2);
    }*/

    static enableVideoLicense(){
        return this.enableAuthorities(5, 0x0,0x1);
    }

    // 送出簽核
    static enableSendAudit() {
        return this.enableAuthorities(6, 0x0, 0x01);
    }

    // 待簽核
    static enableWaitAudit() {
        return this.enableAuthorities(6, 0x0, 0x02);
    }

    //副本通知
    static enableTranscriptNotify() {
        return this.enableAuthorities(6, 0x0, 0x04);
    }

    // 排程設定
    static enableScheduleSetting() {
        return this.enableAuthorities(7, 0x0, 0x01);
    }

    // 排程記錄
    static enableScheduleHistory() {
        return this.enableAuthorities(7, 0x0, 0x02);
    }

    // 排程執行
    static enableSchedule() {
        return this.enableAuthorities(7, 0x0, 0x04);
    }



    //***********  現金查核權限 ***********//

    // 查核管理 - 表單設定
    static enableFormSetting() {
        return this.enableAuthorities(0, 0x0, 0x01);
    }

    // 查核管理 - 查核設定
    static enableCheckSetting() {
        return this.enableAuthorities(0, 0x0, 0x02);
    }

    // 歷史查核 - 檢視歷史紀錄
    static enableRecordView() {
        return this.enableAuthorities(1, 0x0, 0x01);
    }

    // 系統設定 - 職務管理
    static enableJobSetting() {
        return this.enableAuthorities(2, 0x0, 0x01);
    }
}
