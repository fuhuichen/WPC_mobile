import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, ActivityIndicator, Image, TouchableOpacity} from "react-native";
import I18n from "react-native-i18n";
import PropTypes from "prop-types";
import store from "../../mobx/Store";

export default class StoreIndicator extends Component {
    state = {
        enumSelector: store.enumSelector
    };

    static propTypes =  {
        viewType: PropTypes.number,
        prompt: PropTypes.string,
        containerStyle: PropTypes.style,
        indicatorStyle: PropTypes.style,
        promptStyle: PropTypes.style,
        smallIndicator: PropTypes.boolean,
        refresh: PropTypes.func
    };

    static defaultProps = {
        viewType: 0,
        prompt: '',
        containerStyle: {},
        indicatorStyle: {},
        promptStyle:{},
        smallIndicator: false
    };

    refresh(){
        let {viewType} = this.props;
        let {enumSelector} = this.state;
        if (viewType === enumSelector.viewType.FAILURE){
            this.props.refresh && this.props.refresh();
        }
    }

    render() {
        const {viewType, prompt, containerStyle, indicatorStyle, promptStyle, smallIndicator} = this.props;
        let {enumSelector} = this.state, description = '';

        let component = null;
        if (viewType === enumSelector.viewType.LOADING){
            component = <ActivityIndicator animating={true} color='#dcdcdc'
                                           size={smallIndicator ? 'small' : 'large'}/>;
            description = smallIndicator ?  '' : I18n.t('Loading');
        }

        if (viewType === enumSelector.viewType.FAILURE){
            component = <Image source={require('../assets/img_view_failure.png')}
                               style={[styles.image, {...indicatorStyle}]} />;
            description = I18n.t('Load fail');
        }

        if (viewType === enumSelector.viewType.EMPTY){
            let pic = this.props.emptyIcon ? this.props.emptyIcon : require('../assets/img_store_empty.png');
            component = <Image source={pic}
                               style={[styles.image, {...indicatorStyle}]} />;
            description = (prompt != '') ? prompt : I18n.t('No Stores');
        }

        return (
            <TouchableOpacity style={[styles.container,{...containerStyle}]}
                activeOpacity={1} onPress={() => {this.refresh()}}>
                {component}
                <Text style={[styles.prompt,{...promptStyle}]}>{description}</Text>
            </TouchableOpacity>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex:1,
        alignItems:'center'
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
