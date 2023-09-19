import React, {Component} from 'react';
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    Image,
    FlatList,
    ScrollView,
    DeviceEventEmitter,
    TouchableOpacity
} from "react-native";
import PropTypes from 'prop-types';
import {BoxShadow} from 'react-native-shadow'
import store from "../../../mobx/Store";
import CashCheckCell from "./CashCheckCell";
import TouchableActive from "../../touchables/TouchableActive";
import {Divider} from "react-native-elements";
import {UPDATE_PATROL_LAYOUT} from "../../common/Constant";
import ScrollTop from "../../element/ScrollTop";
import * as BorderShadow from "../../element/BorderShadow";

const {width} = Dimensions.get('screen');
export default class CashCheckGroup extends Component {
    state = {
        enumSelector: store.enumSelector
    };

    static propTypes = {
        data: PropTypes.object.isRequired,
        showSequence: PropTypes.boolean,
        backgroundColor: PropTypes.string,
        onScroll: PropTypes.func
    };

    static defaultProps = {
        backgroundColor: '#F7F9FA',
        showSequence:false
    };

    componentWillMount(){
        this.setParam();
        this.emitter = DeviceEventEmitter.addListener(UPDATE_PATROL_LAYOUT, (value) => {
           this.setParam();
        });
    }

    setParam(){
        this.offset = 120;
        this.reference = 90;
        this.scrollTop = false;
    }

    componentWillUnmount(){
        this.emitter && this.emitter.remove();
    }

    renderSubGroupItem = ({ item,index}) => {
        let {enumSelector} = this.state;
        let maxWidth = width-40;
        return (
            <TouchableActive style={styles.groupPanel}>
                <TouchableOpacity activeOpacity={0.5}>
                    <View style={styles.groupHeader}>
                        <View style={{flexDirection:'row'}}>
                            <Text numberOfLines={1} style={[styles.groupName,{maxWidth}]}>{item.groupName}</Text>
                        </View>
                    </View>
                </TouchableOpacity>
                {item.items.length > 0 && <View style={[styles.group,{marginTop:17}, BorderShadow.div]}>
                    {
                        item.items.map((value, index) =>{
                            return <CashCheckCell maximum={item.items.length} data={{value, index}}/>
                        })
                    }
                </View>}
            </TouchableActive>
        )
    };

    renderItemList = (items) => {
        return (
            <TouchableActive style={styles.groupPanel}>
                {items && items.length > 0 && <View style={[styles.group, BorderShadow.div]}>
                    {
                        items.map((value, index) =>{
                            return <CashCheckCell maximum={items.length} data={{value, index}}/>
                        })
                    }
                </View>}
            </TouchableActive>
        )
    };

    render() {
        let {data,backgroundColor} = this.props;

        let groups = data ? data.groups : [];
        let itemList = data ? data.itemList : [];

        return (
            <View style={{flex:1}}>
                <ScrollView style={[styles.container,{backgroundColor}]}
                            ref={c => this.group = c}
                            showsVerticalScrollIndicator={false}>
                    {groups && groups.length > 0 ? 
                        <FlatList   style={styles.viewPanel}
                                    data={groups}
                                    keyExtractor={(item, index) => index.toString()}
                                    renderItem={this.renderSubGroupItem}
                                    showsVerticalScrollIndicator={false}
                                    ItemSeparatorComponent={() => <Divider style={styles.divider}/>}/> : 
                        <View>
                            {this.renderItemList(itemList)}
                        </View>
                    }
                </ScrollView>
                <ScrollTop onScroll={() => {this.onScroll()}}/>
            </View>
        )
    }

    onScroll(){
        this.group && this.group.scrollTo({x:0,y:0,animated:true})
    }
}

const styles = StyleSheet.create({
    container: {
        paddingLeft: 10,
        paddingRight: 10
    },
    viewPanel:{
        backgroundColor:'#E8EFF472',
        borderRadius:10
    },
    groupPanel:{
        flex:1,
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop:16,
        paddingBottom:20
    },
    groupName:{
        fontSize:14,
        color:'#85898E'
    },
    numerator:{
        fontSize:13,
        marginLeft:6,
        color:'#85898E'
    },
    group:{
        position:'relative',
        width:width-40,
        backgroundColor:'#FFFFFF',
        borderRadius: 10
    },
    divider:{
        marginLeft:10,
        marginRight:10,
        height:2,
        marginTop:10,
        backgroundColor:'#F7F9FA',
        borderBottomWidth:0
    },
    groupHeader:{
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    arrow:{
        width:16,
        height:16,
        marginTop:5,
        marginRight: 20
    }
});
