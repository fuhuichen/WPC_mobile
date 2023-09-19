import React, {Component} from 'react';
import {
    BackHandler,
    DeviceEventEmitter,
    Dimensions,
    Image,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import Icon from 'react-native-vector-icons/FontAwesome';
import RNStatusBar from '../components/RNStatusBar';
import I18n from 'react-native-i18n';
import NetInfoIndicator from "../components/NetInfoIndicator";
import RouteMgr from "../notification/RouteMgr";
import PatrolReport from "../components/inspect/PatrolReport";
import BusyIndicator from "../components/BusyIndicator";
import Toast from "react-native-easy-toast";
import TouchableOpacityEx from "../touchables/TouchableOpacityEx";

let {width} =  Dimensions.get('screen');
export default class InspectSuccess extends Component {
    constructor(props){
        super(props);

        this.users = this.props.data;
        this.state = {
            title:''
        };
    }

    componentDidMount(){
        let users = '';
        this.users.forEach((item,index)=>{
            if(index === (this.users.length-1)){
                users = users+item.userName;
            }else{
                users = users+item.userName+',';
            }
        });
        users = users.trim();

        let title = (users === '') ? I18n.t('Submitted success') : `${I18n.t('CC to')}: ${users}`;
        this.setState({title});
    }

    componentWillMount(){
        if (Platform.OS === 'android') {
            BackHandler.addEventListener('inspectSuccessBack', this.onBackAndroid);
        }
    }

    componentWillUnmount() {
        if (Platform.OS === 'android') {
            BackHandler.removeEventListener('inspectSuccessBack', this.onBackAndroid);
        }
    }

    onBackAndroid = () => {
        RouteMgr.popRouter();
        return true;
    };

    onShare(){
        PatrolReport.share(this.props.report, (result, prompt)=>{
            result ? this.refs.indicator.open() : this.refs.indicator.close();
            prompt && this.refs.toast.show(I18n.t('Share failed'), 3000);
        });
    }

    renderRow = ({ item,index}) => {
        return (
            <View style={styles.rowPanel}>
                <View style={styles.itemNamePanel}>
                    <Text style={styles.groupName} numberOfLines={1}>
                        {item.groupName}
                    </Text>
                </View>
                <View style={item.result === 1 ? styles.resultConformity : styles.resultNonConformity}>
                    <Text style={styles.itemResult}>{item.result === 0 ? I18n.t('Failed'): I18n.t('Pass')}</Text>
                </View>
                <View style={styles.scorePanel}>
                    <Text style={styles.itemScore}>{item.score}</Text>
                </View>
                <View style={styles.totalScorePanel}>
                    <Text style={styles.totalScore}>{item.totalScore}</Text>
                </View>
            </View>
        )
    }

    renderItem = ({ item,index}) => {
        return (
            <View style={styles.itemPanel}>
                <Icon name="circle" style={{color: '#d4dbd5',fontSize: 10,marginTop:3}}/>
                <Text style={styles.ignoreSubject} numberOfLines={1}>{item}</Text>
            </View>
        )
    }

    render() {
        return (
            <View style={styles.container}>
                <RNStatusBar/>
                <View style={styles.NavBarPanel}>
                    <TouchableOpacity activeOpacity={0.5} onPress={()=>{RouteMgr.popRouter()}} style={{width:40}}>
                        <Image source={require('../assets/images/img_navbar_close.png')} style={styles.NavBarImage}/>
                    </TouchableOpacity>
                    <View style={{width:width-90}}>
                        <Text style={styles.NarBarTitle}>{I18n.t('Sent success')}</Text>
                    </View>
                    <TouchableOpacityEx activeOpacity={0.5} onPress={()=>{this.onShare()}}>
                        <View style={{width:50,height:48,alignItems:'flex-end'}}>
                            <Text style={{fontSize:14,color:'#ffffff',marginRight:10,textAlignVertical:'center',height:48,
                                ...Platform.select({ios:{lineHeight:48}})}}>{I18n.t('Share report')}</Text>
                        </View>
                    </TouchableOpacityEx>
                </View>
                <NetInfoIndicator/>

                <View style={styles.imagePanel}>
                    <Image style={styles.imageIcon} source={require('../assets/images/img_submit_success.png')}></Image>
                    <Text style={styles.submitText} numberOfLines={2}>{this.state.title}</Text>
                </View>

                <BusyIndicator ref={"indicator"} title={I18n.t('Waiting')}/>
                <Toast ref="toast" style={{backgroundColor:'#888c95'}} textStyle={{color:'#ffffff'}}/>
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
        height: 48,
        backgroundColor: '#24293d',
    },
    NavBarImage: {
        width: 48,
        height: 48
    },
    NarBarTitle: {
        fontSize: 18,
        color: '#ffffff',
        height: 48,
        textAlignVertical:'center',
        textAlign: 'center',
        marginLeft:10,
        lineHeight: 48
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
        color: '#6097f4',
        width:width-32,
        textAlign: 'center'
    }
});
