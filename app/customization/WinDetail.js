import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, ScrollView, TouchableOpacity} from "react-native";
import PropTypes from "prop-types";
import {Divider} from "react-native-elements";
import TouchableInactive from "../touchables/TouchableInactive";
import EventBus from "../common/EventBus";
import I18n from "react-native-i18n";

const {width} = Dimensions.get('screen');
export default class WinDetail extends Component {
    static propTypes =  {
        data: PropTypes.object.isRequired,
        sequence: PropTypes.number.isRequired,
        onClose: PropTypes.function
    };

    renderContent(){
        let {subject, description} = this.props.data;

        return <ScrollView style={styles.content}
            showsVerticalScrollIndicator={true}>
            <TouchableInactive>
                <Text style={styles.subject}>{subject}</Text>
                <Text style={styles.description}>{description}</Text>
            </TouchableInactive>
        </ScrollView>

    }

    render() {
        return (
            <View style={styles.container}>
                <Divider style={styles.divider}/>
                <View style={styles.view}>
                    {this.renderContent()}
                </View>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        position:'absolute',
        top:51,
        left:0,
        bottom:0,
        backgroundColor:'#F7F9FA'
    },
    divider:{
        backgroundColor: '#F2F2F2',
        height:2,
        borderBottomWidth:0
    },
    view:{
        flex:1,
    },
    subject:{
        fontSize: 16,
        color:'#86888A',
        marginTop: 12
    },
    content:{
        flex:1,
        width:width,
        marginBottom: 16,
        paddingLeft:22,
        paddingRight:22,
        paddingBottom:10
    },
    description:{
        fontSize: 16,
        color:'#86888A',
        marginTop:16
    },
    range:{
        fontSize:12,
        color:'#86888A',
        marginTop:12
    }
});
