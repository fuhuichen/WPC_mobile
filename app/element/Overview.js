import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, TouchableOpacity, ScrollView} from "react-native";
import PropTypes from 'prop-types';
import I18n from 'react-native-i18n';
import EventBus from "../common/EventBus";
import PhoneInfo from "../entities/PhoneInfo";

const {width} =  Dimensions.get('window');
export default class Overview extends Component{
    static propTypes =  {
        data: PropTypes.array.isRequired,
        showIcon: PropTypes.boolean,
        onChange: PropTypes.function,
        title: PropTypes.string
    };

    static defaultProps = {
        showIcon: true
    };

    state = {
        id: 0
    };

    constructor(props){
        super(props);
    }

    doAction(id){
        EventBus.closeModalStore();
        this.setState({id});
        this.props.onChange && this.props.onChange(id);
    }

    render() {
        let {data, showIcon, title} = this.props;
        let {id} = this.state;
        if(this.props.id && id != this.props.id) {
            this.setState({id: this.props.id});
        }
        if(title == null) {
            title = I18n.t('ViuMo');
        }

        let fontSize = 28;
        PhoneInfo.isTHLanguage() && (fontSize = 24);

        return <View style={styles.container}>
            <Text style={[styles.navTitle, {fontSize}]}>{title}</Text>

            <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                <View style={styles.group}>
                    {
                        data.map((item,index) => {
                            let backgroundColor = (id === item.id) ? '#C60957' : '#006AB7';
                            return (
                                <View style={{alignItems:'center',marginRight:10}}>
                                    <TouchableOpacity activeOpacity={1} onPress={()=>{this.doAction(item.id)}}>
                                        <View style={[styles.round,{backgroundColor:backgroundColor}]}>
                                            {
                                                showIcon ? <Image style={{width:item.width,height:item.height,marginRight:4}} source={item.uri} />
                                                    : null
                                            }
                                            <Text style={styles.desText}>{item.name}</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            )
                        })
                    }
                </View>
            </ScrollView>
        </View>
    }
}

const styles = StyleSheet.create({
    container: {
        backgroundColor:'transparent',
        paddingLeft:16,
        paddingRight:16,
        paddingTop:18
    },
    navTitle:{
        fontSize:28,
        color:'#ffffff'
    },
    panel: {
        height: 26,
        lineHeight:26,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom:17
    },
    panelTitle:{
        fontSize:19,
        color:'#484848',
    },
    desText:{
        fontSize:16,
        color:'#ffffff',
    },
    allIcon:{
        width:18,
        height:16,
        marginLeft:9,
    },
    group: {
        flexDirection:'row',
        justifyContent: 'flex-start',
        alignItems:'center',
        marginTop:15
    },
    round: {
        paddingLeft:10,
        paddingRight:10,
        height: 36,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems:'center'
    }
});
