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
import store from "../../mobx/Store";
import PatrolCell from "./PatrolCell";
import PopupPatrol from "../customization/PopupPatrol";
import TouchableActive from "../touchables/TouchableActive";
import {Divider} from "react-native-elements";
import {UPDATE_PATROL_LAYOUT} from "../common/Constant";
import ScrollTop from "../element/ScrollTop";
import SlotPatrol from "../customization/SlotPatrol";
import * as BorderShadow from "../element/BorderShadow";

const {width} = Dimensions.get('screen');
export default class PatrolGroup extends Component {
    state = {
        enumSelector: store.enumSelector,
        patrolSelector: store.patrolSelector
    };

    static propTypes = {
        data: PropTypes.object.isRequired,
        showSequence: PropTypes.boolean,
        showNumerator: PropTypes.boolean,
        backgroundColor: PropTypes.string,
        onScroll: PropTypes.func,
        onGroup: PropTypes.func
    };

    static defaultProps = {
        backgroundColor: '#F7F9FA',
        showSequence:false,
        showNumerator: false
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

    onGroup(item){
        this.props.onGroup && this.props.onGroup(item);
    }

    renderItem = ({ item,index}) => {
        let {showNumerator} = this.props;
        let {patrolSelector, enumSelector} = this.state;
        let showCamera = (patrolSelector.inspect.mode === enumSelector.patrolType.REMOTE);
        let groupSuffix = '', maxWidth = width-40;

        if (showNumerator){
            let numerator = item.items.filter(p => ((p.scoreType !== enumSelector.scoreType.SCORELESS) || (p.type !== 0 && p.attachment.length > 0)));
            groupSuffix = ` (${numerator.length}/${item.items.length})`;

            maxWidth = maxWidth-90;
        }

        (item.expansion == null) && (item.expansion = true);
        let source = item.expansion ? require('../assets/img_unfold_up.png') : require('../assets/img_unfold_down.png');

        return (
            <TouchableActive style={styles.groupPanel}>
                <TouchableOpacity activeOpacity={0.5} onPress={() => this.onGroup(item)}>
                    <View style={styles.groupHeader}>
                        <View style={{flexDirection:'row'}}>
                            <Text numberOfLines={1} style={[styles.groupName,{maxWidth}]}>{item.groupName}</Text>
                            <Text style={styles.groupName}>{groupSuffix}</Text>
                        </View>
                        <Image source={source} style={styles.arrow}/>
                    </View>
                </TouchableOpacity>
                {
                    item.expansion ? <View style={[styles.group,{marginTop:17}, BorderShadow.div]}>
                        {
                            item.items.map((key,value) =>{
                                return <PatrolCell maximum={item.items.length}
                                                   data={{key,value}}
                                                   showCamera={showCamera}/>
                            })
                        }
                    </View> : null
                }

            </TouchableActive>
        )
    };

    render() {
        let {data,backgroundColor} = this.props;
        return (
            <View style={{flex:1}}>
                <ScrollView style={[styles.container,{backgroundColor}]}
                            ref={c => this.group = c}
                            showsVerticalScrollIndicator={false}>
                    <FlatList style={styles.viewPanel}
                        data={data}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={this.renderItem}
                        showsVerticalScrollIndicator={false}
                        ItemSeparatorComponent={() => <Divider style={styles.divider}/>}/>
                    <SlotPatrol />
                </ScrollView>
                <ScrollTop onScroll={() => {this.onScroll()}}/>
                <PopupPatrol />
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
