import React, {Component} from 'react';
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    Image,
    FlatList,
    Platform,
    ActivityIndicator,
    DeviceEventEmitter,
    TouchableOpacity
} from "react-native";
import I18n from "react-native-i18n";
import PropTypes from 'prop-types';
import {Actions} from "react-native-router-flux";
import Navigation from "../../element/Navigation";
import Divider from "react-native-elements/dist/divider/Divider";
import store from "../../../mobx/Store";
import ViewIndicator from "../../customization/ViewIndicator";
import * as BorderShadow from "../../element/BorderShadow";
import {getInspectReportGroupOverview} from "../../common/FetchRequest";
import PhoneInfo from '../../entities/PhoneInfo';
import {ColorStyles} from "../../common/ColorStyles";

const {width, height} = Dimensions.get('window');
export default class StoreReportTimes extends Component {
    state = {
        viewType: store.enumSelector.viewType.EMPTY,
        sortType: store.enumSelector.sortType.DESC,
        enumSelector: store.enumSelector,
        contentOffset: 0,
        showFooter: 0, // 0: hidden, 1: no more data, 2: loading
        currentPage: 0,
        lastPage: true,
        onEndReached: false,
        onPull:false,
        data: []
    };

    static propTypes = {
        request: PropTypes.object,
        property: PropTypes.string
    };

    static defaultProps = {
        property: 'numOfReport'
    };

    componentDidMount(){
        this.fetchData(0 ,true);
    }

    fetchData(page, load){
        try {
            let {viewType, enumSelector, sortType} = this.state, lastPage = true;
            let data = load ? [] : this.state.data;
            load && this.setState({viewType: enumSelector.viewType.LOADING});

            setTimeout(async () => {
                let {request} = this.props;
                request.filter = {page: page, size:100};
                request.order = {
                    direction: (sortType === enumSelector.sortType.DESC) ? 'desc' : 'asc',
                    property: this.props.property
                };

                viewType = enumSelector.viewType.FAILURE;
                let result = await getInspectReportGroupOverview(request);

                let content = [];
                if (result.errCode === enumSelector.errorType.SUCCESS){
                    content = result.data.content;

                    lastPage = result.data.last;
                    viewType = (content.length > 0) ? enumSelector.viewType.SUCCESS : enumSelector.viewType.EMPTY;
                }

                data = data.concat(content);
                viewType = load ? viewType : this.state.viewType;
                this.setState({
                    data,
                    viewType,
                    lastPage,
                    onEndReached: false,
                    onPull: false,
                    showFooter: 0
                });
            },200);
        }
        catch (e) {
        }
    }

    onBack(){
        Actions.pop();
    }

    onRow(item, index) {
        let {request} = this.props;

        let filters = {
            beginTs: request.beginTs,
            endTs: request.endTs,
            inspectTagId: request.inspectTagId,
            clause: {storeId: item.innerId}
        };

        if (request.submitters != null){
            filters.clause.submitter = request.submitters;
        }

        if (request.searchMysteryMode != null){
            filters.searchMysteryMode = request.searchMysteryMode;
        }

        Actions.push('reportList', {filters: filters});
    }

    onSort(){
        let {sortType, enumSelector} = this.state;
        this.setState({sortType: (sortType === enumSelector.sortType.DESC) ?
            enumSelector.sortType.ASC : enumSelector.sortType.DESC}, () => {
            this.fetchData(0, true);
        });
    }

    renderItem({item, index}){
        let times = (this.props.property === 'numOfReport') ? item.numOfReport : item.numOfStandard;

        return <TouchableOpacity activeOpacity={0.5} onPress={() => this.onRow(item,index)}>
            <View style={styles.data}>
                <Text style={styles.name} numberOfLines={1}>{item.groupName}</Text>
                <View style={{width:20}}/>
                <View style={styles.panel}>
                    <Text style={styles.times}>{times}</Text>
                    <Image source={require('../../assets/img_row_label.png')} style={styles.arrow}/>
                </View>
            </View>
        </TouchableOpacity>
    }

    render() {
        let {data, viewType, sortType, enumSelector} = this.state;
        let viewSuccess = (viewType === enumSelector.viewType.SUCCESS), title = '';

        if (viewSuccess){
            title = (sortType === enumSelector.sortType.DESC) ? I18n.t('Descending brief')
                : I18n.t('Ascending brief');
        }

        let fontSize = 17;
        (PhoneInfo.isTHLanguage() || PhoneInfo.isVNLanguage()) && (fontSize = 12);

        return (
            <View style={styles.container}>
                <Navigation
                    onLeftButtonPress={() => this.onBack()}
                    title={I18n.t('Evaluation times')}
                    rightButtonTitle={title}
                    onRightButtonPress={() => this.onSort()}
                    rightButtonStyle={{
                        activeColor: ColorStyles.STATUS_BACKGROUND_BLUE,
                        inactiveColor: ColorStyles.STATUS_BACKGROUND_BLUE,
                        textColor: '#ffffff',
                        padding: 0,
                        fontSize: fontSize
                    }}
                />

                {
                    !viewSuccess ? <ViewIndicator viewType={viewType}
                                                  containerStyle={{marginTop:100}} refresh={() => this.fetchData()}/>
                        : <FlatList style={[styles.list, BorderShadow.div]}
                                    data={data}
                                    onScroll={(evt) => {
                                        this.setState({contentOffset: evt.nativeEvent.contentOffset.y});
                                    }}
                                    keyExtractor={(item, index) => index.toString()}
                                    renderItem={this.renderItem.bind(this)}
                                    showsVerticalScrollIndicator={false}
                                    refreshing={false}
                                    onRefresh={() => this.onRefresh()}
                                    onEndReached={() => this.onEndReached()}
                                    onEndReachedThreshold={0.1}
                                    keyboardShouldPersistTaps={'handled'}
                                    ItemSeparatorComponent={() => <Divider style={styles.divider}/>}
                                    ListFooterComponent={() => this.renderFooter()}/>
                }
            </View>
        )
    }

    // pages
    onRefresh(){
        this.setState({
            data: [],
            currentPage: 0,
            showFooter: 0,
            lastPage: false,
            onEndReached: false,
            onPull:true
        },async ()=>{
            await this.fetchData(0, true);
        })
    }

    onEndReached(){
        try {
            if(this.state.lastPage) {
                {
                    (this.state.contentOffset >= (height-Platform.select({android:56, ios:78})))
                        ? this.setState({showFooter: 1}) : this.setState({showFooter: 0});
                    return;
                }
            }

            if(!this.state.onEndReached){
                let page = ++this.state.currentPage;
                this.setState({onEndReached: true,showFooter: 2,currentPage:page});
                (async () => {
                    await this.fetchData(page,false);
                })();
            }
        }catch(e){
        }
    }

    renderFooter(){
        let {showBottom, showFooter} = this.state, component = null;
        if (showFooter === 1) {
            component = <View style={{height:40,alignItems:'center',justifyContent:'center',flexDirection:'row'}}>
                <View style={{width:50,height:1,backgroundColor:'#dcdcdc'}} />
                <Text style={{color:'#989ba3',fontSize:10,marginLeft:10}}>
                    {I18n.t('No further')}
                </Text>
                <View style={{width:50,height:1,backgroundColor:'#dcdcdc',marginLeft:10}} />
            </View>;
        }

        if(showFooter === 2) {
            component = <View style={styles.footer}>
                <ActivityIndicator color={'#989ba3'}/>
                <Text style={{fontSize: 10, color: '#989ba3'}}>{I18n.t('Loading data')}</Text>
            </View>;
        }

        return (
            <View>
                {component}
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex:1,
        backgroundColor:'#F7F9FA'
    },
    list:{
        borderRadius:10,
        backgroundColor:'#fff',
        width:width-20,
        marginLeft:10,
        marginTop: 16,
        flexGrow:0
    },
    footer:{
        flexDirection:'row',
        height:24,
        justifyContent:'center',
        alignItems:'center',
        marginBottom:10,
    },
    divider:{
        borderBottomWidth:0,
        backgroundColor:'rgb(242,242,242)',
        width:width-52,
        height:2,
        marginLeft:16
    },
    data:{
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center',
        height:55
    },
    name:{
        flex:1,
        fontSize:14,
        color:'rgb(100,104,109)',
        paddingLeft: 16
    },
    panel:{
        flexDirection:'row',
        justifyContent:'flex-end',
        alignItems:'center',
        width:80,
        marginRight: 16
    },
    times:{
        fontSize:14,
        color:'rgb(100,104,109)',
        marginRight:20
    },
    arrow:{
        width:16,
        height:16,
        marginTop:2
    }
});
