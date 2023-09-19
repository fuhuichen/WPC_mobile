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
import store from "../../../mobx/Store";
import ViewIndicator from "../../customization/ViewIndicator";
import BorderShadow from '../../element/BorderShadow';
import moment from "moment";
import EventEditor from "../../event/EventEditor";
import FilterCore from "../common/FilterCore";

const {width} = Dimensions.get('screen');
export default class PatrolEvents extends Component {
    state = {
        enumSelector: store.enumSelector,
        analysisSelector: store.analysisSelector,
        filterSelector: store.filterSelector,
        analysisType: store.enumSelector.analysisType.STORE
    };

    // true: all closed event
    static propTypes = {
        viewType: PropTypes.number,
        data: PropTypes.array,
        reportId: PropTypes.number,
        onRefresh: PropTypes.func,
        requestTime: PropTypes.number
    };

    static defaultProps = {
        viewType: store.enumSelector.viewType.EMPTY,
        data: [],
        reportId: 0,
        requestTime: 0
    };

    onAction(){
        let {analysisType, analysisSelector, filterSelector} = this.state;
        let {reportId, requestTime} = this.props;
        let filter = FilterCore.getFilter(analysisType, filterSelector);

        let request = {
            beginTs: requestTime,
            endTs: requestTime,
            clause: {
                storeId: filter.storeId,
                reportId: reportId
            }
        };

        (filter.userId != null) && (request.clause.assigner = filter.userId);
        (filter.inspect.length === 1) && (request.clause.inspectTagId = filter.inspect[0].id);

        Actions.push('eventList', {filters: request});
    }

    renderHeader(){
        let {data} = this.props;
        let suffix = (data.length > 0) ? ` (${data.length})` : '';

        return (
            <View style={styles.header}>
                <Text style={styles.title}>{I18n.t('Inspection event')}{suffix}</Text>

                <TouchableOpacity activeOpacity={0.5} onPress={() => this.onAction()}>
                    <View style={styles.action}>
                        <Text style={styles.content}>{I18n.t('All event items')}</Text>
                    </View>
                </TouchableOpacity>
            </View>
        )
    }

    onRefresh(type){
        this.props.onRefresh && this.props.onRefresh(type);
    }

    renderContent(){
        let {enumSelector} = this.state;
        let {viewType, data} = this.props;

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
        let {enumSelector} = this.state;
        let {viewType} = this.props;

        return (viewType !== enumSelector.viewType.SUCCESS) ?
            <View style={[styles.indicatorPanel, BorderShadow.div]}>
                <ViewIndicator viewType={viewType}
                               containerStyle={{justifyContent: 'center'}}
                               refresh={() => {
                                   (async ()=> this.fetchData())();
                               }}/>
            </View> : null;
    }

    render() {
        let {enumSelector} = this.state;
        let {viewType} = this.props;

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
        marginTop:12,
        marginLeft:10,
        marginRight:10,
        marginBottom:20
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
        paddingLeft:8,
        paddingRight:8,
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
