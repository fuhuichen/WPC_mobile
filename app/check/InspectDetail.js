import React, {Component} from 'react';
import {
    DeviceEventEmitter,
    Dimensions,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import ModalBox from 'react-native-modalbox';
import I18n from 'react-native-i18n';
import {EMITTER_MODAL_CLOSE} from "../common/Constant";

let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');
export default class InspectDetail extends Component {
    constructor(props){
        super(props);

        this.state = {
            subject: '',
            description: ''
        }
    }

    componentWillMount(){
        this.notifyEmitter = DeviceEventEmitter.addListener(EMITTER_MODAL_CLOSE,
            ()=>{
                this.close();
            });
    }

    componentWillUnmount(){
        this.notifyEmitter && this.notifyEmitter.remove();
    }

    open(subject,description){
        this.setState({subject,description});
        this.refs.modalBox.open();
    }

    close(){
        this.refs.modalBox.close();
    }

    render() {
        return (
            <ModalBox style={styles.modalBox} ref={"modalBox"} position={"center"}
                      isDisabled={false}
                      swipeToClose={false}
                      backdropPressToClose={false}
                      backButtonClose={true}
                      coverScreen={true}>

                <View style={styles.headerPanel}>
                    <Text style={styles.headerTitle}>{I18n.t('Inspection details')}</Text>
                    <TouchableOpacity activeOpacity={0.5} onPress={this.close.bind(this)}>
                        <Image style={styles.closeIcon} source={require('../assets/images/img_detail_close.png')}/>
                    </TouchableOpacity>
                </View>
                <View style={{height:1,backgroundColor:'#f5f5f5'}}/>

                <ScrollView style={styles.contentPanel}
                            showsVerticalScrollIndicator={true}
                            keyboardShouldPersistTaps={'handled'}>
                    <Text style={styles.subject}>{this.state.subject}</Text>
                    <Text style={styles.description}>{this.state.description === '' ? I18n.t('No detail')
                        : this.state.description}</Text>
                </ScrollView>
            </ModalBox>
        )
    }
}

const styles = StyleSheet.create({
    modalBox: {
        width: 320,
        height: height*0.618,
        borderRadius:3
    },
    headerPanel:{
        flexDirection:'row',
        justifyContent: 'center',
        height:56
    },
    headerTitle:{
        textAlign: 'center',
        textAlignVertical:'center',
        fontSize: 18,
        color: '#19293b',
        height:56,
        width: 320-36-16,
        marginLeft:16,
        alignSelf: 'center',
        ...Platform.select({
            ios:{
                lineHeight:56
            }
        })
    },
    closeIcon:{
        width: 16,
        height: 16,
        marginTop: 12
    },
    contentPanel:{
        marginLeft: 32,
        marginRight: 22,
        paddingRight: 10,
        marginTop: 28,
        marginBottom: 28
    },
    subject:{
        fontSize: 14,
        color: '#232324',
        fontWeight: 'bold'
    },
    description:{
        marginTop: 12,
        fontSize: 12,
        color: '#19293b'
    }
});
