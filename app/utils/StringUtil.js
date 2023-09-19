export default class StringUtil {
    static getByteVal(val, max) {
        var returnValue = '';
        var byteValLen = 0;
        for (var i = 0; i < val.length; i++) {
            if (val[i].match(/[^\x00-\xff]/ig) != null)
                byteValLen += 2;
            else
                byteValLen += 1;
            if (byteValLen > max)
            {
                returnValue += '...';
                break;
            }
            returnValue += val[i];
        }
        return returnValue;
    }
}
