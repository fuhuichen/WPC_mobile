import validator from 'validator';
export default class StringFilter {

    static lengthFilter(content,count){
        content = content.replace(/(^\s*)/g, "");

        if (content.replace(/[^\x00-\xff]/g, '**').length <= count) {
           return content;
        }

        let result = '';
        for (var i = 0, j = 0; i < content.length; i++) {
            (/[\x00-\xff]/.test(content.charAt(i))) ? j++ : j += 2;

            if (j <= count) {
                result += content.charAt(i);
            } else {
                return result;
            }
        }
    }

    static symbolFilter(content){
        let filters = "";

        let pattern = /[`~!@#$%^&*()_+<>?:"{}=•,.\/;'[\]·！#￥（——）：；“”‘、，|《。》？、【】·’’£€¥\\-]/im;
        if(pattern.test(content)){
            for(let i = 0; i < content.length; i++){
                filters = filters + content.substr(i, 1)
                    .replace(pattern, '');
            }
        }else{
            filters = content;
        }

        return filters;
    }

    static emojiFilter(content){
        content = content.replace(/\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]|[\uD800-\uDBFF]|[\uDC00-\uDFFF]/g, "");
        return content.replace(/[^\u0020-\u007E\u00A0-\u00BE\u2E80-\uA4CF\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFFEF\u0080-\u009F\u2000-\u201f\u2026\u2022\u20ac\r\n]/g, "");
    }

    static emojiFilterEx(content){
        content = content.replace(/\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]|[\uD800-\uDBFF]|[\uDC00-\uDFFF]/g, "");
        return content.replace(/[^\u0020-\u007E\u00A0-\u00BE\u2E80-\uA4CF\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFFEF\u0080-\u009F\u2000-\u201f\u2026\u2022\u20ac\u02c7\u02c9\u02ca\u02cb\u02d9\r\n]/g, "");
    }

    static unicodeFilter(content){
        return content.replace(/[^a-zA-Z0-9,、 \u3400-\u4DB5\u4E00-\u9FEA\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29\u{20000}-\u{2A6D6}\u{2A700}-\u{2B734}\u{2B740}-\u{2B81D}\u{2B820}-\u{2CEA1}\u{2CEB0}-\u{2EBE0}]/ug,'');
    }

    static standard(content,count){
        //let unicodeContent = lib.isAndroid() ? this.unicodeFilter(content) : this.symbolFilter(content);
        //let emojiContent = lib.isAndroid() ? this.emojiFilter(content) : this.emojiFilterEx(content);
        return ((count != null) && !validator.isByteLength(content, {min:0, max:count})) ?
            this.lengthFilter(content,count) : content;
    }

    static all(content,count){
        //let emojiContent = lib.isAndroid() ? this.emojiFilter(content) : this.emojiFilterEx(content);
        return ((count != null) && !validator.isByteLength(content, {min:0, max:count})) ?
            this.lengthFilter(content,count) : content;
    }
}
