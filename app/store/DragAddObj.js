import React from 'react';
import {Animated,Text,View,TextInput,StyleSheet,TouchableOpacity,Image,Platform,FlatList} from 'react-native';
import {PanGestureHandler,ScrollView,State,LongPressGestureHandler} from 'react-native-gesture-handler';
import DragItem from './DragObject'

export default class DragAddObj extends React.Component {
    constructor(props) {
        super(props);
        this.props = props;
        this.state = {data:null,scrollEnabled:true,clickItem:null,timeRefresh:Date.now(),accumulationHeight:0}
        this.ItemWidth = this.props.childrenWidth+this.props.marginChildrenLeft+this.props.marginChildrenRight;
        this.ItemHeight = this.props.childrenHeight + this.props.marginChildrenTop + this.props.marginChildrenBottom;
        this.rowNum = parseInt(props.parentWidth / this.ItemWidth);
        this.titleHeight = 20;
    }

    componentDidMount(){
        this.doRefreshItemOptions(this.props.Data);
    }
    doRefreshItemOptions(data){
        let accumulationHeight = 0; //Block 累積高度，也是每個block的top
        const dataSource = data.map((item,index)=>{
            //console.log("item:",item);
            const source = {};
            let blockHeight = this.titleHeight+10+this.ItemHeight*(Math.ceil((item.stores.length+1)/this.rowNum));
            source.date = item.date;
            source.blockTop = accumulationHeight;
            accumulationHeight += blockHeight;
            source.blockHeight = blockHeight;
            source.stores = item.stores.map((subItem,idx)=>{
                const newData = {...subItem};
                const left = this.doGetItemLeft(idx);//(idx%this.rowNum)*this.ItemWidth
                const top = this.doGetItemTop(index,idx,source.blockTop);//(this.titleHeight+10)*(index+1)+(this.ItemHeight*index) + (parseInt((idx/this.rowNum))*this.ItemHeight);
                newData.originIndex = index+"_"+idx
                newData.originLeft = left
                newData.originTop = top
                /*newData.position = new Animated.ValueXY({
                    x: parseInt(left+0.5),
                    y: parseInt(top+0.5),
                })
                newData.scaleValue = new Animated.Value(1);
                newData.translateX = new Animated.Value(0);

                newData.translateY = new Animated.Value(0);*/
                newData.type = "obj";
                newData.timeRefresh=Date.now()
                //console.log("newData:",newData);
                return newData
            })
            return source;
            //source.push(newData);
        });
        //console.log("dataSource:",JSON.stringify(dataSource));
        this.setState({data:dataSource,timeRefresh:Date.now(),accumulationHeight});
    }

    doItemDelete(id){
        console.log("doItemDelete");
        const {data,clickItem} = this.state;
        let idx = id.split('_');
        console.log("delete id:",idx);
        let blockIdx = idx[0];
        let storeIdx = idx[1];
        var source = data.slice(0,data.length);
        source[blockIdx].stores.splice(storeIdx,1)
        this.doRefreshItemOptions(source);

    }

    doGetItemTop(blockIndex,itemIndex,blockTop){
        const {data} = this.state;
        const top = blockTop+(this.titleHeight+10)+ (parseInt((itemIndex/this.rowNum))*this.ItemHeight);
        return top;
                
    }

    doGetItemLeft(itemIndex){
        const left = (itemIndex%this.rowNum)*this.ItemWidth
        return left;
    }

    doMoveItemToNewBlock(dy,store,blockIdx,storeIdx,dx){
        const {data} = this.state;
        var source = data.slice(0,data.length);
        //let distanceY = Math.abs(dy);
        console.log("dy:"+dy);
        let newPY = store.originTop+dy+ (dy>0? (this.props.childrenHeight/2):0); //移動後新位置
        console.log("newPY:"+newPY);
        var canMove=false;
        if(dy<0 && newPY<source[0].blockTop && blockIdx==0){//再第一個block,第一個row向上移動
            console.log("超過第一個block");
            this.setState({data:[]});
            this.doRefreshItemOptions(source);
        }else if(dy>0 && blockIdx==source.length-1 && 
            newPY > (source[source.length-1].blockTop+source[source.length-1].blockHeight)){//超過最後一個block
            console.log("超過最後一個block");
            this.setState({data:[]});
            this.doRefreshItemOptions(source);
        }else{
            for(var newbIndex=0; newbIndex<data.length; newbIndex++){
                let newblock = data[newbIndex];
                let bTop = newblock.blockTop;
                let bBottom = newblock.blockTop+newblock.blockHeight;
                if(newPY >= bTop && newPY < bBottom){
                    canMove = true;
                    if(newbIndex != blockIdx){
                        source[newbIndex].stores.push(store);
                        source[blockIdx].stores.splice(storeIdx,1);
                        this.doSortAfterChangBlock(dx,newPY,source,newbIndex,source[newbIndex].stores.length-1)
                        console.log("source:",source);
                        //this.doRefreshItemOptions(source);
                    }else{ //自己的Block上下移動，換順序
                        console.log("自己的Block上下移動，換順序");
                        canMove = this.doChageStoreOrderByY(dy,dx,blockIdx,storeIdx,store);
                    }
                    break;
                }
            }
            console.log('canMove:',canMove)
            if(!canMove){
                console.log("不可以移動");
                this.doRefreshItemOptions(source);
            }
        }
    }

    doSortAfterChangBlock(dx,newY,newSource,newBIdx,newStoreIdx){
        let newStoreCount = newSource[newBIdx].stores.length;
        console.log('newStoreCount:'+newStoreCount);
        let store = newSource[newBIdx].stores[newStoreIdx];
        store.originTop = this.doGetItemTop(newBIdx,newStoreIdx,newSource[newBIdx].blockTop);
        if(parseInt((newStoreCount-1)/4)==0){// 扣掉新進去的項目，只有一行
            this.doChangeStoreOrder(dx,store,newBIdx,newStoreIdx,false);
        }else{
            //let distY = newY - newSource[newBIdx].blockTop-30;
            //console.log('distY:'+distY);
            let blockRow = Math.ceil(newStoreCount/this.rowNum);
            let newTop = newSource[newBIdx].blockTop+this.titleHeight+10;//(Math.floor( distY/this.props.childrenHeight)*this.ItemHeight)+(this.titleHeight+10)+newSource[newBIdx].blockTop;
            for(var i=0; i<blockRow;i++){
                let rowItemBottom = newTop+((i+1)*this.props.childrenHeight);
                newTop = newTop+(i*this.ItemHeight);
                if(newY<=rowItemBottom){ 
                    store.originTop = newTop;
                    break;
                }
            }
            console.log('newTop:'+newTop);
            this.doChangeStoreOrder(dx,store,newBIdx,newStoreIdx,true);
        }
    }

    doChageStoreOrderByY(dy,dx,blockIdx,storeIdx,store){
        const {data} = this.state;
        let moveRow = ((dy<0)?-1:1)*parseInt(Math.abs(dy)/this.ItemHeight)
        let newIdx = storeIdx+(moveRow*4);
        if(newIdx<0){return false;}
        store.originTop = this.doGetItemTop(blockIdx,newIdx,data[blockIdx].blockTop);
        console.log('get new top:'+store.originTop );
        this.doChangeStoreOrder(dx,store,blockIdx,storeIdx,true)
        return true;
    }

    doChangeStoreOrder(dx,store,blockIdx,storeIdx,isRowChanged){
        const {data} = this.state;
        var source = data.slice(0,data.length);
        var stores = source[blockIdx].stores.slice(0,source[blockIdx].stores.length);
        console.log("dx:"+dx);
        let newPX = store.originLeft+dx; //移動後新位置
        console.log("newPX:"+newPX);
        var halfItemW = Math.ceil(this.props.childrenWidth/2);
        var canMove=false;
        console.log("store:",store);
        for(var i=0; i<stores.length;i++){
            let eachStoreLeft = stores[i].originLeft;
            console.log("eachStoreLeft:"+eachStoreLeft);
            if((( newPX <= eachStoreLeft ) || (newPX > eachStoreLeft && ((i+1)%this.rowNum==0 || i==stores.length-1)))  && i!=storeIdx && stores[i].originTop == store.originTop){ //向右排序，order增加
                canMove = true;
                stores.splice(storeIdx,1);
                stores.splice(i,0,store);
                source[blockIdx].stores = stores;
                this.doRefreshItemOptions(source);
                break;
            }
        }
        if(!canMove && isRowChanged){ //第二行剛好是+，因為top不同，會無法移動
            stores.splice(storeIdx,1);
            stores.push(store);
            source[blockIdx].stores = stores;
            this.doRefreshItemOptions(source);
        } 
        console.log('canMove:',canMove)
        if(!canMove){
            console.log("不可以移動");
            this.doRefreshItemOptions(source);
        }

    }

    itemMoved(dx,dy,blockIdx,storeIdx){
        const {parentWidth} = this.props;
        const {data} = this.state;
        
        //console.log('dx:'+dx+' dy:'+dy)
        //console.log("blockIdx:",blockIdx)
        //console.log("storeIdx:",storeIdx)
        //let source = data.slice(0,data.length);
        console.log("(this.ItemHeight/2):",(this.ItemHeight/2))
        let moveY = (Math.abs(dy) > (this.ItemHeight/2)) ;
        let store = data[blockIdx].stores[storeIdx];
        let newPY = store.originTop+dy;
        console.log("moveY:",moveY)
        //if(Math.abs(dy) > (this.ItemHeight/2)){//表示往上下一超過一半的距離
            if(moveY){
                console.log("可以移動");
                this.doMoveItemToNewBlock(dy,store,blockIdx,storeIdx,dx);
                
            }else if(Math.abs(dx)>0){//只左右移動
                console.log("左右移動");
                this.doChangeStoreOrder(dx,store,blockIdx,storeIdx,false);
            }else{
                console.log("不可以移動");
                //var source = data.slice(0,data.length);
                this.doRefreshItemOptions(data);
            }
            
        //}
        
    }

    renderDayStores(dataIdx){
        const {parentWidth,marginChildrenTop,childrenWidth,childrenHeight} = this.props;
        const {data,timeRefresh,accumulationHeight} = this.state;
        //console.log("timeRefresh:",timeRefresh);
        //console.log("data:",data);
        const stores = data[dataIdx].stores.slice(0,data[dataIdx].stores.length);
        //console.log("stores:",stores.stores);
        stores.push({"storeId":Date.now(),"type":"add"})
        return(
            <FlatList
                key = {dataIdx}
                data={stores}
                numColumns = {this.rowNum}
                contentContainerStyle={{width:parentWidth,zIndex:10,marginTop:10,minHeight:this.ItemHeight}}
                extraData = {this.state}
                renderItem = {({item,index})=>{
                    return (
                        <View key={index} style={{width:this.ItemWidth,height:this.ItemHeight,marginTop:marginChildrenTop}}>
                            <DragItem 
                                index = {dataIdx}
                                store={item}
                                ItemWidth = {childrenWidth}
                                ItemHeight = {childrenHeight}
                                ParentTop = {0}
                                ParentBottom = {accumulationHeight}
                                fncItemMoved = {(dx,dy) => {this.itemMoved(dx,dy,dataIdx,index)}}
                                ItemDelete = {()=>this.doItemDelete(item.originIndex)}
                                doSetScrollEnable = {(enable) => {this.setState({scrollEnabled:enable})}}
                            />
                        </View>
                    );
            }}
            />
        );
    }

    render(){
        const {parentWidth,parentHeight,Title,Items} = this.props;
        const {data,scrollEnabled} = this.state;
        return (
            <ScrollView 
                contentContainerStyle={{height:parentHeight}}
                keyboardDismissMode = {'on-drag'}
                scrollEnabled = {scrollEnabled}
            >
                <FlatList
                    data={data}
                    numColumns = {1}
                    style={{width: parentWidth,Height: parentHeight}}
                    extraData = {this.state.timeRefresh}
                    renderItem = {({item,index})=>{
                        //console.log("item.stores.length:",item.stores.length);
                        //console.log("this.rowNum:",this.rowNum);
                        let blockHight = 20+(this.ItemHeight+10)*(Math.ceil((item.stores.length+1)/this.rowNum));
                        //console.log("blockHight:",blockHight);
                        return (
                        <View key={item.date} style={{width: parentWidth,height: blockHight,borderBottomColor:'#000',borderBottomWidth:1,zIndex:1,}}>
                            <View style={{height:20,width:parentWidth,flexDirection:'row',alignContent:'center'}}>
                                <Text style={{alignSelf:'center',fontSize:14}}>{item.date}</Text>
                            </View>
                            {this.renderDayStores(index)}
                        </View>
                    )}}
                />
            </ScrollView>
        );
    }
}

const Styles = StyleSheet.create({
    item: {
        position: 'relative',
        zIndex: 100,
    }
})
