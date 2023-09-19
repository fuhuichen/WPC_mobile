import {Alert} from "react-native";
import I18n from 'react-native-i18n';

export default class AlertUtil {
    constructor(props) {
    }

    static alert(message){
        Alert.alert(
             I18n.t('Tip'),
            I18n.t('Authorize set') + message,
            [{text: I18n.t('Confirm'), onPress: () => {}}],
            { cancelable: false }
        )
    }
}
