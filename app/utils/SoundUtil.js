import Sound from "react-native-sound";
import {AudioUtils} from "react-native-audio";

export default class SoundUtil {

    constructor() {
        this.soundPlayer = null;
    }

    static stop(){
        if (this.soundPlayer) {
            this.soundPlayer.release();
            this.soundPlayer = null;
        }
    }

    static play(path){
        try {
            this.stop();
            this.soundPlayer = new Sound(path, null, (error) => {
                if (!error) {
                    if(this.soundPlayer){
                        this.soundPlayer.play((success) => {
                            this.stop();
                        });
                    }
                }
            })
        }
        catch (e) {
            console.log(e);
        }
    }

    static checkPath(path){
        let reg = new RegExp("^http");
        if (reg.test(path)) {
            return true;
        }
        else {
            reg = new RegExp("^"+AudioUtils.DocumentDirectoryPath);
            if (reg.test(path)){
                return true;
            }
            else {
                return false;
            }
        }
    }
}
