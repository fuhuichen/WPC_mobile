import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, TouchableWithoutFeedback,Image} from "react-native";
import PropTypes from "prop-types";
import {inject, observer} from "mobx-react";
import I18n from 'react-native-i18n';
import store from "../../../mobx/Store";
import EventBus from "../../common/EventBus";
import TimeUtil from "../../utils/TimeUtil";
import noTask from "../../assets/images/no_task.png";
import BorderShadow from '../../element/BorderShadow'
import PhoneInfo from "../../entities/PhoneInfo";
import PatrolStorage from "../../components/inspect/PatrolStorage";
const {width} = Dimensions.get('screen');
@inject('store')
@observer
export default class StoreCell extends Component {
    state = {
        storeSelector: store.storeSelector
    };

    static propTypes =  {
        data: PropTypes.object.isRequired
    };

    static defaultProps = {
    };

    onSelect(item){
        EventBus.closeOptionSelector();

        let {storeSelector} = this.state;
        storeSelector.visible = true;
        storeSelector.collection = item;
        this.setState({storeSelector}, () => {
            EventBus.updateBaseStore();
        });
    }

    render() {
        const {data} = this.props;
        let {storeSelector} = this.state, fontSize = 11;
        let temporaries = [];//PatrolStorage.getManualCaches();
        let temporary = temporaries.filter(p => p.storeName === data.key.name);

        const cellSelect = (storeSelector.visible && (storeSelector.collection != null
            && storeSelector.collection.storeId === data.key.storeId));
        PhoneInfo.isJAKOLanguage() && (fontSize = 9);

        return (
            <View>
                <TouchableWithoutFeedback onPress={()=>{this.onSelect(data.key)}}>
                    <View style={[styles.container, {marginLeft: (data.value%3 !== 0) ? 10 : 1,marginTop:12}, BorderShadow.div,
                        cellSelect && BorderShadow.focus]}>
                        <View style={[styles.statusImg]}>
                            <Text style={styles.name} numberOfLines={2}>{data.key.name}</Text>
                        </View>
                        {
                            (temporary.length > 0) ? <Text style={[styles.temporary,{marginTop: (temporary.length > 9) ? 6 : 10, fontSize}]}>
                                {I18n.t('Temporary count',{key: temporary.length})}
                                </Text> : null
                        }
                        <Image source={noTask} style={styles.noTask}/>
                    </View>
                </TouchableWithoutFeedback>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        width: (width-62)/3,
        height: 124,
        borderRadius: 10,
        padding:5,
        backgroundColor:'#ffffff',
        alignItems:'flex-start',
        borderColor:'#2C90D9',
    },
    noTask:{
        position: 'absolute',
        right: 5,
        bottom: 0,
        borderRadius:10,
        width:42,
        height:38
    },
    name:{
        color:'#556679',
        padding:5,
        fontSize:16
    },
    statusImg:{
        height:54,
        borderRadius:5,
        position:'relative',
        width:(width-62)/3-10,
        backgroundColor: '#ECF7FF'
    },
    task:{
        color:'#ffffff',
        fontSize:12
    },
    temporary:{
        fontSize:11,
        color:'#434343',
        marginLeft:6,
        marginTop:6,
        zIndex: 999
    }
});
