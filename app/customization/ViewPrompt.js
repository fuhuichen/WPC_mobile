import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, ActivityIndicator,Image} from "react-native";
import I18n from "react-native-i18n";
import PropTypes from "prop-types";
import store from "../../mobx/Store";

export default class ViewPrompt extends Component {
    static propTypes =  {
        height: PropTypes.number,
        loadType: PropTypes.number,
        type: PropTypes.number,
        top: PropTypes.number,
        summary: PropTypes.boolean
    };

    static defaultProps = {
        height:0,
        loadType:0,
        type:-1,
        top:0,
        summary:false
    };

    constructor(props) {
        super(props)

        this.promptMap = store.paramSelector.promptMap;
        this.loadType = this.promptMap.find(p=>p.type === this.props.loadType).data;
    }

    render() {
        const {height,type,top,summary} = this.props;

        let Icon = null;
        if(type === 0){
            Icon = <ActivityIndicator animating={true} color='#dcdcdc' size="large"/>
        }else{
            Icon = <Image source={this.loadType[type].uri} style={summary ? styles.img : null}/>
        }
        return (
            <View style={[styles.container,(height == 0) ? {flex:1,paddingTop:top} :
                {height:height,justifyContent: 'center'}]}>
                {Icon}
                {!summary && <Text style={styles.prompt}>{this.loadType[type].text}</Text>}
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        alignItems:'center',
    },
    prompt:{
        fontSize:12,
        textAlign:'center',
        marginTop:10
    },
    img:{
        width:40,
        height:40,
        marginTop:6,
        marginLeft:10
    }
});
