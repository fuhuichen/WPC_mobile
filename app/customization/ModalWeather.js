import React, {Component} from 'react';
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    Image,
    ScrollView,
    FlatList,
    TouchableOpacity,
    Platform, DeviceEventEmitter
} from "react-native";
import I18n from "react-native-i18n";
import ModalBox from "react-native-modalbox";
import {Actions} from "react-native-router-flux";
import PropTypes from 'prop-types';
import * as lib from '../common/PositionLib';
import {getWeatherList} from "../common/WeatherFilter";
import {Divider} from "react-native-elements";
import PhoneInfo from "../entities/PhoneInfo";

const {width} = Dimensions.get('screen');
export default class ModalWeather extends Component {
    state = {
        selectIndex: 0,
        data: [],
        onCancel: false,
        onConfirm: false
    };

    static propTypes = {
        onSelect: PropTypes.function,
    };

    static defaultProps = {
    };

    async open(){
        const data = getWeatherList();
        if (data.length === 0){
            DeviceEventEmitter.emit('Toast', I18n.t('No inspection'));
            return;
        }

        this.setState({data, selectIndex: 0}, () => {
            this.action = false;
            this.modalBox && this.modalBox.open();
        });
    }

    close(){
        this.setState({onCancel: false});
        this.modalBox && this.modalBox.close();
    }

    confirm(){
        this.action = true;
        this.setState({onConfirm: false});
        this.modalBox && this.modalBox.close();
    }

    onClosed(){
        if (this.action){
            let {data, selectIndex} = this.state;
            if(data[selectIndex]) {
                console.log("onClosed weatherType : ", data[selectIndex].weatherType);
                this.props.onSelect(data[selectIndex].weatherType);
            }
        }
    }

    renderModal = ({ item,index}) => {
        let color = (index === this.state.selectIndex) ? '#404554': '#707070';
        let backColor = (index === this.state.selectIndex) ? '#ECF7FF': null;
        let borderRadius = (index === this.state.selectIndex) ? 4 : 0;
        let borderColor = (index === this.state.selectIndex) ? '#2C90D9' : null;
        let borderWidth = (index === this.state.selectIndex) ? 1 : 0;
        return (
            <TouchableOpacity activeOpacity={1} onPress={() => {this.setState({selectIndex:index});}}>
                <View style={{height:52, backgroundColor: backColor, borderRadius, borderColor, borderWidth, justifyContent:'center'}}>
                    <View style={{flexDirection:'row'}}>
                        <Image source={{uri:item.iconUrl}} style={styles.weather}/>
                        <Text style={{fontSize:16,color:color,marginLeft:16}} numberOfLines={1}>{item.name}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        )
    };

    render() {
        let {onCancel, onConfirm} = this.state, width = 76;
        PhoneInfo.isJALanguage() && (width = 90);

        return (
            <ModalBox style={styles.modalBox} ref={(c)=> this.modalBox = c} position={"center"}
                      isDisabled={false}
                      swipeToClose={false}
                      backdropPressToClose={false}
                      backButtonClose={true}
                      onClosed={() => {this.onClosed()}}
                      coverScreen={true}>
                <View style={styles.headerPanel}>
                    <View style={styles.innerHead}>
                        <Text style={{fontSize: 19, color: '#86888A'}}>{I18n.t('Custom weather')}</Text>
                    </View>
                </View>
                <FlatList style={styles.dataPanel}
                          showsVerticalScrollIndicator={false}
                          data={this.state.data}
                          extraData={this.state}
                          keyExtractor={(item, index) => index.toString()}
                          renderItem={this.renderModal}/>
                <Divider style={styles.divider}/>
                <View style={styles.bottomPanel}>
                    <View style={styles.innerBottom}>
                        <TouchableOpacity onPressOut={() => {this.close()}} onPressIn={() => this.setState({onCancel: true})}>
                            <View style={{width:width,height:36,marginRight:8,borderColor: onCancel ? '#006AB7' : '#FFFFFF',borderWidth:1,
                                marginTop:8,borderRadius:10}}>
                                <Text style={styles.button}>{I18n.t('Cancel')}</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPressOut={() => {this.confirm()}} onPressIn={() => this.setState({onConfirm: true})}>
                            <View style={{width:76,height:36,marginRight:8,borderColor: onConfirm ? '#006AB7' : '#FFFFFF',borderWidth:1,
                                marginTop:8,borderRadius:10}}>
                                <Text style={[styles.button]}>
                                    {I18n.t('Confirm')}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </ModalBox>
        )
    }
}

const styles = StyleSheet.create({
    modalBox: {
        width: width-20,
        ...Platform.select({
            android:{
                height: 368
            },
            ios:{
                height: 386
            }
        }),
        borderRadius:10,
        backgroundColor:'transparent'
    },
    headerPanel:{
        height:71,
        justifyContent: 'center',
        alignItems:'center',
    },
    innerHead:{
        width:width-60,
        height:71,
        justifyContent: 'center',
        alignItems:'center',
        borderTopLeftRadius:10,
        borderTopRightRadius:10,
        backgroundColor:'#F7F9FA'
    },
    bottomPanel:{
        height: 52,
        backgroundColor:'transparent',
        alignItems:'center'
    },
    innerBottom:{
        height: 52,
        width:width-60,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        backgroundColor:'#FFFFFF',
        borderBottomLeftRadius:10,
        borderBottomRightRadius:10
    },
    button:{
        color: '#006AB7',
        height: 36,
        lineHeight:36,
        textAlignVertical: 'center',
        textAlign:'center',
        fontSize:16
    },
    dataPanel:{
        backgroundColor:'#F7F9FA',
        width:width-60,
        marginLeft:20
    },
    divider:{
        backgroundColor:'#EBF1F5',
        width:width-60,
        marginLeft:20,
        height:1,
        borderBottomWidth:0
    },
    weather:{
        width:24,
        height:24,
        alignSelf:'center',
        marginLeft: 27
    }
});
