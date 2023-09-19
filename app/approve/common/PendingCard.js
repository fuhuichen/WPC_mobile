import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, TouchableOpacity} from "react-native";
import PropTypes from 'prop-types';
import {Divider} from "react-native-elements";
import * as BorderShadow from "../../element/BorderShadow";

const {width} = Dimensions.get('screen');
export default class PendingCard extends Component {
    static propTypes = {
        data: PropTypes.object
    };

    renderData(item){
        return (
            <View style={styles.content}>
                <Text style={styles.nodeName} numberOfLines={1}>{item.nodeName}</Text>
                <Divider style={styles.divider}/>

                <View style={[styles.viewPanel, BorderShadow.div]}>
                    <Text style={styles.jobInfo} numberOfLines={1}>{item.auditTargetName}</Text>
                </View>
            </View>
        )
    }

    render() {
        let {data} = this.props;

        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.dotted}/>
                    <View style={styles.mask}/>
                    <Image source={require('../../assets/img_status_unprocess.png')} style={styles.nodeIcon}/>
                    <View style={{flex:1}}>
                    {
                        data.map((item) => {
                            return this.renderData(item);
                        })
                    }
                    </View>
                </View>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    header:{
        flexDirection:'row',
        justifyContent:'flex-start'
    },
    nodeIcon:{
        width:19,
        height:19,
        zIndex:999
    },
    nodeName:{
        fontSize:14,
        color:'rgb(133,137,142)',
        maxWidth:width-90,
        marginTop:-1
    },
    card:{
        flexDirection: 'row',
        justifyContent: 'flex-start'
    },
    dotted:{
        position:'absolute',
        height: '100%',
        left: 9,
        borderWidth: 2,
        borderRadius: 1,
        borderColor:'rgb(205,208,215)',
        borderStyle: 'dotted'
    },
    mask:{
        position:'absolute',
        height: '100%',
        width: 4,
        left: 11,
        backgroundColor: "rgb(235,241,244)"
    },
    content:{
        marginLeft:10,
        flex:1
    },
    divider:{
        height:2,
        backgroundColor:'rgb(247,249,250)',
        borderBottomWidth:0,
        marginTop:16,
        marginBottom:11
    },
    viewPanel:{
        borderRadius:10,
        backgroundColor:'#fff',
        marginBottom:20,
        paddingLeft:16,
        paddingRight:16,
        paddingTop:14,
        paddingBottom:14
    },
    jobInfo:{
        fontSize:12,
        color:'rgb(100,104,109)'
    }
});
