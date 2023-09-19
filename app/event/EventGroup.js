import React, {Component} from 'react';
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    Image,
    TouchableOpacity,
    ScrollView,
    DeviceEventEmitter
} from "react-native";
import PropTypes from 'prop-types';
import I18n from 'react-native-i18n';
import {Actions} from 'react-native-router-flux';
import store from "../../mobx/Store";
import ViewIndicator from "../customization/ViewIndicator";
import BorderShadow from '../element/BorderShadow';
import {getEventList, getStoreContent} from "../common/FetchRequest";
import moment from "moment";
import EventEditor from "./EventEditor";
import {REFRESH_EVENT_INFO} from "../common/Constant";
import PhoneInfo from "../entities/PhoneInfo";

export default class EventGroup extends Component {
    state = {
        enumSelector: store.enumSelector,
        videoSelector: store.videoSelector,
        viewType: store.enumSelector.viewType.SUCCESS,
        data: []
    };

    // true: all closed event
    static propTypes = {
        storeId: PropTypes.array,
        status: PropTypes.array,
        groupName: PropTypes.string,
        headerName: PropTypes.string,
        indicatorStyle: PropTypes.style,
        onRefresh: PropTypes.func
    };

    static defaultProps = {
        groupName: '',
        headerName: '',
        status: [0,1,2,3],
        indicatorStyle: {}
    };

    componentDidMount() {
        (async () => {
            await this.fetchData();
        })();

        this.refreshEmitter = DeviceEventEmitter.addListener(REFRESH_EVENT_INFO, () => {
            (async () => {
                await this.fetchData();
            })();
        });
    }

    componentWillUnmount(){
        this.refreshEmitter && this.refreshEmitter.remove();
    }

    async fetchData(){
        let {enumSelector, videoSelector} = this.state;
        let {storeId, status} = this.props;

        this.setState({viewType: enumSelector.viewType.LOADING});

        this.status = (status.findIndex(p => p === 2) !== -1) ? [2,4] : status;
        let result = await getEventList({
            beginTs: moment().subtract(89, 'days').startOf('day').unix()*1000,
            endTs: moment().endOf('day').unix()*1000,
            clause: {storeId: storeId, status: this.status},
            filter: {page:0, size:5},
            order: {direction:'desc', property:'ts'}
        });

        if (result.errCode !== enumSelector.errorType.SUCCESS){
            this.setState({viewType: enumSelector.viewType.FAILURE});
            return;
        }

        if (result.data.content.length === 0){
            this.setState({viewType: enumSelector.viewType.EMPTY});
            return;
        }

        result.data.content.forEach((item) => {
            item.subjectUnfold = false;
            item.comment = item.comment.map(v => Object.assign({...v, attachUnfold: false}))
        });

        this.setState({
            data: result.data.content,
            viewType: enumSelector.viewType.SUCCESS
        });

        // videoSelector
        let body = {clause: {storeId: storeId}};
        
        result = await getStoreContent(body);

        videoSelector.storeId = (storeId instanceof Array) ? storeId[0] : storeId;
        videoSelector.content = [];
        if (result.errCode === enumSelector.errorType.SUCCESS){
            videoSelector.content = result.data.content;
        }

        this.setState({
            videoSelector
        });
    }

    onAction(){
        let {storeId} = this.props;
        Actions.push('eventList', {storeId, status: this.status});
    }

    renderHeader(){
        let {groupName, headerName} = this.props, {data} = this.state;
        let width = PhoneInfo.isSimpleLanguage() ? 70 : 120;

        return (
            <View style={styles.header}>
                <Text style={styles.title}>{groupName}</Text>

                <TouchableOpacity activeOpacity={0.5} onPress={() => this.onAction()}>
                    <View style={[styles.action, {width}]}>
                        <Text style={styles.content}>{headerName}</Text>
                    </View>
                </TouchableOpacity>
            </View>
        )
    }

    onRefresh(type){
        this.props.onRefresh && this.props.onRefresh(type);
    }

    renderContent(){
        let {data, viewType, enumSelector} = this.state;

        return (viewType === enumSelector.viewType.SUCCESS) ?
            <View style={styles.dataPanel}>
                <ScrollView showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps={'handled'}>
                    {
                        data.map((item, index) => {
                            return <EventEditor data={item} onRefresh={(type) => this.onRefresh(type)} onData={(response) => {
                                    data[index] = response;
                                    this.setState({data});
                                }}/>
                        })
                    }
                </ScrollView>
            </View> : null
    }

    renderIndicator(){
        let {enumSelector, viewType} = this.state;
        let {indicatorStyle} = this.props;

        return (viewType !== enumSelector.viewType.SUCCESS) ?
            <View style={[styles.indicatorPanel, BorderShadow.div, indicatorStyle]}>
                <ViewIndicator viewType={viewType}
                               containerStyle={{justifyContent: 'center'}}
                               refresh={() => {
                                   (async ()=> this.fetchData())();
                               }}/>
            </View> : null;
    }

    render() {
        let {viewType, enumSelector} = this.state;

        return (
            <View style={styles.container}>
                {this.renderHeader()}
                {this.renderContent()}
                {this.renderIndicator()}
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        borderRadius: 10,
        marginTop:30
    },
    dataPanel:{
        backgroundColor: '#EBF1F372',
        marginTop:12,
        paddingLeft:14,
        paddingRight:14,
        borderRadius:10,
        paddingBottom:20
    },
    indicatorPanel:{
        height:151,
        borderRadius:10,
        backgroundColor: '#fff',
        marginTop:12
    },
    header:{
        flexDirection:'row',
        justifyContent: 'space-between'
    },
    title:{
        fontSize:16,
        color:'#64686D',
        marginLeft:10,
        alignSelf:'center'
    },
    action:{
        height:30,
        borderRadius:10,
        borderColor:'#006AB7',
        borderWidth:1,
        marginRight:14
    },
    content:{
        fontSize:14,
        color:'#006AB7',
        height:30,
        lineHeight:30,
        textAlign:'center',
        textAlignVertical:'center',
        marginTop:-2
    }
});
