import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image} from "react-native";
import moment from "moment";
import PropTypes from 'prop-types';
import I18n from 'react-native-i18n';
import TouchableOpacityEx from "../touchables/TouchableOpacityEx";
import store from "../../mobx/Store";

export default class LocateSuccess extends Component {
    state = {
        enumSelector: store.enumSelector,
        time: moment().format('HH:mm:ss')
    };

    static propTypes = {
        time: PropTypes.number,
        onData: PropTypes.func
    };

    onClick(){
        let {enumSelector} = this.state;
        let viewType = enumSelector.signType.SIGNING;
        this.props.onData && this.props.onData(viewType);
    }

    render() {
        let {time} = this.props, component = null;
        if (time !== 0){
            component = <Text style={styles.time}>{moment(time).format('HH:mm:ss')}</Text>;
        }

        return (
            <View style={styles.container}>
                <TouchableOpacityEx style={styles.panel} activeOpacity={0.5} onPress={() => this.onClick()}>
                    <Image source={require('../assets/img_locate_success.png')} style={styles.image}/>
                    <Text style={styles.title}>{I18n.t('Patrol Sign in')}</Text>
                    {component}
                </TouchableOpacityEx>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingLeft: 16,
        paddingRight: 16,
        alignItems:'center',
        paddingTop: 19
    },
    panel:{
        width: 180,
        height: 180,
        borderRadius: 90,
        alignItems: 'center'
    },
    image:{
        width:180,
        height:180
    },
    title:{
        position:'absolute',
        top: 50,
        fontSize:20,
        color:'#fff'
    },
    time:{
        position:'absolute',
        top: 90,
        fontSize: 16,
        color:'#fff'
    }
});
