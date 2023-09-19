import React, { Component } from 'react';
import {
    AppRegistry,
    StyleSheet,
    View,
    I18nManager, 
    Text,
    PanResponder,
    UIManager,
    PixelRatio
} from 'react-native';
//import {Sharp, Surface } from '@react-native-community/art'

export default class DragText extends Component {
    constructor(props) {
        super(props);
        this._previousLeft = this.props.TextInfo.position.x;
        this._previousTop = this.props.TextInfo.position.y;
        this._previouszIndex = 20;
        this._offset = { x: 0, y: 0 };
        
        this._size = { width: 0, height: 0 };
        this.isMove = false;
        this._textStyles = {
            style: {
              left: this._previousLeft,
              top: this._previousTop,
              zIndex:this._previouszIndex,
              //transform: [{scale:1}],
              opacity: 1,
              //backgroundColor:'#FFF'
            },
        };
        this.state = {position:this.props.Position,position2:{x:this.props.Position.x,y:this.props.Position.y}}
    }

    componentWillMount() {
        this._panResponder = PanResponder.create({
          // Ask to be the responder:
          onStartShouldSetPanResponder: (evt, gestureState) => true,
          onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
          onMoveShouldSetPanResponder: (evt, gestureState) => true,
          onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
    
          onPanResponderGrant: (evt, gestureState) => {
            //if (!this.props.touchEnabled) return
            const e = evt.nativeEvent;
            this._offset = { x: e.pageX - e.locationX, y: e.pageY - e.locationY }
            //console.log('1.onPanResponderGrant:',this._offset);
            //const x = parseFloat((gestureState.x0 - this._offset.x).toFixed(2)), y = parseFloat((gestureState.y0 - this._offset.y).toFixed(2))
            //this._path.data.push(`${x},${y}`)
            //this.props.onStrokeStart(x, y)
            //console.log('1.x:'+x+", y:"+y);
          },
          onPanResponderMove: (evt, gestureState) => {
            this.isMove = true;
            //console.log('this.isMove:',this.isMove);
            
            this._textStyles.style.zIndex = 999; 
            this._textStyles.style.left = this._previousLeft + gestureState.dx * (I18nManager.isRTL ? -1 : 1);
            this._textStyles.style.top = this._previousTop + gestureState.dy;
            
            /*const x = parseFloat((gestureState.moveX - this._offset.x).toFixed(2)), y = parseFloat((gestureState.moveY - this._offset.y).toFixed(2))
            this._textStyles2.style.zIndex = 999; 
            this._textStyles2.style.left = this._previousLeft2 + x;
            this._textStyles2.style.top = this._previousTop2 + y;*/

            this._updateNativeStyles();
            /*this._path.data.push(`${x},${y}`)
              //this.props.onStrokeChanged(x, y)
              console.log('2.this._textStyles.style:',this._textStyles.style);
              console.log('2.onPanResponderMove:.x:'+x+", y:"+y);*/
            
          },
          onPanResponderRelease: (evt, gestureState) => {
            const {position,isMove} = this.state;
            //console.log("3.position:",position);
            let changedText = this.props.TextInfo;
            this._textStyles.style.zIndex = this._previouszIndex; 
            changedText.position.x = this._textStyles.style.left = (this.isMove)? this._previousLeft + gestureState.dx * (I18nManager.isRTL ? -1 : 1):this.state.position.x;
            changedText.position.y = this._textStyles.style.top = (this.isMove) ? this._previousTop + gestureState.dy:this.state.position.y;
            
            
            /*console.log('3.this._textStyles.style:',this._textStyles.style);*/
           /* const x = parseFloat((gestureState.moveX - this._offset.x).toFixed(2)), y = parseFloat((gestureState.moveY - this._offset.y).toFixed(2));
            this._textStyles2.style.zIndex = 999; 
            this._textStyles2.style.left = this._previousLeft2 + x;
            this._textStyles2.style.top = this._previousTop2 + y;*/

            this._updateNativeStyles();
            //changedText.position.x = (this.isMove)? this._textStyles.style.left+this.state.position.x:this.state.position.x;
            //changedText.position.y = (this.isMove)? this._textStyles.style.top +this.state.position.y:this.state.position.y;
            this.setState({position:{x:changedText.position.x,y:changedText.position.y}});
            this._previousLeft = changedText.position.x;
            this._previousTop = changedText.position.y;
            //console.log("this._offset:",this._offset);
            if(this.isMove){this.props.onTextPositionChanged(this.props.Key,changedText);}
            this.isMove = false;
            //this.setState({isMove:false});
          },
    
          onShouldBlockNativeResponder: (evt, gestureState) => {
            return true;
          },
        });
      }
    componentDidMount() {
        //console.log('componentDidMount()');
        this._updateNativeStyles();
    }

    _updateNativeStyles = () => {
      
        this.txtObj && this.txtObj.setNativeProps(this._textStyles);
        //this.txtObj2 && this.txtObj2.setNativeProps(this._textStyles2);
    };
    
    render() {
        const {text,fontSize,fontColor} = this.props.TextInfo;
        const {Position} = this.props;
        if(this._previousLeft!=Position.x || this._previousTop !=Position.y){
          this._previousLeft = this._textStyles.style.left =Position.x;
          this._previousTop =  this._textStyles.style.top  =Position.y;
          this._updateNativeStyles();
        }
        //console.log("Position:",Position)
        return (
            <View
                ref={txtObj => {this.txtObj = txtObj;}}
                key = {this.props.Key}
                style={[styles.container]}
                  {...this._panResponder.panHandlers}
            >
                <Text style={{fontSize,color:fontColor,alignSelf:'center',margin:10,textAlign:'center'}}>{text}</Text>
                
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        position:'absolute',
        flex:1
    },

});