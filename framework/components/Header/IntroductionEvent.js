import React, {Component} from 'react';
import { Context } from '../../FrameworkProvider';
import  {
  StyleSheet,
  View,
  Text,
  StatusBar,
} from 'react-native';
import {Typography,Icon} from "../display"
import {IconButton,NormalButton} from "../button"
import {Tab} from "../button"
import {Container,TouchCard} from "../container"
import {DimUtil,LangUtil} from "../../utils"
import {COLORS} from '../../enums'
class Introduction extends Component {
  constructor(props) {
    super(props);
    this.state={
      index:0,
      subindex:-1,
      more:false,
    }
  }
  render() {
    const {width,height} = DimUtil.getDimensions("portrait")
    const {data,onCloseIntroduction} =this.props;
    const {index,subindex,more} = this.state
    //let state = navigation.getState();
  //  let routeName = state.routes[state.index].name
　  //console.log(routeName)
    //console.log(state)
    //console.log("Status Bar="+DimUtil.getTopPadding())
    //console.log(width,height)

    console.log("INdex="+index)
    let item = data.info[index]
    return (
      <Context.Consumer>
        {({ theme}) => (
          <Container
              tabContainer
               fullwidth style={{position:'absolute',bottom:0,height,width}}>
               <Container
                  justifyContent="flex-start"
                  scrollable
                  fullwidth style={{
                    paddingTop:DimUtil.getTopPadding(), height:height,
                    position:'absolute',top:0,left:0,width,backgroundColor:"#f0f0f0"}}>
                    {data.info.length==1?<Container style={{marginTop:80,marginBottom:20}}>
                       <Typography font={"text03"} text={data.info[0].type} color={"text"}/>
                    </Container >
                    :<Container flexDirection="row" fullwidth style={{height:40,width,marginTop:40}}>
                        {data.info.map(function(c,i){
                            return   <Container key={i}style={{flex:1}}>
                                      <NormalButton reverseColor style={{backgroundColor:"transparent",height:34}}
                                     onPress={()=>{this.setState({index:i})}}
                                     text={c.type}/>
                                      <Container style={{width:70,height:index==i?3:0,backgroundColor:COLORS.PRIMARY_BLUE}}/>
                                    </Container>
                        }.bind(this))}
                    </Container >}
                    {item.mode=='detail'?
                    <Container scrollable style={{width,flex:1,marginBottom:60}}>
                    {item.list.map(function(c,i){
                      return    <Container

                                style={{width:width-48,marginLeft:24,marginBottom:20}}>
                                <TouchCard fullwidth
                                  onPress={()=>{this.setState({subindex:subindex==i?-1:i})}}
                                  alignItems="center"
                                  justifyContent='flex-start'
                                  flexDirection='row'
                                  style={[{flex:1,width:width-48,backgroundColor:"white",borderRadius:8,height:44,
                                        borderBottomRightRadius:subindex==i?0:8,borderBottomLeftRadius:subindex==i?0:8},
                                        subindex!=i?{shadowColor:"#111",
                                         shadowOffset: { width: 2, height: 2},
                                         shadowOpacity: 0.2,
                                         shadowRadius: 2,
                                         elevation: 3}:null]}>
                                      <Container style={{height:10,width:10,borderWidth:2,marginRight:16
                                        ,borderColor:'white',borderRadius:5,backgroundColor:'transparent'}}/>
                                      <Typography font={"text00"} text={c.title} font="text01" color={"text"} style={{marginRight:5}}/>
                                       <View style={{flex:1}}/>
                                       <Icon style={{width:24,height:24,marginRight:20}} mode={'static'}
                                            type={subindex==i?"dropdown-blue-active":"dropdown-blue"}/>
                                </TouchCard>
                               {  subindex==i?<Container
                                 style={[{borderBottomRightRadius:8,borderBottomLeftRadius:8,
                                       width:width-48,paddingTop:0,paddingBottom:16,backgroundColor:"#fff"},
                                       subindex!=i?{shadowColor:"#111",
                                        shadowOffset: { width: 2, height: 2},
                                        shadowOpacity: 0.2,
                                        shadowRadius: 2,
                                        elevation: 3}:null]}>
                                        <Container   fullwidth style={{flex:1,width:width-80,backgroundColor:"#f0f0f0",
                                        borderRadius:5,padding:16}}>
                                           {c.list.map(function(c,x){
                                             return <Container  key={x}
                                                   flexDirection="row" style={{height:34}} justifyContent="flex-start" fullwidth>
                                                     <Icon style={{width:24,height:24,marginRight:12}} mode={'static'}
                                                         type={c.icon}/>
                                                     <Typography font={"text01"} text={c.title} color="text"/>
                                                   </Container>
                                           })}
                                        </Container>
                                 </Container>:null}
                               </Container>
                    }.bind(this))}
                     </Container>:null}
                    {data.info.length>1 ?<Container style={{height:4,backgroundColor:"#DDD",marginBottom:30}}/>:null}
                    {  data.mode!='detail'?<Container  fullwidth   alignItems="flex-start"
                                style={{flex:1,width:width-48,backgroundColor:"#fff",borderRadius:8,padding:16,marginLeft:24,
                                shadowColor:"#111",
                                shadowOffset: { width: 2, height: 2},
                                shadowOpacity: 0.2,
                                shadowRadius: 2,
                                elevation: 3}}>
                                <Typography font={"text00"} text={item.title} color={"lightText"} style={{marginBottom:5}}/>
                                  <Container   fullwidth style={{flex:1,width:width-80,backgroundColor:"#f0f0f0",borderRadius:5,padding:16,paddingTop:6,paddingBottom:6}}>
                                    <Container  fullwidth>
                                    {item.list.map(function(c,x){
                                      return <Container  key={x}
                                            flexDirection="row" style={{height:34}} justifyContent="flex-start" fullwidth>
                                              <Icon style={{width:24,height:24,marginRight:6}} mode={'static'}
                                                  type={c.icon}/>
                                              <Typography font={"text01"} text={c.title} color="text"/>
                                            </Container>
                                    })}
                                  </Container>
                      </Container >
                    </Container >:null}
               </Container>
               <View style={{flex:1}}/>
               <NormalButton
                 reverseColor style={{marginBottom:30,width:width-48}}
                 onPress={async()=>{onCloseIntroduction()}}
                 text={LangUtil.getStringByKey("common_close")}/>
          </Container>
        )}
      </Context.Consumer>
    );
  }
}
const styles = StyleSheet.create({
    container: {
       alignItems:'center'
    }
});

export default Introduction;
