import React, {Component} from 'react';
import PropTypes from 'prop-types';
import I18n from 'react-native-i18n';;
import {
    StyleSheet,
    View,
    Text,
    ActivityIndicator,
    Dimensions
} from 'react-native';

//import { Dialog } from 'react-native-simple-dialogs';

export default class Spinner extends Component {
    static propTypes = {
        title:PropTypes.string,
        color: PropTypes.string
    };

    defaultProps = {
        color: '#ffffff'
    };

    constructor(props) {
        super(props);
        this.state = {
            visible: false
        };
    }
    render() {
       const screen = Dimensions.get('window')
       if(this.props.visible){
         return (
             <View style={[styles.overlay, {zIndex:0,width:screen.width,height:screen.height}]}>
               <View style={[styles.content,{backgroundColor: this.props.color}]}>
                 <ActivityIndicator animating={true} color='#ffffff' size="large"/>
                 <Text allowFontScaling={false} style={{textAlign:'center',color:'#9DA0AF',fontSize:18,paddingTop:20}}>
                   {I18n.t("bi_loading")+'…'}
                 </Text>
               </View>
             </View>
         );
       }
       else{
         return <View/>
       }

    }
}

var styles = StyleSheet.create({
    overlay:{
        backgroundColor:'transparent',
        position:'absolute',top:0,left:0,
        justifyContent:'center',
        alignItems:'center',
    },
    dialog: {
        backgroundColor:'#24293d',
        opacity:0.75,
        width:100,
        height:90,
        alignSelf:'center',
        borderRadius:8
    },
    content:{
        width:100,
        height:90,
        alignSelf:'center',
        marginTop: -100
    },
    title:{
        fontSize:14,
        marginTop:5,
        alignSelf:'center',
        color:'#ffffff'
    }
});
