import PicBase64Util from "./PicBase64Util";
import ImageEditor from "@react-native-community/image-editor";

let faceScale = 1.3;
let checkAngle = 30;
let checkSize = 60;

export default class FaceUtil{

    static setParam(api_key,api_secret){
        this.api_key = api_key;
        this.api_secret = api_secret;
    }

    static getApiResult(){
        return this.faces;
    }

    static async getFace(uri,base64,oriHeight,oriWidth) {
        try {
            this.faces = [];
            let formdata = new FormData();
            formdata.append('api_key', this.api_key);
            formdata.append('api_secret', this.api_secret);
            formdata.append('image_base64', PicBase64Util.getJPGString(base64));
            formdata.append('return_attributes', 'headpose');
            let response = await fetch('https://api-cn.faceplusplus.com/facepp/v3/detect', {method: 'POST', body: formdata});
            let responseJson = await response.json();
            //console.log(JSON.stringify(responseJson));
            if (responseJson.error_message != null) {
                return false;
            }
            else {
                if (responseJson.face_num > 0) {
                    for (let item of responseJson.faces) {
                        let cropData = {};
                        if(     item.attributes.headpose.roll_angle >= checkAngle*(-1)
                            &&  item.attributes.headpose.roll_angle <= checkAngle
                            &&  item.attributes.headpose.pitch_angle >= checkAngle*(-1)
                            &&  item.attributes.headpose.pitch_angle <= checkAngle
                            &&  item.attributes.headpose.yaw_angle >= checkAngle*(-1)
                            &&  item.attributes.headpose.yaw_angle <= checkAngle
                            &&  item.face_rectangle.width >= checkSize
                        ) {
                            let offset = {};
                            let x = item.face_rectangle.left - ((faceScale - 1) / 2) * item.face_rectangle.height;
                            let y = item.face_rectangle.top - ((faceScale - 1) / 2 ) * item.face_rectangle.width;
                            offset.x = x > 0 ? x: 0;
                            offset.y = y > 0 ? y: 0;
                            cropData.offset = offset;

                            let size = {};
                            let width = item.face_rectangle.width * faceScale;
                            let height = item.face_rectangle.height * faceScale;
                            let maxWidth = oriWidth - offset.x;
                            let maxHeight = oriHeight - offset.y;
                            size.width = width > maxWidth ? maxWidth : width;
                            size.height = height > maxHeight ? maxHeight: height;
                            cropData.size = size;

                            let displaySize = {};
                            displaySize.width = 200;
                            displaySize.height = 200;
                            cropData.displaySize = displaySize;

                            let croppedURI = await ImageEditor.cropImage(uri, cropData);
                            if (croppedURI) {
                                this.faces.push(croppedURI);
                            }
                        }
                    }
                }
                return true;
            }
        }
        catch (error) {
            return false;
        }
    }
}
