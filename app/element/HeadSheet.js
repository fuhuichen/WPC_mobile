import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, TouchableOpacity, ScrollView, Platform} from "react-native";
import SlideModalEx from "../components/SlideModal";
import PropTypes from 'prop-types';
import I18n from 'react-native-i18n';
import BorderShadow from '../element/BorderShadow';
import ModalCashCheckDynamicSet from "../customization/ModalCashCheckDynamicSet";

const {width} = Dimensions.get('screen');
export default class HeadSheet extends Component {
    static propTypes = {
        data: PropTypes.array,
        selectIndex: PropTypes.number,
        onSelect: PropTypes.func,
        isDynamic: PropTypes.bool
    };

    static defaultProps = {
        data: [],
        selectIndex: 0,
        isDynamic: false
    };

    open(){
        let {data} = this.props;
        (data.length > 0) && (this.more && this.more.open());
    }

    close(){
        this.more && this.more.close();
    }

    onSelect(index){
        this.props.onSelect && this.props.onSelect(index);
        this.close();
    }

    onDynamicEdit() {
        this.ModalCashCheckDynamicSet && this.ModalCashCheckDynamicSet.open();
    }

    render() {
        let {data, selectIndex, isDynamic} = this.props;

        return (
            <SlideModalEx ref={(c) => { this.more = c; }} offsetY={Platform.select({android:56,ios:78})} width={width}>
                <View style={styles.container}>
                    {
                        (data.length > 0) ? <ScrollView>
                            <View style={styles.panel}>
                                {
                                    data.map((item, index) => {
                                        let backgroundColor = (index === selectIndex) ? '#006AB7' : '#fff';
                                        let color = (index === selectIndex) ? '#fff' : '#69727C';
                                        return <View style={[styles.badge,{backgroundColor}, BorderShadow.div]}>
                                            <TouchableOpacity activeOpacity={0.6} onPress={() => {this.onSelect(index)}}>
                                                <View>
                                                    <Text style={{color}}>{item}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        </View>
                                    })
                                }
                                {isDynamic && <TouchableOpacity onPress={() => this.onDynamicEdit()}>
                                    <Image source={require('../assets/images/comment/icon_text_edit.png')} style={styles.dynamicEdit}/>
                                </TouchableOpacity>}
                            </View>
                        </ScrollView> : <Text style={styles.prompt}>{I18n.t('No data')}</Text>
                    }
                    <TouchableOpacity activeOpacity={0.6} onPress={() => this.close()}>
                        <View style={styles.operator}>
                            <Text style={styles.collapse}>{I18n.t('Click collapse')}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
                <ModalCashCheckDynamicSet ref={c => this.ModalCashCheckDynamicSet = c}/>
            </SlideModalEx>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex:1,
        maxHeight:360,
        backgroundColor:'#F7F9FA',
        borderBottomStartRadius:10,
        borderBottomEndRadius:10
    },
    panel:{
        flexDirection:'row',
        justifyContent:'flex-start',
        flexWrap:'wrap',
        paddingLeft:6,
        paddingRight:10,
        paddingTop:4,
        paddingBottom: 20
    },
    operator:{
        height:52,
        backgroundColor:'#fff',
        borderBottomStartRadius:10,
        borderBottomEndRadius:10
    },
    collapse:{
        height: 52,
        lineHeight:52,
        textAlign: 'center',
        textAlignVertical:'center',
        color:'#006AB7',
        fontSize:16,
        fontWeight: 'bold'
    },
    badge:{
        paddingTop:6,
        paddingBottom:6,
        paddingLeft: 10,
        paddingRight: 10,
        borderRadius:10,
        marginTop:12,
        marginLeft:10
    },
    prompt:{
        color:'#69727C'
    },
    dynamicEdit:{
        width:20,
        height:20,
        marginLeft:10,
        marginTop:18,
        //marginRight:-2
    }
});
