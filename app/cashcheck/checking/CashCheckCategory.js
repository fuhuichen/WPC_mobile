import React, {Component} from 'react';
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    Image,
    ScrollView,
    DeviceEventEmitter,
    TouchableOpacity
} from "react-native";
import TouchableOpacityEx from "../../touchables/TouchableOpacityEx";
import store from "../../../mobx/Store";
import {ColorStyles} from "../../common/ColorStyles";
import EventBus from "../../common/EventBus";
import {UPDATE_PATROL_LAYOUT} from "../../common/Constant";
import HeadSheet from "../../element/HeadSheet";
import BorderShadow from '../../element/BorderShadow';
import PropTypes from 'prop-types';

const {width} = Dimensions.get('screen');
export default class CashCheckCategory extends Component {
    state = {
        cashcheckSelector: store.cashcheckSelector,
        enumSelector: store.enumSelector,
        screenSelector: store.screenSelector
    };

    constructor(props){
        super(props);
        this.layout = [];
    }

    onScroll(){
        let {cashcheckSelector} = this.state;
        let {categories, categoryType} = cashcheckSelector;
        let index = categories.findIndex(p => p.id === categoryType);
        (index !== -1) ? index : (index = 0);

        this.onCategory(categories[index], index, true);
    }

    onCategory(item, index, autoScroll) {
        let {cashcheckSelector} = this.state;

        cashcheckSelector.categoryType = item.id;
        this.setState({cashcheckSelector}, ()=>{
            EventBus.updateBaseCashCheck();
        });

        if (autoScroll && (this.scroll != null)) {
            let layouts = this.layout.slice(0, index);
            let offset = layouts.reduce((p,e) => p + e.x, 0);
            this.scroll && this.scroll.scrollTo({x: offset, y: 0, animated: true});
        }

        this.props.onClick && this.props.onClick();
    }

    onMore(){
        this.sheet && this.sheet.open();
    }

    onClose(){
        this.sheet && this.sheet.close();
    }

    render() {
        let {cashcheckSelector, enumSelector} = this.state;
        let {categories, categoryType, data} = cashcheckSelector;

        let isDynamic = false;
        categories.forEach(item => {
            if(item.isDynamic == true) {
                isDynamic = true;
            }
        })

        // 編輯報告不可動態增減類別
        if(this.props.isModify == true) {
            isDynamic = false;
        }

        return (
            <View>
                <ScrollView ref={c => {this.scroll = c}} onLayout={(event) => {this.onScroll()}}
                    style={styles.container} horizontal={true} showsHorizontalScrollIndicator={false}>
                    {
                        categories.map((item, index) => {
                            let backgroundColor = (categoryType === item.id) ? ColorStyles.STATUS_BACKGROUND_BLUE : '#ffffff';
                            let color = (categoryType === item.id) ? '#FFFFFF' : '#69727C';
                            let marginLeft = (index === 0) ? 16: 10;

                            return <TouchableOpacityEx activeOpacity={1} onPress={()=>{this.onCategory(item, index, false)}}>
                                <View style={[styles.category,{marginLeft:marginLeft, backgroundColor}, BorderShadow.div]}
                                    onLayout={event => {
                                        let offset = event.nativeEvent.layout.x + event.nativeEvent.layout.width;
                                        let itemLayout = this.layout.find(p => p.id === item.id);
                                        (itemLayout != null) ? (itemLayout.x = offset) : (this.layout.push({id: item.id, x: offset}));
                                    }}>
                                    <Text style={{color}}>{item.name}</Text>
                                </View>
                            </TouchableOpacityEx>
                        })
                    }
                </ScrollView>
                <TouchableOpacity activeOpacity={0.6} onPress={() => {this.onMore()}} style={styles.morePanel}>
                    <View>
                        <Image source={require('../../assets/img_category_more.png')} style={styles.more}/>
                    </View>
                </TouchableOpacity>
                <HeadSheet ref={c => this.sheet = c} data={categories.map(p => p.name)} isDynamic={isDynamic}
                           selectIndex={categories.findIndex(p => p.id === categoryType)}
                           onSelect={(index) => {this.onCategory(categories[index], index, true)}}
                />
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        paddingTop: 6,
        paddingBottom: 24,
        width:width-70
    },
    group: {
        flexDirection:'row',
        justifyContent: 'flex-start',
        alignItems:'center'
    },
    category:{
        flexDirection:'row',
        justifyContent:'flex-start',
        alignItems:'center',
        height: 36,
        borderRadius:10,
        marginTop:10,
        paddingLeft:10,
        paddingRight:10,
        marginBottom:1,
        marginRight:1
    },
    morePanel:{
        width:58,
        height:76,
        backgroundColor: '#F7F9FA',
        position:'absolute',
        top:0,
        right:0
    },
    more:{
        alignSelf:'center',
        width:22,
        height:22,
        marginTop: 23
    },
    check:{
        width:15,
        height:15,
        marginTop:2,
        marginRight: 5
    }
});
