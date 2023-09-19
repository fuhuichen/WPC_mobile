import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image} from "react-native";
import moment from "moment";
import PropTypes from 'prop-types';
import I18n from 'react-native-i18n';
import store from "../../mobx/Store";
import {getAdjacent, getSystemTime} from "../common/FetchRequest";

export default class Locating extends Component {
    state = {
        enumSelector: store.enumSelector,
        patrolSelector: store.patrolSelector
    };

    static propTypes = {
        time: PropTypes.number,
        storeId: PropTypes.string,
        onTime: PropTypes.func,
        onData: PropTypes.func
    };

    componentDidMount() {
        (async () => {
            await this.fetchData();
        })();

    }

    async fetchData(){
        try {
            let {enumSelector, patrolSelector} = this.state;
            let {time, storeId} = this.props, viewType = enumSelector.signType.LOCATE_FAILURE;

            if (time === 0){
                // get system time
                let result = await getSystemTime();
                if (result.errCode !== enumSelector.errorType.SUCCESS){
                    this.props.onData && this.props.onData(viewType);
                    return;
                }

                this.props.onTime && this.props.onTime(result.data.ts);
            }

            // location store
            let params = {
                latitude: patrolSelector.latitude,
                longitude: patrolSelector.longitude,
                distance: 500,
                size: 50
            };

            let result = await getAdjacent(params);
            if (result.errCode === enumSelector.errorType.SUCCESS){
                let located = result.data.find(p => p.storeId === storeId);
                if (located != null){
                    viewType = enumSelector.signType.LOCATE_SUCCESS;
                    patrolSelector.distance = located.distance
                }
            }

            this.props.onData && this.props.onData(viewType);
        }catch (e) {
        }
    }

    render() {
        return (
            <View style={styles.container}>
                <Image source={require('../assets/img_sign_locating.png')} style={styles.image}/>
                <Text style={styles.title}>{I18n.t('Store Locating')}</Text>
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
        height:80.5
    },
    title:{
        fontSize:20,
        color:'rgb(0,106,183)',
        marginTop: 20
    }
});
