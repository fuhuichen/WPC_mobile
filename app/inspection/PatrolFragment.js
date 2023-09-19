import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, FlatList, TouchableOpacity} from "react-native";
import PropTypes from 'prop-types';
import PatrolEditor from "./PatrolEditor";
import store from "../../mobx/Store";
import {Divider} from "react-native-elements";
import I18n from "react-native-i18n";
import NP from "number-precision/src/index";

const {width} = Dimensions.get('screen');
export default class PatrolFragment extends Component {
    static propTypes = {
        title: PropTypes.string,
        data: PropTypes.array,
        showTitle: PropTypes.boolean,
        isPatrol: PropTypes.boolean,
        showEdit: PropTypes.boolean,
        dataType: PropTypes.number,
        onCategory: PropTypes.func,
        onGroup: PropTypes.func,
        onSubject: PropTypes.func,
        onDetail: PropTypes.func,
        onAttach: PropTypes.func,
        categoryData: PropTypes.array
    };

    static defaultProps = {
        title: '',
        data: [],
        showTitle: false,
        isPatrol: true,
        showEdit: true,
        dataType: store.enumSelector.dataType.INT,
        categoryData: []
    };

    renderTitle(){
        let {showTitle, title} = this.props;
        return (
            showTitle ? <Text style={styles.title}>{title}</Text> : null
        )
    }

    onGroup(item){
        this.props.onGroup && this.props.onGroup(item);
    }

    renderItem({item,index}){
        let {showEdit, dataType, data, isPatrol} = this.props;

        let groupName = null;
        if (item.groupName !== ''){
            let source = item.unfold ? require('../assets/img_unfold_up.png') : require('../assets/img_unfold_down.png');
            groupName = <TouchableOpacity activeOpacity={0.6} onPress={() => this.onGroup(item)}>
                <View style={styles.category}>
                    <View style={styles.badge} />
                    <View style={{maxWidth: width-85}}>
                        <Text style={styles.group}>{item.groupName}</Text>
                    </View>
                    <View style={{flex:1}} />
                    <Image style={styles.arrow} source={source}/>
                </View>
            </TouchableOpacity>
        }

        let groupScore = null;
        if(item.isAdvanced == true) {
            groupScore = item.groupScore;
        }

        return (
            <View style={styles.panel}>
                {groupName}                    
                {
                    (groupName == null || item.unfold) && groupScore && 
                    <View style={styles.groupScore}>
                        <Image style={styles.groupScoreImg} source={require('../assets/img_view_failure.png')}/>
                        <Text style={styles.groupScoreText}>{I18n.t('Score Limit', {score: groupScore})}</Text>
                    </View>
                }                
                {
                    (groupName == null || item.unfold) && item.items.map((key,value) => {
                        return <PatrolEditor isPatrol={isPatrol} showEdit={showEdit} data={{key,value}} dataType={dataType}
                                             onSubject={(data) => {this.props.onSubject && this.props.onSubject(data)}}
                                             onDetail={(data) => {this.props.onDetail && this.props.onDetail(data)}}
                                             onAttach={(data) => {this.props.onAttach && this.props.onAttach(data)}}
                                />
                    })
                }
            </View>
        )
    }

    onCategory(fragment){
        this.props.onCategory && this.props.onCategory(fragment.id);
    }

    getCategoryPoint(category) {
        let {inspectSettings, categoryData} = this.props;
        let includedInTotalScoreWithType1 = false;
        let hundredMarkType = -1;
        if(inspectSettings) {
            let keyIndex = inspectSettings.findIndex(p => p.name === 'includedInTotalScoreWithType1');
            (keyIndex !== -1) ? (includedInTotalScoreWithType1 = inspectSettings[keyIndex].value) : null;

            keyIndex = inspectSettings.findIndex(p => p.name === 'hundredMarkType');
            (keyIndex !== -1) ? (hundredMarkType = inspectSettings[keyIndex].value) : null;
        }
        // hundredMarkType : -1 - original mark system， 0 - hundred mark system, 1 - penalty point system
        let points = 0, ids = [], totalPoints = 0;
        if(category.groups && category.groups.length > 0) {
            category.groups.forEach(group => {
                ids.push(group.groupId);
            })
        }
        let includeTotalScore = true;
        if(category.type == store.enumSelector.categoryType.RATE && includedInTotalScoreWithType1 == false) {
            let scoreCategories = categoryData.filter(p => p.type === store.enumSelector.categoryType.SCORE);
            let appendCategories = categoryData.filter(p => p.type === store.enumSelector.categoryType.APPEND);
            if(scoreCategories != null && scoreCategories.length > 0) {
                includeTotalScore = false;
            } else if(appendCategories != null && appendCategories.length > 0) {
                includeTotalScore = false;
            }
        }
        if(categoryData.length > 0 && includeTotalScore == true) {
            categoryData.forEach(data => {
                if(ids.indexOf(data.groupId) != -1) {
                    //points += (isNaN(data.points) || data.points === Infinity) ? 0 : data.points;
                    points = NP.plus(points, data.points);
                }
                //totalPoints += (isNaN(data.totalPoints) || data.totalPoints === Infinity) ? 0 : data.totalPoints;
                totalPoints = NP.plus(totalPoints, data.totalPoints);
            })
        }
        if(hundredMarkType == 0 && category.type != store.enumSelector.categoryType.APPEND) {   // 比例制
            points = points*100/totalPoints;
            //console.log("points : ", points)
        }
        if(isNaN(points) || points === Infinity) {
            points = 0;
        }
        points = points.toFixed(1);
        return points;
    }

    renderFragment(){
        let {data, inspectSettings} = this.props;
        let setting_isShowGroupSum = false;
        if(inspectSettings) {
            let keyIndex = inspectSettings.findIndex(p => p.name === 'setting_isShowGroupSum');
            (keyIndex !== -1) ? (setting_isShowGroupSum = inspectSettings[keyIndex].value) : null;
        }
        // sort by type
        data.sort((a,b) => a.type - b.type);
        return data.map((fragment, index) => {
            let itemCounts = fragment.groups.reduce((p,e) => p + e.items.length, 0);
            let source = fragment.unfold ? require('../assets/img_unfold_up.png') : require('../assets/img_unfold_down.png');

            let weight = fragment.weight ? fragment.weight : (fragment.groups[0] ? fragment.groups[0].weight : -1);
            let categoryPoint = this.getCategoryPoint(fragment);
            return <View style={{marginBottom:16}}>
                <TouchableOpacity activeOpacity={0.6} onPress={() => this.onCategory(fragment)}>
                    <View style={{marginTop:(index === 0) ? 16 : 0}}>
                        <View style={styles.weight}>
                            {fragment.type != 2 && weight != -1 && <Text>{weight+'%   '}</Text>}
                            {setting_isShowGroupSum && <Text style={styles.score}>{I18n.t('Score get')} : {categoryPoint}</Text>}
                        </View>
                        <View style={styles.category}>
                            <View style={styles.name}>
                                <Text numberOfLines={1}>
                                    <Text>{fragment.name} ({itemCounts})</Text>
                                </Text>
                            </View>
                            <View style={{flex:1}}/>
                            <Image style={styles.arrow} source={source}/>
                        </View>
                    </View>
                </TouchableOpacity>
                {
                    fragment.unfold ? <FlatList data={fragment.groups}
                                                 keyExtractor={(item, index) => index.toString()}
                                                 renderItem={this.renderItem.bind(this)}
                                                 showsHorizontalScrollIndicator={false}/>
                        : null
                }
                {
                    (index !== data.length -1) ? <Divider style={styles.divider}/> : null
                }
            </View>
        })
    }

    render() {
        let {data} = this.props;
        return (
            (data.length > 0) ? <View>
                {this.renderTitle()}
                <View style={styles.container}>
                    {this.renderFragment()}
                 </View>
            </View> : null
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor:'#E8EFF472',
        marginTop:16,
        borderRadius:10,
        paddingLeft:14,
        paddingRight:14
    },
    panel:{
        marginTop: 10
    },
    group:{
        fontSize: 14,
        color:'#85898E',
        marginLeft:4
    },
    weight:{
        flexDirection:'row'
    },
    category:{
        flexDirection:'row',
        justifyContent:'flex-end'
    },
    name:{
        fontSize: 14,
        color:'#85898E',
        maxWidth:width-110,
        flexDirection:'row'
    },
    arrow:{
        width:18,
        height:10,
        marginTop:5,
        marginRight:16
    },
    groupScore:{
        flexDirection:'row',
        justifyContent:'flex-start',
        marginTop:5,
        marginLeft:5
    },
    groupScoreImg:{
        width:18,
        height:18,
        marginRight:5
    },
    groupScoreText:{
        color:'#85898E',
    },
    badge:{
        backgroundColor: '#85898E',
        width:3,
        height: 3,
        borderRadius:1.5,
        marginTop:8
    },
    divider:{
        backgroundColor:'#F7F9FA',
        height:2,
        marginTop:16,
        borderBottomWidth:0
    },
    title:{
        color:'#64686D',
        fontSize:16,
        marginTop:36,
        marginLeft: 16
    },
    score:{
        fontSize: 14,
        color:'#85898E'
    }
});
