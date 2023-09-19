import React, {Component} from 'react';
import {Dimensions, StyleSheet, View, ScrollView, Text, FlatList} from "react-native";
import {Actions} from "react-native-router-flux";
import PropTypes from "prop-types";
import I18n from "react-native-i18n";
import store from "../../mobx/Store";
import Navigation from "../element/Navigation";
import * as BorderShadow from "../element/BorderShadow";

const {width, height} = Dimensions.get('window');
export default class ApproveRejectDetail extends Component {
    state = {
    };

    static propTypes = {
        enableRouter: PropTypes.boolean
    };

    static defaultProps = {
        enableRouter: true
    };

    componentDidMount(){
    }

    renderItem(item){
        return <View style={[styles.content, BorderShadow.div]}>
            <Text style={styles.text}>{I18n.t('Auditor') + " : " + item.userName}</Text>
            <Text style={styles.text}>{I18n.t('Auditor comments') + " : " + item.extContent}</Text>
        </View>
    }

    render() {
        let {data} = this.props;

        return (
            <View style={styles.container}>
                <Navigation onLeftButtonPress={() => {this.onBack()}} title={I18n.t('Detail')}/>
                <ScrollView ref={c => this.scroll = c} showsVerticalScrollIndicator={false}>
                    <FlatList
                        style={styles.listView}
                        data={data}
                        renderItem={({item}) => this.renderItem(item)}
                        showsVerticalScrollIndicator={false}/>
                </ScrollView>
            </View>
        )
    }

    // function
    onBack(){
        Actions.pop();
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    content: {
        flex: 1,
        borderRadius: 10,
        backgroundColor:'#fff',
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 16,
        paddingBottom: 11,
        marginTop: 15
    },
    listView:{
        width:width-20,
        marginLeft:10,
        marginTop:10,
        padding:15,
        borderRadius:10,
        backgroundColor:'rgba(232,239,244,0.72)'
    },
    text: {
        color:'rgb(134,136,138)',
        marginBottom: 5
    }
});
