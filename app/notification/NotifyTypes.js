import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, ScrollView} from "react-native";
import I18n from 'react-native-i18n';
import PropTypes from 'prop-types';
import store from "../../mobx/Store";
import TouchableOpacityEx from "../touchables/TouchableOpacityEx";
import * as BorderShadow from "../element/BorderShadow";
import {getScheduleWhiteList} from "../common/FetchRequest";

const {width} = Dimensions.get('screen');
export default class NotifyTypes extends Component {
    state = {
        enumSelector: store.enumSelector,
        notifySelector: store.notifySelector,
        categories: [
            {
                type: store.enumSelector.notifyType.EVENT,
                active: require('../assets/notify_event_select.png'),
                inactive: require('../assets/notify_event_normal.png'),
                name: I18n.t('Missing items')
            },
            {
                type: store.enumSelector.notifyType.REPORT,
                active: require('../assets/notify_report_select.png'),
                inactive: require('../assets/notify_report_normal.png'),
                name: I18n.t('Reports')
            },
            {
                type: store.enumSelector.notifyType.APPROVE,
                active: require('../assets/notify_approve_select.png'),
                inactive: require('../assets/notify_approve_normal.png'),
                name: I18n.t('Approve')
            },
            /*{
                type: store.enumSelector.notifyType.SCHEDULE,
                active: require('../assets/notify_schedule_select.png'),
                inactive: require('../assets/notify_schedule_normal.png'),
                name: I18n.t('Schedule')
            }*/
        ]
    };

    componentDidMount() {
        (async () => {
            let result = await getScheduleWhiteList();
            let whiteList = result.data;
            let isShowSchedule = false;
            if(whiteList.length > 0) {
                if(whiteList.indexOf(store.userSelector.accountId) != -1) {
                    isShowSchedule = true;
                }
            }
            if(isShowSchedule == true) {
                let categories = [
                    {
                        type: store.enumSelector.notifyType.EVENT,
                        active: require('../assets/notify_event_select.png'),
                        inactive: require('../assets/notify_event_normal.png'),
                        name: I18n.t('Missing items')
                    },
                    {
                        type: store.enumSelector.notifyType.REPORT,
                        active: require('../assets/notify_report_select.png'),
                        inactive: require('../assets/notify_report_normal.png'),
                        name: I18n.t('Reports')
                    },
                    {
                        type: store.enumSelector.notifyType.APPROVE,
                        active: require('../assets/notify_approve_select.png'),
                        inactive: require('../assets/notify_approve_normal.png'),
                        name: I18n.t('Approve')
                    },
                    {
                        type: store.enumSelector.notifyType.SCHEDULE,
                        active: require('../assets/notify_schedule_select.png'),
                        inactive: require('../assets/notify_schedule_normal.png'),
                        name: I18n.t('Schedule')
                    }
                ];
                this.setState({categories});
            }
        })()        
    }

    static propTypes = {
        onCategory: PropTypes.func
    };

    onCategory(item, index){
        let {notifySelector} = this.state;

        if (notifySelector.type !== item.type){
            notifySelector.type = item.type;
            this.setState(notifySelector, () => {
                this.props.onCategory && this.props.onCategory();
            });
        }
    }

    render() {
        let {categories, enumSelector, notifySelector} = this.state;

        return (
            <View style={styles.container}>
                <ScrollView horizontal={true}
                            showsHorizontalScrollIndicator={false}>
                    {
                        categories.map((item, index) => {
                            let marginLeft = (index === 0) ? 16 : 10;
                            let color = (item.type === notifySelector.type) ? '#fff' : 'rgb(105,114,124)';
                            let backgroundColor = (item.type === notifySelector.type) ? 'rgb(0,106,183)' : '#fff';
                            let source = (item.type === notifySelector.type) ? item.active : item.inactive;

                            return <TouchableOpacityEx activeOpacity={1} onPress={() => {this.onCategory(item, index)}}>
                                    <View style={[styles.category, {marginLeft, backgroundColor},
                                        (item.type !== notifySelector.type) && BorderShadow.div]}>
                                        <Image source={source} style={styles.source}/>
                                        <Text style={[styles.name, {color}]}>{item.name}</Text>
                                    </View>
                                </TouchableOpacityEx>
                        })
                    }
                </ScrollView>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        marginTop:16,
        height:52,
        paddingRight:10
    },
    category:{
        flexDirection:'row',
        justifyContent:'flex-start',
        height:36,
        borderRadius:10,
        paddingLeft: 8,
        paddingRight: 10
    },
    source:{
        width:20,
        height:20,
        alignSelf:'center'
    },
    name:{
        fontSize:14,
        marginLeft:4,
        height:36,
        lineHeight:36,
        textAlignVertical:'center'
    }
});
