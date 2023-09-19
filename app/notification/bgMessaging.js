//import firebase from 'react-native-firebase';
import type { RemoteMessage } from 'react-native-firebase';
//import JMessage from "./JMessage";

export default async (message: RemoteMessage) => {
    console.log('*********************** back message:  '+ JSON.stringify(message.data));
    try {
        let info = message.data.info;
        //JMessage.addMessages(JSON.parse(info));
    }
    catch (e) {
    }
    return Promise.resolve();
}