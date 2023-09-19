import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, TouchableOpacity, Image} from "react-native";
import PropTypes from "prop-types";
import I18n from 'react-native-i18n';
import store from "../../mobx/Store";
import * as lib from '../common/PositionLib';
import {Divider} from "react-native-elements";
import PatrolCore from "../inspection/PatrolCore";

const {width} = Dimensions.get('screen');
const paddingHorizontal = lib.paddingHorizontal();
export default class WinGrade extends Component {
    static propTypes =  {
        data: PropTypes.object.isRequired
    };

    state = {
        grades: [
            {
                name: I18n.t('Failed'),
                score: 0,
                type: store.enumSelector.scoreType.UNQUALIFIED,
                active: require('../assets/img_unqualify_select.png'),
                inactive: require('../assets/img_unqualify_normal.png')
            },
            {
                name: I18n.t('Pass'),
                score: 1,
                type: store.enumSelector.scoreType.QUALIFIED,
                active: require('../assets/img_qualify_select.png'),
                inactive: require('../assets/img_qualify_normal.png')
            }
        ],
        paramSelector: store.paramSelector,
        enumSelector: store.enumSelector,
        patrolSelector: store.patrolSelector
    };

    onGrade(item){
        let {paramSelector, enumSelector} = this.state;
        let data = this.props.data;
        (data.score !== item.score) ? this.props.onGrade(item.score, item.type)
            : this.props.onGrade(paramSelector.unValued, enumSelector.scoreType.SCORELESS);
    }

    render() {
        let {grades, paramSelector,patrolSelector} = this.state;
        let {scoreType, parentType} = this.props.data;
        let bgColor = paramSelector.getBadgeMap().find(p => p.type === scoreType).color;

        let options = PatrolCore.getOptionsForType(patrolSelector,parentType);
        return (
            <View style={styles.container}>
                {
                    grades.map((item, index) => {
                        (options.length > 1) ? (item.name = options[index]) : null;
                        let source = (scoreType !== item.type) ? item.inactive : item.active;
                        let backgroundColor = (scoreType === item.type) ? bgColor : '#F2F5F6';
                        let color = (scoreType === item.type) ? '#FFFFFF' : '#69727C';
                        let borderRadius = (index === 0) ? styles.borderLeft : styles.borderRight;
                        return <TouchableOpacity activeOpacity={1}  onPress={()=>{this.onGrade(item)}}
                                                 style={[styles.panel,{backgroundColor, ...borderRadius}]}>
                            <Image source={source} style={{width:16, height:16}}/>
                            <Text style={[styles.name,{color}]}>{item.name}</Text>
                        </TouchableOpacity>
                    })
                }
                <Divider style={styles.divider}/>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flexDirection:'row',
        justifyContent:'space-between',
        borderRadius:8,
        paddingLeft:40,
        paddingRight:40,
        marginTop:24,
        marginBottom:34,
        alignItems:'center'
    },
    panel:{
        flexDirection:'row',
        justifyContent:'center',
        width:(width-80)/2,
        height:54,
        alignItems:'center'
    },
    name:{
        height:36,
        lineHeight:36,
        fontSize:18,
        textAlignVertical:'center',
        marginLeft:8
    },
    borderLeft:{
        borderTopLeftRadius:15,
        borderBottomLeftRadius:15
    },
    borderRight:{
        borderTopRightRadius:15,
        borderBottomRightRadius: 15
    },
    divider:{
        position:'absolute',
        top:7,
        left:(width-80)/2+39,
        backgroundColor:'#C2C6CC',
        width:2,
        height:40
    }
});
