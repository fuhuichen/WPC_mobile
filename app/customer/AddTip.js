import React, {Component} from 'react';

import {
    BackHandler,
    DeviceEventEmitter, Dimensions,
    Image, Platform, ScrollView,
    StyleSheet, Text,
    TouchableOpacity,
    View,
} from 'react-native';
import WrapBlock from "../components/WrapBlock";
import {Actions} from "react-native-router-flux";
import I18n from "react-native-i18n";
import HttpUtil from "../utils/HttpUtil";
import NavBarPanel from  "../components/NavBarPanel";

const {width} = Dimensions.get('screen');

export default class AddTip extends Component {

    constructor(props) {
        super(props);
        this.state = {
            recTags:[]
        };
    }

    componentDidMount() {
        if (Platform.OS === 'android') {
            BackHandler.addEventListener('hardwareBackPress', this.onBackAndroid);
        }
        HttpUtil.get('customer/common/tags')
            .then(result => {
                this.setState({recTags:result.data});
            })
            .catch(error=>{
            })
    }

    componentWillUnmount(){
        if (Platform.OS === 'android') {
            BackHandler.removeEventListener('hardwareBackPress', this.onBackAndroid);
        }
    }

    onBackAndroid = () => {
        this.onCancel();
        return true;
    };

    onCancel(){
        DeviceEventEmitter.emit('OnTipChange');
        Actions.pop();
    }

    onChange(change){
        if (change.select){
            this.refs.wrapData.addData(change.name);
        }
        else {
            this.refs.wrapData.deleteData(change.name);
        }
    }

    isEqual(a,b){
        if (a === b) {
            return true;
        }
        if (a == null || b == null) {
            return false;
        }
        if (a.length !== b.length) {
            return false;
        }
        for (let i = 0; i < a.length; ++i) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    }

    confirm(){
        let data = this.refs.wrapData.getData();
        if (this.isEqual(data,this.props.tags)){
            this.onCancel();
        }
        else {
            let request = {};
            request.customerId = this.props.customerId;
            request.tags = data;
            HttpUtil.post('customer/tag/update',request)
                .then(result => {
                    DeviceEventEmitter.emit('OnTipChange',{data:data});
                    Actions.pop();
                })
                .catch(error=>{
                    Actions.push('registerResult',{result:false,title:I18n.t('AddTagError')});
                })
        }
    }

    render() {
        let recTag = null;
        if (this.state.recTags.length >0){ recTag = (
            <View>
                <View style={{height: 12, width: width, backgroundColor: '#F7F8FC'}}/>
                <Text style={{marginLeft:18,fontSize:14,color:'#989BA3',marginTop: 10}}>{I18n.t('Recommended tags')}</Text>
                <WrapBlock data={this.state.recTags} editable={false} selectable={true} onSelectChange={this.onChange.bind(this)}/>
            </View>
        )
        }
        return (
            <View style={styles.container}>
                <NavBarPanel title={I18n.t('AddTag')} confirmText={I18n.t('Confirm')} onConfirm={this.confirm.bind(this)}/>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <WrapBlock ref="wrapData" data={this.props.tags} editable={true} selectable={false}/>
                    <Text style={{marginLeft:18,fontSize:10,color:'#989BA3',marginTop:3,marginBottom: 10}}>{I18n.t('AddLabelLimit')}</Text>
                    {recTag}
                </ScrollView>
            </View>
        );
    }
}

var styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    }
});
