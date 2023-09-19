import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image} from "react-native";
import moment from "moment";
import PropTypes from 'prop-types';
import I18n from 'react-native-i18n';
import store from "../../mobx/Store";
import {uploadCheckin} from "../common/FetchRequest";

export default class Signing extends Component {
    state = {
        enumSelector: store.enumSelector,
        patrolSelector: store.patrolSelector
    };

    static propTypes = {
        time: PropTypes.number,
        onData: PropTypes.func
    };

    componentDidMount(){
        (async () => {
            await this.fetchData();
        })();
    }

    async fetchData(){
        try {
            let {enumSelector, patrolSelector} = this.state;
            let {time} = this.props, viewType = enumSelector.signType.SIGN_FAILURE;
            
            let result = await uploadCheckin({
                ts: time,
                longitude: patrolSelector.longitude,
                latitude: patrolSelector.latitude,
                isCheckInIgnore: false
            });

            if (result.errCode === enumSelector.errorType.SUCCESS){
                patrolSelector.checkinId = result.data.id;
                patrolSelector.signTime = time;
                patrolSelector.checkinIgnore = false;
                this.setState({patrolSelector});

                viewType = enumSelector.signType.SIGN_SUCCESS;
            }

            this.props.onData && this.props.onData(viewType);
        }catch (e) {
        }
    }

    render() {
        let {time} = this.props, component = null;
        if (time !== 0){
            component = <Text style={styles.time}>{moment(time).format('HH:mm:ss')}</Text>;
        }

        return (
            <View style={styles.container}>
                <Image source={require('../assets/img_signing.png')} style={styles.image}/>
                <Text style={styles.title}>{I18n.t('Patrol Signing')}</Text>
                {component}
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
        height:80
    },
    title:{
        fontSize:20,
        color:'rgb(0,106,183)',
        marginTop: 20
    },
    time:{
        fontSize: 16,
        color:'rgb(100,104,109)',
        marginTop:4
    }
});
