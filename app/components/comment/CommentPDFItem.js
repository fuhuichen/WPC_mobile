import React, {Component} from 'react';
import {StyleSheet, Image, View, Text, DeviceEventEmitter, TouchableOpacity} from "react-native";
import PropTypes from "prop-types";
import TouchableOpacityEx from "../../touchables/TouchableOpacityEx";
import {Actions} from "react-native-router-flux";
import moment from "moment";
import TouchableInactive from "../../touchables/TouchableInactive";
import {EMITTER_SOUND_STOP} from "../../common/Constant";
import store from "../../../mobx/Store";
import I18n from "react-native-i18n";
import AccessHelper from '../../common/AccessHelper';

export default class CommentPDFItem extends Component {
    state = {
    };

    static propTypes =  {
        width: PropTypes.number,
        height: PropTypes.number,
        showDelete: PropTypes.boolean,
        onDelete: PropTypes.function,
        style: PropTypes.style,
        showDate: PropTypes.boolean
    };

    static defaultProps = {
        width:90,
        height:60,
        showDelete: true,
        style:{},
        showDate: false
    };

    constructor(props) {
        super(props);

        this.deleteUri = require('../../assets/images/comment/icon_text_delete.png');
    }

    onView(uri){
        Actions.push('pdfViewer', {uri});
    }

    render() {
        let {width, height, data, showDelete, style, showDate} = this.props;

        let viewHeight = height, router = () => {};

        return (
            <TouchableInactive style={{marginRight:6}}>
                <View style={[{width,height: viewHeight}, style]}>
                    <TouchableOpacityEx activeOpacity={1} onPress={()=>{this.onView(data.url)}}>
                        <Image style={{width,height,borderRadius:5}} source={require('../../assets/pdf_icon.jpg')} resizeMode='cover'/>
                    </TouchableOpacityEx>
                    {
                        showDelete ? <TouchableOpacityEx activeOpacity={1} style={styles.delete}
                                                          onPress={()=>{this.props.onDelete(data)}}>
                            <Image style={{width:16,height:16}} source={this.deleteUri} />
                        </TouchableOpacityEx> : null
                    }
                    {
                        showDate ? <View style={{width:120}}>
                            <Text style={{fontSize:11,color:'#777777'}}>{moment(new Date(data.ts)).format('YYYY/MM/DD HH:mm')}</Text>
                        </View> : null
                    }
                </View>
                {data.fileName && <Text numberOfLines={1} style={{width:"100%",paddingLeft:5, paddingRight:5}}>{data.fileName}</Text>}
            </TouchableInactive>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        alignItems:'center',
        justifyContent:'center',
        borderRadius:0,
    },
    play:{
        width:20,
        height: 20
    },
    delete:{
        position:'absolute',
        right:4,
        top:4,
        width:16,
        height:16
    },
    device:{
        flexDirection:'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginTop: 4
    },
    camera:{
        width: 14,
        height: 14
    },
    name:{
        fontSize: 10,
        marginLeft: 4,
        color: 'rgb(44,144,217)'
    }
});
