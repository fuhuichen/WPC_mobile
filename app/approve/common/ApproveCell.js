import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, TouchableOpacity} from "react-native";
import PropTypes from 'prop-types';
import {Divider} from "react-native-elements";
import I18n from 'react-native-i18n';
import {Actions} from "react-native-router-flux";
import store from "../../../mobx/Store";
import * as BorderShadow from "../../element/BorderShadow";
import moment from "moment";
import TouchableActive from "../../touchables/TouchableActive";

const {width} = Dimensions.get('screen');
export default class ApproveCell extends Component {
    state = {
        enumSelector: store.enumSelector,
        paramSelector: store.paramSelector,
        approveSelector: store.approveSelector
    };

    static propTypes = {
        data: PropTypes.object.isRequired,
        showSubmitter: PropTypes.boolean
    };

    static defaultProps = {
        showSubmitter: true
    };

    constructor(props){
        super(props);

        let {enumSelector} = this.state;
        this.routers = [
            {
                type: enumSelector.approveType.PENDING,
                router: () => {Actions.push('pageReview')}
            },
            /*{
                type: enumSelector.approveType.UNCOMMITTED,
                router: () => {Actions.push('pageUncommitted')}
            },
            {
                type: enumSelector.approveType.APPROVED,
                router: () => {Actions.push('pageOverview')}
            },*/
            {
                type: enumSelector.approveType.SUBMITTED,
                router: () => {Actions.push('pageOverview')}
            },
            {
                type: enumSelector.approveType.CC_MINE,
                router: () => {Actions.push('pageOverview')}
            }
        ];
    }

    onRouter(){
        let {data} = this.props;
        let {approveSelector} = this.state;
        approveSelector.collection = data;

        this.setState({approveSelector}, () => {
            let approveRouter = this.routers.find(p => p.type === approveSelector.type);
            approveRouter.router();
        });
    }

    render() {
        let {data, showSubmitter} = this.props;
        let {paramSelector, enumSelector} = this.state, status = '';
        let statusMap = paramSelector.getApproveMap().find(p => p.type === data.auditState);

        if (statusMap != null){
            status = statusMap.name;

            if (data.auditState === enumSelector.auditState.PROCESSING){
                status = status + " : " + data.taskOwner;
            }
        }

        return (
            <TouchableOpacity activeOpacity={1} onPress={() => {this.onRouter()}}>
                <View style={[styles.container, BorderShadow.div]}>
                    <Text style={styles.storeName} numberOfLines={1}>{data.storeName}</Text>
                    <Divider style={styles.divider}/>
                    <Text style={[styles.content,{marginTop:12}]} numberOfLines={1}>{data.reportName}</Text>
                    <View style={styles.panel}>
                        {
                            showSubmitter && (data.submitterName !== '') && <Text style={[styles.content,{maxWidth: width-190,marginRight:3}]} numberOfLines={1}>
                                    {I18n.t('Approve Submitter')}: {data.submitterName}
                                </Text>
                        }
                        <Text style={styles.date}>({moment(data.processStartTs).format('YYYY/MM/DD HH:mm')})</Text>
                    </View>
                    {(status !== '') && <Text style={[styles.status,{color:statusMap.color}]}>{status}</Text>}
                </View>
            </TouchableOpacity>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex:1,
        width: width-48,
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 16,
        paddingBottom: 11,
        borderRadius: 10,
        backgroundColor: '#fff',
        marginTop: 12
    },
    storeName:{
        fontSize: 14,
        color: 'rgb(0,106,183)',
        maxWidth: width-80
    },
    divider:{
        width: width-80,
        height: 2,
        borderBottomWidth: 0,
        marginTop: 11,
        backgroundColor:'#F2F2F2',
    },
    content:{
        fontSize: 12,
        color: 'rgb(134,136,138)'
    },
    panel:{
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: 7
    },
    date:{
        fontSize: 12,
        color: 'rgb(134,136,138)'
    },
    status:{
        fontSize: 12,
        color: 'rgb(0,106,183)',
        marginTop: 7
    }
});
