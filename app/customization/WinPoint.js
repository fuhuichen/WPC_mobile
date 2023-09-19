import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, TouchableOpacity, Platform} from "react-native";
import PropTypes from "prop-types";
import ViewPager  from '@react-native-community/viewpager'
import Dots from 'react-native-dots-pagination';
import {Badge} from "react-native-elements";
import store from "../../mobx/Store";

const {width} = Dimensions.get('screen');
export default class WinPoint extends Component {
    static propTypes =  {
        data: PropTypes.object.isRequired,
        onScore: PropTypes.function
    };

    state = {
        enumSelector: store.enumSelector,
        paramSelector: store.paramSelector,
        patrolSelector: store.patrolSelector,
        primaryKey: null,
        pageCount: 10,
        pageHeight: 182,
        startPage: 0,
        active: 0,
        pages: []
    };

    init(){
        let {primaryKey,pageCount, pageHeight, startPage, active} = this.state;
        let {id, availableScores, score} = this.props.data;

        (id !== primaryKey) && this.setState({pages: []},()=>{
            primaryKey = id;

            let pages = [];
            for(let i = 0; i < availableScores.length; i += pageCount){
                let data = availableScores.slice(i,i + pageCount);
                let iterator = (pageCount - data.length);
                for (let j = 0; j < iterator; j++){
                    data.push(null);
                }
                pages.push(data);
            }

            let scoreKey = availableScores.findIndex(p => p === score);
            startPage = ( scoreKey !== -1) ? Math.floor(scoreKey/pageCount) : 0;
            pageHeight = (availableScores.length > 5) ? 182 : 110;
            this.setState({primaryKey, pages, pageHeight, startPage, active:startPage});

            let interval = Platform.select({ios:100, android:0});
            setTimeout(() => {
                this.viewPager && this.viewPager.setPageWithoutAnimation(startPage);
            }, interval);
        });
    }

    renderPage(callback){
        let {scoreType, score} = this.props.data;
        let {patrolSelector, paramSelector, enumSelector, pages} = this.state;

        let fontSize = (patrolSelector.dataType === enumSelector.dataType.FLOAT) ? 16 : 22;
        return (pages.map((array) => {
            return <View style={styles.panel}>
                {
                    array.map(function(item){
                        let color = (score === item) ? '#FFFFFF' : '#666666';
                        let backgroundColor = (score !== item) ?  '#F2F5F6' : paramSelector.getBadgeMap().find(p => p.type === scoreType).color;
                        return <TouchableOpacity activeOpacity={1} onPress={() => callback(item)}>
                            <Badge value={item} badgeStyle={[styles.badgeStyle, (item != null) ? {backgroundColor} : {backgroundColor:'#fff'}]}
                                textStyle={[styles.textStyle, (item != null) ? {fontSize, color} : {color:'#fff'}]}/>
                        </TouchableOpacity>
                    })
                }
            </View>
        }))
    }

    render() {
        this.init();

        let {pageHeight, startPage, active, pages}  = this.state;

        return (
            <View style={styles.container}>
                <ViewPager initialPage={startPage} style={{height:pageHeight-30,marginLeft:40}}
                           onPageSelected={(event) => this.setState({active:event.nativeEvent.position})}
                           ref={c => this.viewPager = c}>
                    {this.renderPage((score) => {
                        if (score != null){
                            let {enumSelector, pageCount} = this.state;
                            let {qualifiedScore, availableScores} = this.props.data;

                            let scoreType = (score >= qualifiedScore) ? enumSelector.scoreType.PASS : enumSelector.scoreType.FAIL;
                            this.props.onScore && this.props.onScore(score, scoreType);

                            let scoreKey = availableScores.findIndex(p => p === score);
                            startPage = ( scoreKey !== -1) ? Math.floor(scoreKey/pageCount) : 0;
                            this.setState({startPage});
                        }
                    })}
                </ViewPager>
                <View style={styles.dotPanel}>
                    {
                        (pages.length > 1) ? <Dots length={pages.length} active={active} passiveDotWidth={4}
                                                 passiveDotHeight={4} activeDotWidth={12} activeDotHeight={4}
                                                 alignDotsOnXAxis={-1}/> : null
                    }
                </View>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        paddingLeft: 0,
        paddingRight: 0,
    },
    panel:{
        flexDirection: 'row',
        paddingTop:8,
        flexWrap: 'wrap'
    },
    textStyle:{
        color:'#666666',
        fontSize:16,
        ...Platform.select({
            android:{
                fontFamily:'Roboto'
            }
        })
    },
    badgeStyle:{
        width:54,
        height:54,
        marginRight: Math.floor((width-80-54*5)/4),
        borderWidth:0,
        borderRadius:27,
        marginTop:16,
        backgroundColor: '#F2F5F6'
    },
    dotPanel:{
        height:30
    }
});
