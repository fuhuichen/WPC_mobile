import React, { Component } from 'react';
import { StyleSheet, View, PanResponder, I18nManager, TouchableOpacity, Animated,Text} from 'react-native';

import { ScrollView } from 'react-native-gesture-handler';

export default class DragDropAnalysisObj extends Component {
    constructor(props) {
        super(props);
        this.props = props;
        this.long_press_timeout = null;
        this._previousLeft = 0;
        this._previousTop = this.props.objData.objTop;
        this._previouszIndex = 20;
        this.isMovePanResponder = false;
        this.inputRange = [1,1.1];
        this.outputRange = [0.8,1];
        this._previousScale = new Animated.Value(1);
        this._objectDragingStyles = {
            style: {
              left: this._previousLeft,
              top: this._previousTop,
              zIndex:this._previouszIndex,
              transform: [{scale:1}],
              opacity: 1
              //backgroundColor:'#FFF'
            },
          };
        this.state = {locationStore: []}
    }
    componentWillMount() {
        this._panResponder = PanResponder.create({
            onStartShouldSetPanResponder:  (evt, gestureState) => true, //是否對點擊有反應
            onStartShouldSetPanResponderCapture: (evt, gestureState) => false,//()=>this.startTouch(),
            _onChildStartShouldSetPanResponderCapture:(evt, gestureState) => true,
            onMoveShouldSetPanResponder: (evt, gestureState) => this.isMovePanResponder,
            onMoveShouldSetPanResponderCapture: (evt, gestureState) => this.isMovePanResponder,
            onPanResponderGrant: this._handlePanResponderGrant,
            onPanResponderMove: this._handlePanResponderMove, //手指正在移動
            onPanResponderEnd:this._handlePanResponderEnd,
            onPanResponderRelease: this._handlePanResponderEnd,
            onPanResponderTerminationRequest: (evt, gestureState) => true,
            onPanResponderTerminate: this._handlePanResponderEnd,

            onPanResponderStart:(evt, gestureState) => {
                console.log("3. PanResStart");
                this.startTouch();
            }
        });
        
        
    }
        componentDidMount() {
            this._updateNativeStyles();
          }

        _updateNativeStyles = () => {
            //console.log('Update style:');
            this.statisticObj && this.statisticObj.setNativeProps(this._objectDragingStyles);
          };

        _handlePanResponderGrant(e, gestureState) {
            //console.log('2 Grant,e:',e);
            
        }
        _handlePanResponderMove = (e, gestureState) => {
            //console.log('4.moving',this.isMovePanResponder);
            
            if(this.isMovePanResponder){
                clearTimeout(this.long_press_timeout);
                this._objectDragingStyles.style.zIndex = 999; 
                this._objectDragingStyles.style.left = this._previousLeft + gestureState.dx * (I18nManager.isRTL ? -1 : 1);
                this._objectDragingStyles.style.top = this._previousTop + gestureState.dy;
                
                this._updateNativeStyles();
            }
          //this.isMovePanResponder = false;
          
        };
        _handlePanResponderEnd = (e, gestureState) => {
            const ItemWidth = this.props.objWidth;
            const ItemHeight= this.props.objData.objHeight;
            console.log("release");
            clearTimeout(this.long_press_timeout);
            if(this.isMovePanResponder){
              //this._previousScale = new Animated.Value(1);
              this._objectDragingStyles.style.transform = [{scale:1}];
              //this._objectDragingStyles.style.opacity = this._previousScale.interpolate({inputRange:this.inputRange ,outputRange:this.outputRange})
              this._objectDragingStyles.style.zIndex = this._previouszIndex; 
              //let differenceX = gestureState.dx * (I18nManager.isRTL ? -1 : 1)
              //this._previousLeft += differenceX ;//gestureState.dx * (I18nManager.isRTL ? -1 : 1);
              this._objectDragingStyles.style.left = 0;
              //let differenceY = gestureState.dy;
              this._previousTop += gestureState.dy;
              this._objectDragingStyles.style.top = this._previousTop;//Math.abs(gestureState.dy)>ItemHeight/2 ?gestureState.dy:0;
              this._objectDragingStyles.style.transform = [{scale:1}];
              this._updateNativeStyles();
              this.isMovePanResponder = false;
              console.log('position:',this._objectDragingStyles.style);
            
              this.props.fncItemMoved(0,gestureState.dy);
              this.props.doSetScrollEnable(true);
            }
        };

        startTouch(){
            console.log("startTouch");
            //console.log('1',this.isMovePanResponder);
                var curObj = this;
                this.long_press_timeout = setTimeout(function(){
                    console.log('longPress1');
                    curObj._previousLeft = 0;
                    curObj._previousTop = curObj.props.objData.objTop;
                    curObj._previousScale = new Animated.Value(1.01);
                    curObj._objectDragingStyles.style.transform = [{scale:1.01}];
                    curObj._objectDragingStyles.style.left=0;
                    curObj._objectDragingStyles.style.top=curObj.props.objData.objTop;
                    //curObj._objectDragingStyles.style.opacity = curObj._previousScale.interpolate({inputRange:curObj.inputRange ,outputRange:curObj.outputRange})
                    curObj._updateNativeStyles();
                    curObj.isMovePanResponder = true;
                    curObj.props.doSetScrollEnable(false);
                    console.log('longPress2');
                    }, 
                1000);
                return false;
        }
    
    onItemDelet(){
      clearTimeout (this.long_press_timeout);
      this.props.fncItemRemoved();
    }

    renderEachType(objData){
        //const {objData}= this.props
        //console.log(objData.type)
        if(objData.type==1){
            return(
                <View style={{flex:1,height:objData.objHeight-20,backgroundColor:'pink'}}>
                    
                </View>
            )
        }else if(objData.type==2){
            return(
                <View style={{flex:1,height:objData.objHeight-20,backgroundColor:'blue'}}>

                </View>
            )
        }else if(objData.type==3){
            return(
                <View style={{flex:1,height:objData.objHeight-20,backgroundColor:'plum'}}>

                </View>
            )
        }else{
            return(
                <View></View>
            )
        }
    }
    render() {
        const {objData,objWidth,Key}= this.props;
        console.log('objData:',objData);
        return (
            <View
                ref={statisticObj => {this.statisticObj = statisticObj}}
                key = {Key}
                style={{position:'absolute',flexDirection:'column' ,width:objWidth,top:objData.objTop,height:objData.objHeight,left:0}}
                {...this._panResponder.panHandlers}
            >
                <View style={{flexDirection:'row',alignContent:'space-between',height:20}}>
                    <View style={{flex:9,flexDirection:'column',height:20,alignContent:'flex-start'}}>
                        <Text>{objData.objTitle}</Text>
                    </View>
                    <View style={{flex:1,alignContent:'center'}}>
                        <TouchableOpacity style={styles.item_delete} onPress={()=>{this.onItemDelet()}}>
                            <Text style={[styles.icon_delete]}>-</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={{flexDirection:'row',width:objWidth,height:objData.objHeight-20,marginTop:5}}>
                    {this.renderEachType(objData)}
                </View>
            </View>
        );
      }

}

const styles = StyleSheet.create({
    scrollView: {
      flex: 1,
      backgroundColor: '#F5FCFF',
    },
    title:{
        flex:1,
        fontSize:16,
        textAlign:'left',
        alignSelf:'center'
    },
    item_delete:{
        flex:1,
        alignSelf:'center',
        width:20,
        height:20,
        borderRadius:10,
        backgroundColor:'#FFF',
        borderWidth:2,
        flexDirection:'column',
        alignContent:'center'
    },
    icon_delete:{
        flex:1,
        fontSize:14,
        color:'black',
        fontWeight:'bold',
        alignSelf:'center',
        lineHeight:16
    }
  });
