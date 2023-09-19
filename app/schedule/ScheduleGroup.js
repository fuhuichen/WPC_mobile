import React, {Component} from 'react';
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    Image,
    FlatList,
    ScrollView,
    Platform,
    ActivityIndicator
} from "react-native";
import PropTypes from 'prop-types';
import ScheduleCell from "./ScheduleCell";
import I18n from "react-native-i18n";
import SlotView from "../customization/SlotView";
import * as lib from '../common/PositionLib';
import ScrollTop from "../element/ScrollTop";

import DimUtil from '../common/DimUtil'
const {height,width} = DimUtil.getDimensions("portrait")

export default class ScheduleGroup extends Component {
    state = {
        showFooter: 0, // 0: hidden, 1: no more data, 2: loading
        currentPage: 0,
        lastPage: true,
        onEndReached: false,
        onPull:false,
        contentOffset: 0,
        showScrollTop: false,
    };

    static propTypes = {
        data: PropTypes.object,
        verticalOffset: PropTypes.number,
        showSubmitter: PropTypes.boolean,
        onFetch: PropTypes.func
    };

    static defaultProps = {
        data: [],
        verticalOffset: Platform.select(
            {
                android: 280,
                ios: lib.defaultStatusHeight()+280
            }),
        showSubmitter: true
    };

    constructor(props){
        super(props);

        this.scrollEnd = false;
    }

    setProperty(params){
        this.setState({lastPage: params.lastPage, onEndReached: false}, () => {
            this.scrollEnd = false;
        });
    }

    renderItem = ({ item,index}) => {
        return <ScheduleCell data={item} />
    };

    render() {
        let {showScrollTop} = this.state;
        let {data,verticalOffset} = this.props;

        return  <View>
                    <FlatList style={[styles.list,{maxHeight:height-verticalOffset}]}
                        data={data}
                        ref={c => this.ref = c}
                        onScroll={(evt) => {
                            let showScrollTop = (evt.nativeEvent.contentOffset.y > 200);
                            this.setState({contentOffset: evt.nativeEvent.contentOffset.y, showScrollTop});
                        }}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={this.renderItem}
                        showsVerticalScrollIndicator={false}
                        refreshing={false}
                        onEndReached={() => this.onEndReached()}
                        onEndReachedThreshold={0.1}
                        ListFooterComponent={() => this.renderFooter()}/>
                    <ScrollTop showOperator={showScrollTop} onScroll={() => {this.ref && this.ref.scrollToOffset({ offset: 0, animated: true });}}/>
                </View>
    }

    onEndReached(){
        let {data, verticalOffset} = this.props;

        try {
            if(this.state.lastPage) {
                {
                    ((data.length*135 + (data.length-1)*12 + 32) >= (height-verticalOffset))
                        ? this.setState({showFooter: 1}) : this.setState({showFooter: 0});
                    return;
                }
            }

            if(!this.state.onEndReached){
                let page = ++this.state.currentPage;
                this.setState({onEndReached: true,showFooter: 2,currentPage:page});
                this.props.onFetch && this.props.onFetch(page);
            }
        }catch(e){
        }
    }

    renderFooter(){
        let {showFooter} = this.state, component = null;
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
                <SlotView containerStyle={{height:20}}/>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    list:{
        marginTop:17,
        backgroundColor:'#EDF0F2',
        borderRadius:10,
        paddingLeft:14,
        paddingRight:14,
        paddingTop:4,
        paddingBottom: 16
    },
    footer:{
        flexDirection:'row',
        height:24,
        justifyContent:'center',
        alignItems:'center',
        marginBottom:10,
    }
});
