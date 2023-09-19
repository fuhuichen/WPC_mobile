import React, {Component} from 'react';
import {
    ActivityIndicator,
    DeviceEventEmitter,
    Dimensions,
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import {Actions} from 'react-native-router-flux';
import Icon from 'react-native-vector-icons/FontAwesome'
import {EMITTER_LATEST, LATEST_STORE} from "../common/Constant";
import store from 'react-native-simple-store'
import HttpUtil from "../utils/HttpUtil";
import UserPojo from "../entities/UserPojo";
import I18n from 'react-native-i18n';
import AccessHelper from "../common/AccessHelper";
import Toast from "react-native-simple-toast";
import NetInfoIndicator from "../components/NetInfoIndicator";
import PicBase64Util from "../utils/PicBase64Util";
import TouchableOpacityEx from "../touchables/TouchableOpacityEx";

let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');

export default class LatestStore extends Component {
    constructor(props){
        super(props)

        this.state = {
            data: [],
            isLoading: false
        }
    }

    componentDidMount(){
        this.listener = DeviceEventEmitter.addListener(EMITTER_LATEST,
            (param)=>{
                this.fetchData();
            });
    }

    componentWillUnmount(){
        this.listener.remove();
    }

    fetchData(){
        try {
            this.setData([],true)

            let body= {clause:{storeId:[]}};
            let key = UserPojo.getUserId()+UserPojo.getAccountId()+ LATEST_STORE;
            store.get(key).then((res)=>{
               if(res != null){
                   res.forEach(function (v) {
                       body.clause.storeId.push(v.storeId);
                   })
               }

                let storeIds = body.clause.storeId;
                if(storeIds.length > 0){
                    HttpUtil.post('store/list',body)
                        .then(result => {
                            let data = [];
                            storeIds.reverse().forEach((item)=>{
                                let content = result.data.content.find(p=>p.storeId === item);
                                content && data.push(content);
                            });
                            this.setData(data,false)
                        })
                        .catch(error=>{
                            this.setData([],false)
                        })
                }else{
                    this.setData([],false)
                }
            })
        }catch (e) {
            console.log("LatestStore-fetchData:" + e);
        }
    }

    setData(data,isLoading){
        this.setState({
            data,
            isLoading
        })
    }

    clickRow(item,index){
        try {
            if (!AccessHelper.enableStoreMonitor() || !AccessHelper.enableVideoLicense()){
                Toast.show(I18n.t('Video license'), Toast.LONG);
                return;
            }

            Actions.push('videoMonitor',
                    {data: this.state.data[item.storeIndex],
                    channelId: index,
                    isCollect:this.state.data[item.storeIndex].favorite,
                    emitter: EMITTER_LATEST});
        }catch (e) {
            console.log("LatestStore-clickRow:" + e);
        }
    }

    collectClick(item,index){
        try {
            let body = {storeIds:[]};
            body.storeIds.push(item.storeId);

            let isCollect = item.favorite;
            let url = isCollect ? 'favorite/delete' : 'favorite/add';
            HttpUtil.post(url, body)
                .then(result => {

                    let items = this.state.data;
                    items[index].favorite = !isCollect;
                    this.setState({
                        data: items
                    })
                })
                .catch(error => {
                })
        }catch (e) {
            console.log("LatestStore-collectClick:" + e);
        }

    }

    renderLoadingView() {
        return (
            <View style={{flex:1, justifyContent:'center'}}>
                <ActivityIndicator
                    animating={true}
                    color='#dcdcdc'
                    size="large"
                />
                <Text style={{textAlign:'center'}}>{I18n.t('Loading')}</Text>
            </View>
        );
    }

    renderRow = ({ item,index}) => {
        return (
            <TouchableOpacityEx activeOpacity={0.5} onPress={this.clickRow.bind(this,item,index)}>
                <View>
                    <Image style={styles.rowItem}
                        source={item.thumbnailUrl == null ? require('../assets/images/img_default_channel.png')
                            : {uri: item.thumbnailUrl,cache: 'reload'}}
                        resizeMode='stretch'/>

                    <View style={styles.channelInfoPanel}>
                        {
                            // item.status ? <Icon style={{marginLeft: 6}}
                            //                     name="circle"
                            //                     size={9}
                            //                     color="#57e78f" />
                            // : <Icon style={{marginLeft: 6}}
                            //            name="circle"
                            //            size={9}
                            //            color="#888c95"/>
                            <Icon style={{marginLeft: 6}}
                                  name="circle"
                                  size={9}
                                  color="#57e78f" />
                        }
                        <Text style={styles.channelName} numberOfLines={1}>{item.name}</Text>
                    </View>
                </View>
            </TouchableOpacityEx>
        )
    }

    renderItem = ({ item,index}) => {
        let itemData  = item.device.map((obj,value) =>{
            obj.storeIndex = index;
            return obj;
        })

        return (
            <View style={itemData.length > 0 ? styles.itemPanel : [styles.itemPanel,{height:60}]}>
                <View style={styles.itemHeaderPanel}>
                    <Text style={styles.itemHeaderTitle} numberOfLines={1}>{item.name}</Text>
                    <TouchableOpacity activeOpacity={0.5} onPress={this.collectClick.bind(this,item,index)}>
                        {
                            item.favorite ?  <Image source={require('../assets/images/img_star_collect.png')} style={styles.itemHeaderImage}/>
                                :  <Image source={require('../assets/images/img_star_uncollect.png')} style={styles.itemHeaderImage}/>
                        }

                    </TouchableOpacity>
                </View>
                {
                    itemData.length > 0 ? <FlatList
                    data={itemData}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={this.renderRow}
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                    /> : null
                }
            </View>
        )
    }

    render() {
        return (
            this.state.isLoading ? this.renderLoadingView()
            : <View style={styles.container}>
                <NetInfoIndicator/>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <FlatList style={{marginRight: 12}}
                              data={this.state.data}
                              keyExtractor={(item, index) => index.toString()}
                              renderItem={this.renderItem}
                              showsVerticalScrollIndicator = {false}
                              ItemSeparatorComponent={() => <View style={{
                                  height: 1,
                                  width: width-24,
                                  marginLeft: 12,
                                  backgroundColor: '#dcdcdc'
                              }}/>}
                              extraData={this.state}
                              ListEmptyComponent={() => <View
                                  style={{
                                      width: '100%',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                  }}>
                                  <View style={styles.imagePanel}>
                                      <Image style={styles.imageIcon} source={require('../assets/images/img_monitor_nobrowse.png')}></Image>
                                  </View>
                                  <Text style={styles.submitText}>{I18n.t('No recently')}</Text>
                              </View>}
                    />
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
    itemPanel:{
        width: width,
        height: 150,
        paddingLeft: 12,
        // paddingRight: 12,
        backgroundColor: '#ffffff'
    },
    itemHeaderPanel:{
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    itemHeaderTitle:{
        marginTop: 20,
        marginRight: 4,
        width:width-16-48,
        fontSize:16,
        color:'#19293b'
    },
    itemHeaderImage:{
        width: 48,
        height: 48,
        marginTop: 5
    },
    rowItem:{
        width: 104,
        height: 74,
        marginRight: 8,
        borderRadius: 2
    },
    channelInfoPanel:{
        position: 'absolute',
        backgroundColor: 'rgba(0,0,0,0.45)',
        height: 20,
        width: 104,
        bottom: 0,
        flexDirection: 'row',
        alignItems:'center'
    },
    channelName: {
        fontSize: 14,
        color: '#ffffff',
        marginLeft: 6,
        width:104-6-9
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
        color: '#d5dbe4',
        textAlign: 'center'
    }
});
