import React, {Component} from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    DeviceEventEmitter,
    Platform,
    BackHandler
} from 'react-native';
import {Actions} from 'react-native-router-flux';
import I18n from 'react-native-i18n';
import NavBarPanel from "../components/NavBarPanel";
import store from "../../data/src/stores/Index";
import {inject, observer} from "mobx-react";

@inject('store')
@observer
export default class RegisterResult extends Component {
    constructor(props){
        super(props);

    }

    componentDidMount(){
        if (Platform.OS === 'android') {
            BackHandler.addEventListener('hardwareBackPress', this.onBackAndroid);
        }
    }

    async componentWillUnmount(){
        if (Platform.OS === 'android') {
            BackHandler.removeEventListener('hardwareBackPress', this.onBackAndroid);
        }
    }

    onBackAndroid = () => {
        this.onCancel();
        return true;
    }

    onCancel(){
        if (this.props.result){
            let popScreen = store.visitSelector.popScreen;
            let message = popScreen ? 'onRefreshVisitor' : 'onRefreshCustomer';
            DeviceEventEmitter.emit(message);
            Actions.popTo('visitorPage');
        }
        else {
            Actions.pop();
        }
    }

    render() {
        return (
            <View style={styles.container}>
                <NavBarPanel title={this.props.title} confirmText={''} onCancel={()=>{this.onCancel();}}/>
                <View style={styles.imagePanel}>
                    <Image style={styles.imageIcon} source={this.props.result ? require('../assets/images/img_submit_success.png'):require('../assets/images/img_submit_failture.png')}></Image>
                </View>
                <Text style={styles.submitText}>{this.props.title}</Text>
                {
                    this.props.result ? null:
                        <TouchableOpacity activeOpacity={0.5} onPress={()=>{Actions.pop();}}>
                            <View style={styles.backPanel}>
                                <Text style={styles.backText}>{I18n.t('Retry Again')}</Text>
                            </View>
                        </TouchableOpacity>
                }
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff'
    },
    NavBarPanel: {
        flexDirection: 'row',
        height: 48,
        backgroundColor: '#24293d',
        alignItems: 'center',
    },
    imagePanel:{
        height: 140,
        backgroundColor: '#ffffff',
        alignItems: 'center'
    },
    imageIcon: {
        width: 100,
        height: 100,
        marginTop: 40
    },
    submitText: {
        fontSize: 18,
        color: '#dcdcdc',
        textAlign: 'center'
    },
    backPanel:{
        width: 130,
        height: 46,
        backgroundColor: '#fb4c5c',
        alignItems: 'center',
        borderRadius: 10,
        marginTop: 20,
        alignSelf: 'center'
    },
    backText:{
        fontSize: 14,
        color: '#ffffff',
        textAlign: 'center',
        height: 46,
        textAlignVertical:'center',
        lineHeight: 46
    }
});
