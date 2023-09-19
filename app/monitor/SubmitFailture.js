import React, {Component} from 'react';
import {Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View,DeviceEventEmitter} from 'react-native';
import {Actions} from 'react-native-router-flux';
import RNStatusBar from '../components/RNStatusBar';
import I18n from 'react-native-i18n';

let {width} =  Dimensions.get('screen');

export default class SubmitFailture extends Component {
    constructor(props){
        super(props);

        this.state = {
            tips: (this.props.tips != null && this.props.tips) ? I18n.t('Abnormal inspection')
                : I18n.t('Sent Retry')
        }
    }

    onRetry(){
        Actions.pop();
    }

    render() {
        return (
            <View style={styles.container}>
                <RNStatusBar/>
                <View style={styles.NavBarPanel}>
                    <Text style={styles.NarBarTitle}>{I18n.t('Sent error')}</Text>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.imagePanel}>
                        <Image style={styles.imageIcon} source={require('../assets/images/img_submit_failture.png')}></Image>
                    </View>
                    <Text style={styles.submitText}>{this.state.tips}</Text>

                    <TouchableOpacity activeOpacity={0.5} onPress={()=>{this.onRetry()}}>
                        <View style={styles.backPanel}>
                            <Text style={styles.backText}>{I18n.t('Retry Again')}</Text>
                        </View>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff'
    },
    NavBarPanel:{
        flexDirection: 'row',
        justifyContent: 'center',
        height: 48,
        backgroundColor: '#24293d',
        alignItems: 'center'
    },
    NarBarTitle: {
        fontSize: 18,
        color: '#ffffff',
        alignSelf: 'center'
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
    promptText:{
        fontSize: 14,
        color: '#19293b',
        textAlign: 'center',
        marginTop: 30
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
