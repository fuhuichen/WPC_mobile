import React, {Component} from 'react';

import {
    View,
    Dimensions,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    ScrollView,
    DeviceEventEmitter, Text
} from 'react-native';
import I18n from "react-native-i18n";
import {Actions} from "react-native-router-flux";
import PropType from "prop-types";

const {width} = Dimensions.get('screen');

export default class LineBlock extends Component {

    static propTypes = {
        onTipChange:PropType.func
    }

    constructor(props) {
        super(props);
        this.state = {
            data: Array.from(new Set(this.props.tags))
        }
    }

    tipChange(message){
        this.emitter && this.emitter.remove();
        if (message != null){
/*            this.setState({data: []},()=>{
                this.setState({data:message.data});
            });*/
            this.props.onTipChange(message.data);
        }
    }

    componentWillReceiveProps (nextProps){
        this.setState({data: []},()=>{
            this.setState({data:Array.from(new Set(nextProps.tags))});
        });
    }

    renderBlocks() {
        let data = this.state.data;
        let blocks = data.map((item,index) => {
            return (
                <View style={[styles.basicBtn,{backgroundColor: 'rgba(244,30,101,0.1)',borderColor:'#f31d65'}]}>
                    <Text style={{fontSize: 12,color: '#F21C65'}}>{item.toString()}</Text>
                </View>
            );
        });

        let addButton = (
            <TouchableOpacity style={[styles.basicBtn,{backgroundColor: '#F31D65',borderColor:'#F31D65'}]}
                              onPress={() =>{
                                  this.emitter = DeviceEventEmitter.addListener('OnTipChange', this.tipChange.bind(this));
                                  Actions.push('addTip',{tags:this.state.data,customerId:this.props.customerId});
                              }}
            >
                <Text style={{fontSize: 12,color: '#FFFFFF'}}>{I18n.t('AddStar')}</Text>
            </TouchableOpacity>
        )

        blocks.unshift(addButton);
        return blocks;
    }

    render() {
        return (
                <View style={[styles.btnGroup,{width: this.props.width === null ? width:this.props.width}]}>
                    <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                        {this.renderBlocks()}
                    </ScrollView>
                </View>
        );
    }
}

const styles = StyleSheet.create({
    btnGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    basicBtn: {
        position: 'relative',
        paddingHorizontal: 10,
        marginRight: 10,
        borderRadius: 12,
        borderWidth:1,
        alignItems:'center',
        justifyContent: 'center',
        paddingTop: 3,
        paddingBottom: 3
    }
});
