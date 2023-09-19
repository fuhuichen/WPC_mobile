import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image} from "react-native";
import moment from "moment";
import PropTypes from 'prop-types';
import I18n from 'react-native-i18n';
import TouchableOpacityEx from "../touchables/TouchableOpacityEx";
import store from "../../mobx/Store";

export default class SignFailure extends Component {
    state = {
        enumSelector: store.enumSelector
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
                <TouchableOpacityEx activeOpacity={0.5} onPress={() => this.onClick()}>
                    <Image source={require('../assets/img_sign_failure.png')} style={styles.image}/>
                </TouchableOpacityEx>
                <Text style={styles.title}>{I18n.t('Sign failure')}</Text>
                {component}
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
        paddingTop: 24
    },
    image:{
        width:80,
        height:80
    },
    title:{
        fontSize:20,
        color:'rgb(100,104,109)',
        marginTop: 20
    },
    time:{
        fontSize: 16,
        color:'rgb(100,104,109)',
        marginTop:4
    }
});
