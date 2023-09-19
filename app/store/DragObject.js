import React, { Component } from 'react';
import { StyleSheet, View, PanResponder, I18nManager, TouchableOpacity, Animated,Text} from 'react-native';

import { ScrollView } from 'react-native-gesture-handler';
import StoreCell from "./StoreCell";

export default class DragObject extends Component {
    constructor(props) {
        super(props);
        this.props = props;
        this.long_press_timeout = null;
        this.parentTop = this.props.ParentTop;
        this.parentBottom = this.props.ParentBottom;
        this._previousLeft = 0;
        this._previousTop = 0;
        this._previouszIndex = 20;
        this.isMovePanResponder = false;
        this.inputRange = [1,1.1];
        this.outputRange = [0.8,1];
        this._previousScale = new Animated.Value(1);
        this._circleStyles = {
            style: {
              left: this._previousLeft,
              top: this._previousTop,
              zIndex:this._previouszIndex,
              transform: [{scale:1}],
              opacity: 1,
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
            this.circle && this.circle.setNativeProps(this._circleStyles);
          };

        _handlePanResponderGrant(e, gestureState) {
            //console.log('2 Grant,e:',e);
            
        }
        _handlePanResponderMove = (e, gestureState) => {
            //console.log('4.moving',this.isMovePanResponder);
            
            if(this.isMovePanResponder){
                clearTimeout(this.long_press_timeout);
                this._circleStyles.style.zIndex = 999; 
                this._circleStyles.style.left = this._previousLeft + gestureState.dx * (I18nManager.isRTL ? -1 : 1);
                this._circleStyles.style.top = this._previousTop + gestureState.dy;
                
                this._updateNativeStyles();
            }
          //this.isMovePanResponder = false;
          
        };
        _handlePanResponderEnd = (e, gestureState) => {
            const{ItemWidth,ItemHeight} = this.props;
            console.log("release");
            clearTimeout(this.long_press_timeout);
            if(this.isMovePanResponder){
              //this._previousScale = new Animated.Value(1);
              this._circleStyles.style.transform = [{scale:1}];
              this._circleStyles.style.opacity = this._previousScale.interpolate({inputRange:this.inputRange ,outputRange:this.outputRange})
              this._circleStyles.style.zIndex = this._previouszIndex; 
              let differenceX = Math.abs(gestureState.dx * (I18nManager.isRTL ? -1 : 1)) > ItemWidth/2 ? gestureState.dx * (I18nManager.isRTL ? -1 : 1):0
              this._previousLeft += differenceX ;//gestureState.dx * (I18nManager.isRTL ? -1 : 1);
              this._circleStyles.style.left = this._previousLeft;
              let differenceY = Math.abs(gestureState.dy)>ItemHeight/2 ? gestureState.dy:0;
              this._previousTop += differenceY;//gestureState.dy;
              this._circleStyles.style.top = Math.abs(gestureState.dy)>ItemHeight/2 ?gestureState.dy:0;
              this._circleStyles.style.transform = [{scale:1}];
              this._updateNativeStyles();
              this.isMovePanResponder = false;
              console.log('position:',this._circleStyles.style);
            
              this.props.fncItemMoved(gestureState.dx * (I18nManager.isRTL ? -1 : 1),gestureState.dy);
              this.props.doSetScrollEnable(true);
            }
        };

        startTouch(){
            console.log("startTouch");
            //console.log('1',this.isMovePanResponder);
                var curObj = this;
                this.long_press_timeout = setTimeout(function(){
                  console.log('longPress1');
                  curObj._previousScale = new Animated.Value(1.1);
                  curObj._circleStyles.style.transform = [{scale:1.1}];
                  curObj._circleStyles.style.opacity = curObj._previousScale.interpolate({inputRange:curObj.inputRange ,outputRange:curObj.outputRange})
                  curObj._updateNativeStyles();
                  curObj.isMovePanResponder = true;
                  curObj.props.doSetScrollEnable(false);
                  console.log('longPress2');
                    /*if (gestureState.x0 <= width/2 )
                    {
                        AlertIOS.alert(
                          'Left',
                          'Long click on the left side detected',
                          [
                            {text: 'Tru dat'}
                          ]
                        );
                    }
                    else {
                        AlertIOS.alert(
                          'Right',
                          'So you clicked on the right side?',
                          [
                            {text: 'Indeed'}
                          ]
                        );
                    }*/
                    
                    
                }, 
                1);
                return false;
        }
    
    doStoreDelete(){
      clearTimeout (this.long_press_timeout);
      this.props.ItemDelete();
    }
    render() {
        const {store,index }= this.props;
        if(store.type == 'add'){
            return (
              <TouchableOpacity style={[styles.itemAdd,styles.circle]} >
                <Text style={{fontSize: 24,color: '#000'}}>+</Text>
              </TouchableOpacity>
            );
        }else{
            return (
              <View
                  ref={circle => {this.circle = circle;}}
                  key = {store.storeId}
                  style={[styles.circle]}
                  {...this._panResponder.panHandlers}
              >
                  <StoreCell data={{key:store,value:index}} ItemDelete={()=>this.doStoreDelete()}/>
              </View>
            );
        }
      }

}

const styles = StyleSheet.create({
    scrollView: {
      flex: 1,
      backgroundColor: '#F5FCFF',
    },
    circle: {
      width: 76,
      height: 76,
      marginLeft:10,
    },
    itemAdd:{
        backgroundColor: '#f0ffff',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 4,
        borderStyle:'dashed',
        borderColor:'grey',
        borderWidth:1
    }
  });