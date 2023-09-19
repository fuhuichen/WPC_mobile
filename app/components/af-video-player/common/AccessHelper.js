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
        if(this.data.length == 0){
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

    static enablePatrolTask(){
        return this.enableAuthorities(1,0x0,0x8);
    }

    static enableTransactionPatrol(){
        return this.enableAuthorities(1,0x0,0x20);
    }

    static enableVisitor(){
        return this.enableAuthorities(1,0x0,0x80);
    }

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

    static enableStatistics(){
        return this.enableReportStatistics() || this.enableEventStatistics();
    }

    static enableReportStatistics(){
        return this.enableAuthorities(0, 0x0,0x1);
    }

    static enableEventStatistics(){
        return this.enableAuthorities(0, 0x0,0x2);
    }

    static enableVideoLicense(){
        return this.enableAuthorities(5, 0x0,0x1);
    }
}
