import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, ActivityIndicator, Image, TouchableOpacity} from "react-native";
import I18n from "react-native-i18n";
import PropTypes from "prop-types";
import store from "../../mobx/Store";

export default class LocateIndicator extends Component {
    state = {
        enumSelector: store.enumSelector
    };

    static propTypes =  {
        viewType: PropTypes.number,
        refresh: PropTypes.func
    };

    static defaultProps = {
        viewType: store.enumSelector.viewType.LOADING
    };

    refresh(){
        let {viewType} = this.props;
        let {enumSelector} = this.state;

        if (viewType === enumSelector.viewType.FAILURE){
            this.props.refresh && this.props.refresh();
        }
    }

    render() {
        const {viewType} = this.props;
        let {enumSelector} = this.state, description = '';

        let component = null;
        if (viewType === enumSelector.viewType.LOADING){
            component = <ActivityIndicator animating={true} color='#dcdcdc' size='large'/>;
            description = I18n.t('GPS locating');
        }

        if (viewType === enumSelector.viewType.FAILURE){
            component = <Image source={require('../assets/img_locate_failure.png')}
                               style={styles.image} />;
            description = I18n.t('GPS error');
        }

        if (viewType === enumSelector.viewType.EMPTY){
            component = <Image source={require('../assets/img_store_empty.png')}
                               style={styles.image} />;
            description = I18n.t('No Stores');
        }

        return (
            <TouchableOpacity style={styles.container} activeOpacity={1}
                onPress={() => this.refresh()}>
                {component}
                <Text style={styles.prompt}>{description}</Text>
            </TouchableOpacity>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex:1,
        alignItems:'center',
        marginTop:100
    },
    prompt:{
        fontSize:14,
        textAlign:'center',
        color:'#64686D'
    },
    image:{
        width: 100,
        height:100
    }
});
