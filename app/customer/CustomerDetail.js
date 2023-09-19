import React, {Component} from 'react';

import {
    Dimensions,
    Image, Platform, ScrollView,
    StyleSheet, Text,
    TouchableOpacity,
    View,
} from 'react-native';

import I18n from "react-native-i18n";
import {Actions} from "react-native-router-flux";
import Timeline from "react-native-timeline-listview";
import WrapBlock from "../components/WrapBlock";
import TimeUtil from "../utils/TimeUtil";
import GroupInfo from "./GroupInfo";
import HttpUtil from "../utils/HttpUtil";
import PicBase64Util from "../utils/PicBase64Util";
import NavBarPanel from "../components/NavBarPanel";

const {width} = Dimensions.get('screen');

export default class CustomerDetail extends Component {

    constructor(props) {
        super(props);
        this.state = {
            data:[],
        };
    }

    componentDidMount() {
        let request = {};
        request.beginTs = this.props.beginTs;
        request.endTs = this.props.endTs;
        request.customerId = this.props.data.customerId;
        let filter = {};
        filter.page = 0;
        filter.size = 5;
        request.filter = filter;
        HttpUtil.post('customer/arrival/list',request)
            .then(result => {
                let data = [];
                result.data.content.forEach((item,index)=>{
                    if (index === 0){
                        item.icon = require('../assets/images/img_dot_second.png');
                    }
                    else {
                        item.icon = require('../assets/images/img_dot_black.png');
                    }
                    data.push(item);
                });
                this.setState({data:data});
            })
            .catch(error=>{
            })
    }


    confirm(){
        Actions.push('register',{data:this.props.data,registered:this.props.registered,storeId:this.props.storeId});
    }

    renderDetail(rowData, sectionID, rowID) {
        let splitLine = null;
        if (this.state.data.length === 1) { splitLine = (
            <View style={{position:'absolute',left:-22,top:8,flexDirection:'row',zIndex:50}}>
                <View style={{height:140, width:2,backgroundColor: '#dcdcdc'}}/>
            </View>
        )
        }
        return (
            <View style={{flexDirection: 'row',alignItems:'center'}}>
                <Image  style={{width:44,height:44,borderRadius:2,backgroundColor:'#000000'}} source={PicBase64Util.getJPGSource(rowData.image)} resizeMode={'contain'}/>
                <View style={{marginLeft:20}}>
                    <Text style={{color: '#19293D', fontSize:12}}>{rowData.storeName}</Text>
                    <Text style={{color: '#989BA3', fontSize:10}}>{TimeUtil.getTime(rowData.ts)}</Text>
                </View>
                {splitLine}
            </View>
        )
    }

    render() {
        let registered = this.props.registered;
        let lastShowTitle = registered ? I18n.t('Last visit brand'): I18n.t('Last visit store');
        let lastShowTitleColor = registered ? '#F7F8FC': 'white';
        let opTitile = registered ? I18n.t('Edit') :I18n.t('Register');
        let customerName = this.props.data.name === '' ? I18n.t('Customer'):this.props.data.name;
        let descr = I18n.t('Description') + ':';

        return (
            <View style={styles.container}>
                <NavBarPanel title={I18n.t('CustomerDetail')} confirmText={opTitile} onConfirm={this.confirm.bind(this)}/>
                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps={'handled'} ref={'scrollView'} >
                    {!registered ? null :
                        <View style={{backgroundColor:'white'}}>
                            <View style={{marginLeft:16,marginRight:16,flex:1}}>
                                <View style={{flexDirection: 'row',marginTop: 24,alignItems:'center'}}>
                                    <Image  style={{width:54,height:54,borderRadius:2,backgroundColor:'#000000'}} source={PicBase64Util.getJPGSource(this.props.data.image)} resizeMode={'contain'}/>
                                    <View style={{marginLeft:15}}>
                                        <View style={{flexDirection: 'row',alignItems:'center'}}>
                                            <Text style={{color: '#19293D', fontSize:14}}>{customerName}</Text>
                                            <View style={{marginLeft:10,width:50,height:15,borderRadius:4,backgroundColor:GroupInfo.get(this.props.data.group).color}}>
                                                <Text style={{fontSize:10,color:'#ffffff',height:15,lineHeight:15, textAlign:'center',textAlignVertical:'center'}}>{GroupInfo.get(this.props.data.group).name}</Text>
                                            </View>
                                        </View>
                                        <View style={{flexDirection: 'row',marginTop: 12,alignItems:'center'}}>
                                            <Text style={{color: '#989BA3', fontSize:12}}>{I18n.t('Visiting store')}  {this.props.data.numOfVisitingStore}{I18n.t('Times')}</Text>
                                            <Text style={{color: '#989BA3', fontSize:12,marginLeft:10}}>{'|'}</Text>
                                            <Text style={{color: '#989BA3', fontSize:12,marginLeft:10}}>{I18n.t('Visiting brand')}  {this.props.data.numOfTotalVisiting}{I18n.t('Times')}</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={{flexDirection: 'row',marginTop:15}}>
                                    <Text style={{color:'#989BA3', fontSize: 12}}>{descr}</Text>
                                    <Text style={{color:'#989BA3', fontSize: 12, marginLeft:18,flex:1}}>{this.props.data.description}</Text>
                                </View>

                                <View style={{flexDirection: 'row',marginTop:10,alignItems:'flex-start'}}>
                                    <Text style={{color:'#989BA3', fontSize: 12,marginTop:12}}>{I18n.t('Label')}</Text>
                                    <WrapBlock data={this.props.data.tags} editable={false} selectable={false}/>
                                </View>
                            </View>
                            <View style={{height: 1, width:width, backgroundColor: '#dcdcdc',marginTop:20}}/>
                        </View>
                    }

                    <View style={{backgroundColor:lastShowTitleColor,justifyContent: 'center',height:40}}>
                        <Text style={{color:'#19293D',fontSize:12,marginLeft:16}}>{lastShowTitle}</Text>
                    </View>

                    <View style={{backgroundColor:'#F7F8FC'}}>
                        <Timeline
                            style={{marginLeft:16,marginRight:16,paddingTop:10,paddingBottom:10}}
                            data={this.state.data}
                            circleSize={20}
                            circleColor='rgba(0,0,0,0)'
                            innerCircle={'icon'}
                            lineColor='#dcdcdc'
                            timeContainerStyle={{maxWidth:0.1}}
                            descriptionStyle={{color:'gray'}}
                            renderDetail={this.renderDetail}
                        />
                    </View>
                </ScrollView>
            </View>
        );
    }
}

var styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F8FC',
    }
});
