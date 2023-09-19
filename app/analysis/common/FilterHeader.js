import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, ScrollView} from "react-native";
import PropTypes from 'prop-types';
import I18n from 'react-native-i18n';
import BorderShadow from '../../element/BorderShadow';
import {Badge} from "react-native-elements";
import TouchableOpacityEx from "../../touchables/TouchableOpacityEx";
import EventBus from "../../common/EventBus";
import TouchableInactive from "../../touchables/TouchableInactive";
import TouchableActive from "../../touchables/TouchableActive";

const {width} = Dimensions.get('screen');
export default class FilterHeader extends Component {
    static propTypes = {
        content: PropTypes.string,
        onFilter: PropTypes.func
    };

    static defaultProps = {
        content: ''
    };

    onPress(){
        EventBus.closeModalAll();
        this.props.onFilter && this.props.onFilter();
    }

    render() {
        let {content} = this.props;

        return (
            <View style={[styles.container, BorderShadow.div]}>
                <TouchableInactive>
                    <ScrollView style={styles.infoPanel}
                                horizontal={true}
                                showsHorizontalScrollIndicator={false}>
                        <TouchableActive>
                            <Text style={styles.content}>
                                {I18n.t('Filter chosen')}{content}
                            </Text>
                        </TouchableActive>
                    </ScrollView>
                </TouchableInactive>
                <View style={{width:10}}/>
                <TouchableOpacityEx activeOpacity={0.5} onPress={() => this.onPress()}>
                    <Badge value={I18n.t('Filter change')}
                           badgeStyle={styles.badge}
                           textStyle={styles.text}/>
                </TouchableOpacityEx>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        width: width-20,
        height: 38,
        backgroundColor:'#fff',
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent:'space-between',
        paddingLeft:10,
        paddingRight:10
    },
    infoPanel:{
        flex:1
    },
    content:{
        color:'rgb(133,137,142)',
        height: 38,
        lineHeight:38,
        textAlignVertical:'center'
    },
    badge:{
        height:30,
        paddingLeft: 8,
        paddingRight: 8,
        marginTop:3,
        backgroundColor: '#fff',
        borderColor:'rgb(0,106,183)',
        borderWidth:1
    },
    text:{
        fontSize:14,
        color:'rgb(0,106,183)'
    }
});
