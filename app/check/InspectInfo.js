import React, {Component} from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import {Actions} from "react-native-router-flux";
import Icon from 'react-native-vector-icons/FontAwesome';
import RNStatusBar from '../components/RNStatusBar';
import HttpUtil from "../utils/HttpUtil";
import RadarChart from './RadarChart';
import TimeUtil from '../utils/TimeUtil';
import StringUtil from '../utils/StringUtil';
import PhoneInfo from "../entities/PhoneInfo";
import I18n from 'react-native-i18n';
import NetInfoIndicator from "../components/NetInfoIndicator";
import RouteMgr from "../notification/RouteMgr";
import * as lib from "../common/PositionLib";
import PatrolTable from "../components/inspect/PatrolTable";
import PatrolFocal from "../components/inspect/PatrolFocal";
import PatrolShow from "../components/inspect/PatrolShow";
import PatrolFeedback from "../components/inspect/PatrolFeedback";
import PatrolInspect from "../components/inspect/PatrolInspect";
import TouchableOpacityEx from "../touchables/TouchableOpacityEx";
import PatrolReport from "../components/inspect/PatrolReport";
import BusyIndicator from "../components/BusyIndicator";
import Toast from "react-native-easy-toast";
import Signature from "../components/Signature";

let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');

export default class InspectInfo extends Component {
    constructor(props){
        super(props);

        this.images = {
            EN: {
                supervised : require('../assets/images/img_summary_supervised_en.png'),
                improved: require('../assets/images/img_summary_improved_en.png'),
                good: require('../assets/images/img_summary_good_en.png'),
            },
            CN: {
                supervised : require('../assets/images/img_summary_supervised.png'),
                improved: require('../assets/images/img_summary_improved.png'),
                good: require('../assets/images/img_summary_good.png'),
            },
            TW: {
                supervised : require('../assets/images/img_summary_supervised_tw.png'),
                improved: require('../assets/images/img_summary_improved.png'),
                good: require('../assets/images/img_summary_good.png'),
            }
        };

        this.default = PhoneInfo.isEnLanguage() ? this.images.EN :
            PhoneInfo.isTwLanguage() ? this.images.TW : this.images.CN;

        this.state = {
            isLoading: false,
            data: this.props.item,
            ignored:[],
            focals:[],
            feedbacks:[],
            radarData: [],
            radarLabels: [],
            comment:null,
            signatures: [],
            totalPoint: 0,
            rateTable: [],
            scoreTable: [],
            appendTable: [],
            shareTitle: ""
        }
    }

    componentDidMount() {
        this.setState({isLoading: true});
        this.fetchData();
    }

    fetchData(){
        try {
            HttpUtil.post('${v4.0}/inspect/report/info',{reportIds:[this.state.data.id]})
                .then(result => {
                    if(result.data.length > 0){
                        let data = result.data[0].info;
                        let radarData = [];
                        let radarLabels = [];

                        data.summary.forEach((item)=>{
                            let totalItems = item.numOfQualifiedItems + item.numOfUnqualifiedItems;
                            let score = (totalItems !== 0) ? (item.numOfQualifiedItems/totalItems) : 0;
                            radarData.push(score);
                            radarLabels.push(item.groupName);
                        });

                        let rateTable = [], scoreTable = [], appendTable = [];
                        rateTable = this.onRateTable(data.summary);
                        scoreTable = this.onScoreTable(data.summary);
                        appendTable = this.onAppendTable(data.summary);

                        this.setState({
                            radarData,
                            radarLabels,
                            ignored: data.ignoredItems,
                            focals: data.focalItems,
                            feedbacks: data.feedback,
                            isLoading: false,
                            comment:data.comment,
                            signatures: data.signatures,
                            totalPoint: data.totalScore,
                            rateTable: rateTable,
                            scoreTable: scoreTable,
                            appendTable: appendTable,
                            shareTitle: I18n.t('Share report')
                        });
                    }
                })
                .catch(error=>{
                    this.setState({
                        isLoading: false
                    });
                })
        }catch (e) {
        }
    }

    onRateTable(summary){
        let rows = [];
        let categories = summary.filter(p => p.type === 0);
        categories.forEach((item)=>{
            rows.push({
                name: item.groupName,
                size: item.numOfTotalItems,
                qualified: item.numOfQualifiedItems,
                unqualified: item.numOfUnqualifiedItems,
                inapplicable: item.numOfIgnored,
            });
        });

        return rows;
    }

    onScoreTable(summary){
        let rows = [];
        let categories = summary.filter(p => p.type === 1);
        categories.forEach((item)=>{
            rows.push({
                name: item.groupName,
                size: item.numOfTotalItems,
                totalPoints: item.totalScore,
                inapplicable: item.numOfIgnored,
                points: item.actualScore
            });
        });

        return rows;
    }

    onAppendTable(summary){
        let rows = [];
        let categories = summary.filter(p => p.type === 2);
        categories.forEach((item)=>{
            rows.push({
                name: item.groupName,
                size: item.numOfTotalItems,
                qualified: item.numOfQualifiedItems,
                unqualified: item.numOfUnqualifiedItems,
                inapplicable: item.numOfIgnored,
                points: item.actualScore
            });
        });

        return rows;
    }

    onShare(){
        let report = {
            id: this.state.data.id,
            date: this.state.data.ts,
            name: this.state.data.storeName,
            list: this.state.data.tagName,
            inspector: this.state.data.submitterName,
            type: this.state.data.mode,
            result: this.state.data.status,
            points: this.state.data.totalScore
        };

        PatrolReport.share(report, (result, prompt)=>{
            result ? this.refs.indicator.open() : this.refs.indicator.close();
            prompt && this.refs.toast.show(I18n.t('Share failed'), 3000);
        });
    }

    renderLoadingView() {
        return (
            <View style={{flex:1,justifyContent:'center'}}>
                <ActivityIndicator
                    animating={true}
                    color='#dcdcdc'
                    size="large"
                />
                <Text style={{textAlign:'center'}}>{I18n.t('Loading')}</Text>
            </View>
        );
    }

    renderIgnores = ({ item,index}) => {
        return (
            <View style={styles.itemPanel}>
                <Icon name="circle" style={{color: '#d4dbd5',fontSize: 10,marginTop:3}}/>
                <Text style={styles.itemSubject} numberOfLines={1}>{item.name}</Text>
            </View>
        )
    }

    renderFocals = ({ item,index}) => {
        return (
            <View style={styles.itemPanel}>
                <Icon name="circle" style={{color: '#d4dbd5',fontSize: 10,marginTop:3}}/>
                <Text style={styles.itemSubject} numberOfLines={1}>{item.name}</Text>
            </View>
        )
    }

    renderFeedbacks = ({ item,index}) => {
        return (
            <View style={{marginBottom: 10}}>
                <View style={styles.itemPanel}>
                    <Icon name="circle" style={{color: '#d4dbd5',fontSize: 10,marginTop:3}}/>
                    <Text style={styles.itemSubject} numberOfLines={1}>{item.subject}</Text>
                </View>
                {/*{*/}
                    {/*item.description !== '' ? <Text style={styles.description}>{item.description}</Text> : null*/}
                {/*}*/}
            </View>
        )
    };

    render() {
        return (
            <View style={styles.container}>
                <RNStatusBar/>
                <View style={styles.NavBarPanel}>
                    <TouchableOpacity activeOpacity={0.5} onPress={()=>Actions.pop()} style={{width:40,alignItems:'center'}}>
                        <Image source={RouteMgr.getRenderIcon()} style={{width:48,height:48}}/>
                    </TouchableOpacity>
                    <View style={styles.NavBarTitle}>
                        <Text style={styles.NavBarText}>{I18n.t('Report details')}</Text>
                    </View>
                    <TouchableOpacityEx activeOpacity={0.5} onPress={()=>{this.onShare()}}>
                        <View style={{width:50,height:48,alignItems:'flex-end'}}>
                            <Text style={{fontSize:14,color:'#ffffff',marginRight:10,textAlignVertical:'center',height:48,
                                ...Platform.select({ios:{lineHeight:48}})}}>{this.state.shareTitle}</Text>
                        </View>
                    </TouchableOpacityEx>
                </View>
                <Text style={styles.tableName}>{this.state.data.tagName}</Text>

                <NetInfoIndicator/>

                {
                    this.state.isLoading ? this.renderLoadingView() : <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.topPanel}>
                            <View style={styles.iconPanel}>
                                {
                                    this.state.data.mode !== 0 ? <Image source={require('../assets/images/event_site_pic.png')} style={styles.iconPanel}/>
                                        : <Image source={require('../assets/images/event_telnet_pic.png')} style={styles.iconPanel}/>
                                   }
                            </View>
                            <View style={styles.inspectPanel}>
                                <Text style={styles.inspectTyle} numberOfLines={1}>
                                    {this.state.data.storeName}
                                </Text>
                                <Text style={styles.inspectStore} numberOfLines={1}>{this.state.data.mode !== 0 ? I18n.t('Onsite patrol') : I18n.t('Remote patrol')}</Text>
                            </View>
                            <View style={styles.datePanel}>
                                <Text style={styles.dateText} numberOfLines={1}>{TimeUtil.getTime(this.state.data.ts)}</Text>
                                <Text style={styles.submitText} numberOfLines={1}>{I18n.t('Submitter')}:{this.state.data.submitterName}</Text>
                            </View>
                            {
                                this.state.data.status === 0 ? <Image source={this.default.supervised} style={styles.inspectLabel}/>
                                    : this.state.data.status === 1 ? <Image source={this.default.improved} style={styles.inspectLabel}/>
                                    : <Image source={this.default.good} style={styles.inspectLabel}/>
                            }
                        </View>
                        <View style={
                            this.state.radarLabels.length%2 !== 0 ? styles.radarPanel : [styles.radarPanel,{height:230}]}>
                            <RadarChart width={300} height={300} radius={80} data={this.state.radarData} labels ={this.state.radarLabels}/>
                        </View>

                        {
                            this.state.comment != null ?
                            <View style={styles.inspectAdvise}>
                                <View style={{flexDirection:'row',justifyContent:'flex-start'}}>
                                    <Image source={require('../assets/images/img_inspect_message.png')}
                                           style={{width:14,height:14,...Platform.select({
                                                   android:{
                                                       marginTop:3
                                                   },
                                                   ios:{
                                                       marginTop:1
                                                   }
                                               })}}/>
                                    <Text style={{fontSize:14,color:'#6097f4',fontWeight:'bold',marginLeft:6}}>{I18n.t('Improvement advices')}</Text>
                                </View>
                                <Text style={{fontSize:12,color:'#6097f4',marginTop:6}}>{this.state.comment}</Text>
                            </View> : null
                        }

                        <View style={styles.scorePanel}>
                            <Text style={styles.scoreLabel}>{I18n.t('Inspection score')}</Text>
                            <Text style={styles.scoreSummary}>{this.state.totalPoint}{I18n.t('Points')}</Text>
                        </View>

                        {
                            (this.state.rateTable.length > 0) ? <PatrolTable type={0} data={this.state.rateTable}/> : null
                        }
                        {
                            (this.state.scoreTable.length > 0) ? <PatrolTable type={1} data={this.state.scoreTable}/> : null
                        }
                        {
                            (this.state.appendTable.length > 0) ? <PatrolTable type={2} data={this.state.appendTable}/> : null
                        }

                        <View style={[styles.listPanel,{flexDirection:'row',justifyContent:'space-between'}]}>
                            <Text style={styles.storeLabel} numberOfLines={1}>{I18n.t('Notable items')}</Text>
                            <Text style={styles.storeLabel} numberOfLines={1}>{this.state.focals.length}{I18n.t('Count')}</Text>
                        </View>
                        <PatrolFocal data={this.state.focals} type={false}/>
                        <View style={{width:width-32, height:1,backgroundColor:'#dcdcdc',alignSelf:'center'}}/>

                        <View style={[styles.listPanel,{flexDirection:'row',justifyContent:'space-between'}]}>
                            <Text style={styles.storeLabel} numberOfLines={1}>{I18n.t('Feedbacks')}</Text>
                            <Text style={styles.storeLabel} numberOfLines={1}>{this.state.feedbacks.length}{I18n.t('Count')}</Text>
                        </View>
                        <PatrolInspect data={this.state.feedbacks} />
                        <View style={{width:width-32, height:1,backgroundColor:'#dcdcdc',alignSelf:'center'}}/>

                        <View style={[styles.listPanel,{flexDirection:'row',justifyContent:'space-between'}]}>
                            <Text style={styles.storeLabel} numberOfLines={1}>{I18n.t('Inapplicable items')}</Text>
                            <Text style={styles.storeLabel} numberOfLines={1}>{this.state.ignored.length}{I18n.t('Count')}</Text>
                        </View>
                        <PatrolShow data={this.state.ignored} type={false} feedback={false}/>
                        <View style={{width:width-32, height:1,backgroundColor:'#dcdcdc',alignSelf:'center',marginBottom:16}}/>

                        {
                            (this.state.data.mode !== 0 && this.state.signatures.length != 0) ? <Text style={{fontSize: 14,color:'#19293b',marginLeft:30}}>
                                    {I18n.t('Signature')}</Text>
                                : null
                        }
                        {
                            (this.state.data.mode !== 0 && this.state.signatures.length != 0) ? <Signature
                                ref={'signature'}
                                data={this.state.signatures}
                                editable={false}
                                signUriArray={(sign)=>this.setState({signatures: sign})}
                            /> : null
                        }
                    </ScrollView>
                }

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
        alignItems: 'center'
    },
    NavBarTitle: {
        width:width-90,
        height:48
    },
    NavBarText: {
        fontSize:18,
        height: 48,
        color:'#ffffff',
        textAlign: 'center',
        textAlignVertical: 'center',
        marginLeft:10,
        ...Platform.select({
            ios:{
                lineHeight:48
            }
        })
    },
    topView:{
        width: width,
        height: 10,
        backgroundColor: '#f6f8fa'
    },
    topPanel:{
        flexDirection: 'row',
        justifyContent:'flex-start',
        height:80,
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 22,
        paddingBottom: 10
    },
    iconPanel:{
        width: 25,
        height: 25
    },
    inspectPanel:{
        width: width-32-120-25,
        marginLeft: 6
    },
    inspectTyle:{
        fontSize: 14,
        color: '#19293b',
        fontWeight: 'bold'
    },
    inspectStore:{
        fontSize: 12,
        color: '#19293b',
        marginTop: 4
    },
    datePanel:{
        width: 120,
        alignItems:'flex-end'
    },
    dateText:{
        fontSize: 10,
        color: '#989ba3'
    },
    submitText:{
        fontSize: 10,
        color: '#989ba3',
        marginTop: 10
    },
    inspectLabel:{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 55,
        height: 50
    },
    radarPanel:{
        width:width,
        height:200,
        alignItems:'center',
        justifyContent:'center'
    },
    totalScore:{
        fontSize:12,
        color:'#19293b',
        height:30,
        textAlign:'center',
        textAlignVertical:'center',
        lineHeight: 30
    },
    listPanel:{
        marginTop:14,
        paddingLeft:30,
        paddingRight:26,
        backgroundColor:'#ffffff'
    },
    listDataPanel:{
        marginTop:16,
        backgroundColor:'#ffffff'
    },
    itemPanel:{
        flexDirection:'row',
        justifyContent:'flex-start',
        height:26
    },
    itemSubject:{
        marginLeft:18,
        fontSize:12,
        color:'#888c95',
        marginRight:26
    },
    description:{
        fontSize:12,
        color:'#888c95',
        marginLeft:26
    },
    inspectAdvise:{
        width:width-32,
        borderRadius:2,
        borderWidth:1,
        borderColor:'#a0c1f8',
        marginLeft:16,
        padding:10,
        backgroundColor:'#f1f6fe'
    },
    scorePanel:{
        width: width-32,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: 14,
        marginLeft: 16
    },
    scoreLabel:{
        fontSize: 14,
        color: '#232324',
        textAlignVertical:'center'
    },
    scoreSummary:{
        fontSize: 16,
        color: '#f31d65',
        marginLeft: 10,
        textAlignVertical:'center',
        ...Platform.select({
            ios:{
                marginTop:-2
            }
        })
    },
    scoreNote:{
        fontSize: 14,
        color:'#888c95',
        textAlignVertical: 'center',
        marginLeft: 6
    },
    tableName:{
        position:'absolute',
        left: 16,
        top:32+lib.statusBarHeight(),
        color:'#ffffff',
        fontSize:11,
        width:width-32,
        textAlign:'center'
    },
});
