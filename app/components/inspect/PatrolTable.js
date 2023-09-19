import React, {Component} from 'react';
import {
    View,
    Dimensions,
    StyleSheet,
    Text,
    Platform,
    FlatList
} from 'react-native';
import I18n from "react-native-i18n";

let {width} =  Dimensions.get('screen');
export default class PatrolTable extends Component {
    constructor(props) {
        super(props);
    }

    onRateRow = ({ item}) => {
        return (
            <View style={styles.rowPanel}>
                <View style={[styles.groupPanel,{marginRight:2}]}>
                    <Text style={[styles.groupName,{alignSelf:'center',flex:1}]} numberOfLines={3}>
                        {item.name}
                    </Text>
                    <View style={styles.countPanel}>
                        <Text style={styles.groupCount}>{item.size}</Text>
                    </View>
                </View>
                <View style={{width:70,marginRight:6,justifyContent:'center'}}>
                    <Text style={styles.score}>{item.qualified}</Text>
                </View>
                <View style={{width:70,marginRight:6,justifyContent:'center'}}>
                    <Text style={styles.score}>{item.unqualified}</Text>
                </View>
                <View style={{width:48,justifyContent:'center'}}>
                    <Text style={styles.score}>{item.inapplicable}</Text>
                </View>
            </View>
        )
    };

    renderRate(){
        let category = (<View style={styles.category}>
            <Text style={{fontSize:12,color:'#19293b',textAlign:'center'}}>{I18n.t('Rate evaluation')}</Text>
        </View>);

        let rowHeader = (<View style={styles.headerPanel}>
                <Text style={[styles.headerTitle,{width:width-246}]}>{I18n.t('Items')}</Text>
                <Text style={[styles.headerTitle,{width:70,textAlign:'center',marginRight:6}]}>{I18n.t('Pass')}</Text>
                <Text style={[styles.headerTitle,{width:70,textAlign:'center',marginRight:6}]}>{I18n.t('Failed')}</Text>
                <Text style={[styles.headerTitle,{width:48,textAlign:'center'}]}>{I18n.t('Inapplicable')}</Text>
            </View>);

        return (
            <View>
                {category}
                {rowHeader}
                <FlatList
                    data={this.props.data}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={this.onRateRow}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        )
    }

    onScoreRow = ({ item}) => {
        return (
            <View style={styles.rowPanel}>
                <View style={[styles.groupPanel,{marginRight:14}]}>
                    <Text style={[styles.groupName,{alignSelf:'center',flex:1}]} numberOfLines={3}>
                        {item.name}
                    </Text>
                    <View style={styles.countPanel}>
                        <Text style={styles.groupCount}>{item.size}</Text>
                    </View>
                </View>
                <View style={{width:70,marginRight:6,justifyContent:'center'}}>
                    <Text style={styles.score}>{item.totalPoints}</Text>
                </View>
                <View style={{width:70,marginRight:6,justifyContent:'center'}}>
                    <Text style={styles.score}>{item.inapplicable}</Text>
                </View>
                <View style={{width:36,justifyContent:'center'}}>
                    <Text style={styles.score}>{item.points}</Text>
                </View>
            </View>
        )
    };

    renderScore(){
        let category = (<View style={styles.category}>
            <Text style={{fontSize:12,color:'#19293b',textAlign:'center'}}>{I18n.t('Score evaluation')}</Text>
        </View>);

        let rowHeader = (<View style={styles.headerPanel}>
            <Text style={[styles.headerTitle,{width:width-234}]}>{I18n.t('Items')}</Text>
            <Text style={[styles.headerTitle,{width:70,marginRight:6,textAlign:'center'}]}>{I18n.t('Total score')}</Text>
            <Text style={[styles.headerTitle,{width:70,marginRight:6,textAlign:'center'}]}>{I18n.t('Inapplicable')}</Text>
            <Text style={[styles.headerTitle,{width:36,textAlign:'center'}]}>{I18n.t('Score get')}</Text>
        </View>);

        return (
            <View>
                {category}
                {rowHeader}
                <FlatList
                    data={this.props.data}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={this.onScoreRow}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        )
    }

    onAppendRow = ({ item}) => {
        return (
            <View style={styles.rowPanel}>
                <View style={[styles.groupPanel,{marginRight:0}]}>
                    <Text style={[styles.groupName,{alignSelf:'center',flex:1}]} numberOfLines={3}>
                        {item.name}
                    </Text>
                    <View style={styles.countPanel}>
                        <Text style={styles.groupCount}>{item.size}</Text>
                    </View>
                </View>
                <View style={{width:52,marginRight:6,justifyContent:'center'}}>
                    <Text style={styles.score}>{item.qualified}</Text>
                </View>
                <View style={{width:48,marginRight:6,justifyContent:'center'}}>
                    <Text style={styles.score}>{item.unqualified}</Text>
                </View>
                <View style={{width:48,marginRight:6,justifyContent:'center'}}>
                    <Text style={styles.score}>{item.inapplicable}</Text>
                </View>
                <View style={{width:36,justifyContent:'center'}}>
                    <Text style={styles.score}>{item.points}</Text>
                </View>
            </View>
        )
    };

    renderAppend(){
        let category = (<View style={styles.category}>
            <Text style={{fontSize:12,color:'#19293b',textAlign:'center'}}>{I18n.t('Score append')}</Text>
        </View>);

        let rowHeader = (<View style={styles.headerPanel}>
            <Text style={[styles.headerTitle,{width:width-248}]}>{I18n.t('Items')}</Text>
            <Text style={[styles.headerTitle,{width:52,marginRight:6,textAlign:'center'}]}>{I18n.t('Pass')}</Text>
            <Text style={[styles.headerTitle,{width:48,marginRight:6,textAlign:'center'}]}>{I18n.t('Failed')}</Text>
            <Text style={[styles.headerTitle,{width:48,marginRight:6,textAlign:'center'}]}>{I18n.t('Inapplicable')}</Text>
            <Text style={[styles.headerTitle,{width:36,textAlign:'center'}]}>{I18n.t('Score get')}</Text>
        </View>);

        return (
            <View>
                {category}
                {rowHeader}
                <FlatList
                    data={this.props.data}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={this.onAppendRow}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        )
    }

    render(){
        return (
            <View style={styles.container}>
                {
                    (this.props.type === 0) ? this.renderRate() :
                    (this.props.type === 1) ? this.renderScore() :
                         this.renderAppend()
                }
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff'
    },
    category:{
        width: width-32,
        height: 24,
        marginLeft:16,
        marginTop:10,
        backgroundColor:'#eff4fe',
        justifyContent:'center'
    },
    headerPanel:{
        flexDirection:'row',
        justifyContent:'flex-end',
        alignItems:'flex-start',
        width: width-32,
        height:20,
        marginLeft:16,
        backgroundColor:'#f7f8fa',
        borderBottomWidth:1,
        borderBottomColor:'#dcdcdc'
    },
    headerTitle:{
        fontSize:12,
        color:'#888c95',
        textAlignVertical:'center',
        lineHeight: 20
    },
    rowPanel:{
        flexDirection:'row',
        width:width-32,
        marginLeft:16,
        marginRight:16,
        paddingTop:8,
        paddingBottom:8,
        justifyContent:'flex-end',
        borderBottomWidth: 1,
        borderBottomColor:'#dcdcdc'
    },
    groupPanel:{
        flexDirection:'row',
        justifyContent:'flex-start',
        width: width-32-14-202,
        alignItems:'flex-start',
        marginTop: -1
    },
    groupName:{
        fontSize:12,
        color:'#19293b',
        textAlignVertical:'center'
    },
    countPanel:{
        width:24,
        height:12,
        backgroundColor:'#d5dbe4',
        alignSelf: 'center',
        borderRadius: 4,
        marginLeft: 6,
        ...Platform.select({
            android:{
                marginTop:2,
            }
        }),
        alignItems:'center'
    },
    groupCount:{
        height:12,
        textAlign:'center',
        textAlignVertical:'center',
        fontSize:10,
        ...Platform.select({
           ios:{
               marginTop: -1
           }
        }),
        color:'#888c95',
        lineHeight:13
    },
    score:{
        fontSize:12,
        color:'#19293b',
        textAlign:'center'
    }
});
