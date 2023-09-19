export default class PicBase64Util {

    static getPicString(type,base64){
        return 'data:image/'+ type +';base64,' + base64;
    }

    static getJPGString(base64){
        return this.getPicString('jpg',base64);
    }

    static getJPGSource(base64){
        let source = {};
        source.uri = this.getJPGString(base64);
        return source;
    }
}
