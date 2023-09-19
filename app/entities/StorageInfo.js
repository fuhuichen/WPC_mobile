/**
 * Aliyun storage information.
 */

export default class StorageInfo{
    static endPoint = ''
    static accessKeyId = ''
    static accessKeySecret =  ''
    static bucketName = ''
    static vendor = 1    //1 -aliyun  2-azure

    static setInfo(data){
        this.endPoint = data.ossEndPoint;
        this.accessKeyId = data.ossAccessKeyId;
        this.accessKeySecret = data.ossAccessKeySecret;
        this.bucketName = data.ossBucketName;
        this.vendor = data.ossVendor;
    }

    static getEndPoint(){
        return this.endPoint;
    }

    static getAccessId(){
        return this.accessKeyId;
    }

    static getAccessSecret(){
        return this.accessKeySecret;
    }

    static getBucketName(){
        return this.bucketName;
    }

    static getVendor(){
        return this.vendor;
    }
}
