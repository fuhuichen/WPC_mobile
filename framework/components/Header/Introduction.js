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
  renderMore(type,data){
    let list = [];

    if(type == 1){
       data.list.forEach((item, i) => {
           list.push({title:item.title,icon:item.icon,desc:item.desc})
       });

    }
    else{
      data.list.forEach((t, i) => {
          t.list.forEach((item, i) => {
          list.push({title:item.title,icon:item.icon,desc:item.desc})
        });
      });
    }
    console.log(list)
    this.setState({more:{
      list,
      title:type==1?LangUtil.getStringByKey("ccm_monitor_module"):LangUtil.getStringByKey("ccm_monitor_unit")
    }})
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
                                     onPress={()=>{console.log("ONpress"+i);this.setState({index:i})}}
                                     text={c.type}/>
                                      <Container style={{width:70,height:index==i?3:0,backgroundColor:COLORS.PRIMARY_BLUE}}/>
                                    </Container>
                        }.bind(this))}
                    </Container >}
                    {data.info.length>1?<Container fullwidth style={{height:4,backgroundColor:"#ddd",marginBottom:30}}/>:null}
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
                                  style={[{flex:1,width:width-48,backgroundColor:c.color,borderRadius:8,height:44,
                                        borderBottomRightRadius:subindex==i?0:8,borderBottomLeftRadius:subindex==i?0:8},
                                        subindex!=i?{shadowColor:"#111",
                                         shadowOffset: { width: 2, height: 2},
                                         shadowOpacity: 0.2,
                                         shadowRadius: 2,
                                         elevation: 3}:null]}>
                                      <Container style={{height:10,width:10,borderWidth:2,marginLeft:16,marginRight:12
                                        ,borderColor:'white',borderRadius:5,backgroundColor:'transparent'}}/>
                                      <Typography  numberOfLines={2} font={"text01"} text={c.title} color={c.titleColor} style={{marginRight:3}}/>
                                      <Typography  numberOfLines={2} font={"text00"} text={c.subtitle} color={c.subtitleColor} style={{flex:1,marginRight:3}}/>
                                        <Icon style={{width:24,height:24,marginRight:20}} mode={'static'}
                                            type={subindex==i?"dropdown-active":"dropdown-normal"}/>
                                </TouchCard>
                               {  subindex==i?<Container style={[{borderBottomRightRadius:8,borderBottomLeftRadius:8,
                                     width:width-48,paddingTop:10,paddingBottom:6,backgroundColor:"#fff"},
                                     subindex!=i?{shadowColor:"#111",
                                      shadowOffset: { width: 2, height: 2},
                                      shadowOpacity: 0.2,
                                      shadowRadius: 2,
                                      elevation: 3}:null]}>
                                     <Container flexDirection="row"
                                       justifyContent="flex-start"
                                    >
                                        <Container flexDirection="row" style={{flex:4}} >
                                              <Typography font={"text00"} text={LangUtil.getStringByKey("ccm_monitor_module")}
                                              color={"#919191"}/>
                                              <IconButton
                                              mode="static"
                                              iconStyle={{height:24,width:24}}
                                              onPress={()=>{this.renderMore(1,c)}}
                                              type="tips"/>
                                        </Container>
                                        <Container flexDirection="row" style={{flex:4}}  >
                                              <Typography font={"text00"} text={LangUtil.getStringByKey("ccm_monitor_unit")}
                                               color={"#919191"} />
                                               <IconButton
                                               mode="static"
                                               iconStyle={{height:24,width:24}}
                                               onPress={()=>{this.renderMore(2,c)}}
                                               type="tips"/>
                                        </Container>
                                     </Container>
                                    {
                                      c.list && c.list.map(function(d,index){
                                        return <Container flexDirection="row" style={{width:'100%',marginBottom:10}}>
                                                    <Container flexDirection="row"
                                                      justifyContent="flex-start"
                                                     style={{backgroundColor:"#F5F5F5",
                                                    borderTopLeftRadius:8,
                                                    borderBottomLeftRadius:8,
                                                    paddingLeft:16,height:'100%',
                                                    flex:4,padding:16,marginRight:5,marginLeft:16}}>
                                                        <Icon style={{width:24,height:24,marginRight:6}} mode={'static'}
                                                            type={d.icon}/>
                                                        <Typography numberOfLines={2} style={{flex:1}}
                                                         font={"text01"} text={d.title} color={d.color}/>
                                                    </Container>
                                                    <Container
                                                      alignItems="flex-start"
                                                      style={{
                                                      paddingLeft:16,
                                                      borderTopRightRadius:8,
                                                      borderBottomRightRadius:8,
                                                      backgroundColor:"#F5F5F5",flex:6,padding:16,marginRight:16,paddingBottom:10}}>
                                                      {d.list && d.list.map(function(e,index){
                                                                return <Container flexDirection={"row"} style={{marginBottom:6}}>
                                                                          <Icon style={{width:24,height:24,marginRight:6}} mode={'static'}
                                                                              type={e.icon}/>
                                                                          <Typography numberOfLines={2} style={{flex:1}}
                                                                          font={"text01"} text={e.title} color={"text"}/>
                                                                       </Container>
                                                          })
                                                      }
                                                    </Container>
                                               </Container>
                                      })
                                    }
                                </Container>:null}
                               </Container>
                    }.bind(this))}
                     </Container>:
                    <Container  fullwidth   alignItems="flex-start"
                                style={{width:width-48,backgroundColor:"#fff",borderRadius:8,padding:16,
                                 shadowColor:"#111",
                                 shadowOffset: { width: 2, height: 2},
                                 shadowOpacity: 0.2,
                                 shadowRadius: 2,
                                 elevation: 3}}>
                                <Typography font={"text00"} text={item.title} color={"lightText"} style={{marginBottom:5}}/>
                                  <Container   fullwidth style={{width:width-80,backgroundColor:"#f0f0f0",borderRadius:5,padding:16,paddingTop:6,paddingBottom:6}}>
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
                  </Container >}
               </Container>
               <NormalButton
                 reverseColor style={{position:'absolute',bottom:30,width:width-48}}
                 onPress={async()=>{onCloseIntroduction()}}
                 text={LangUtil.getStringByKey("common_close")}/>
               {this.state.more?<Container
                 　　　justifyContent="flex-start"
                      fullwidth style={{position:'absolute',bottom:0,backgroundColor:"#000000BB",height,width}}>
                      <Container 　justifyContent="flex-start"
                             fullwidth style={{position:'absolute',
                             borderTopLeftRadius:8,borderTopRightRadius:8,
                             bottom:0,backgroundColor:"#F0F0F0",paddingBottom:30,width}}>
                            <Container
                              fullwidth
                              style={{height:50}}
                              flexDirection="row">
                              <IconButton
                              　text={"text02"}
                                font="text"
                              text={more.title}/>
                              <IconButton
                                text={"text024"}
                                style={{position:'absolute',right:20}}
                                onPress={()=>this.setState({more:false})}
                                text={LangUtil.getStringByKey("common_confirm")}/>
                            </Container>
                            {more.list.map(function(item,i){
                                 return <Container  key={i}
                                    flexDirection={"column"} style={{width:width-48,backgroundColor:'#fff',
                                      height:null,
                                      paddingLeft:16,paddingRight:16,marginBottom:3,
                                       borderTopLeftRadius:i==0?8:0, borderTopRightRadius:i==0?8:0,
                                       borderBottomLeftRadius:i==more.list.length-1?8:0,
                                       borderBottomRightRadius:i==more.list.length-1?8:0,}}
                                        alignItems={"flex-start"}
                                        justifyContent="flex-start" >
                                      <Container     flexDirection="row">
                                      <Icon style={{width:24,height:24,marginRight:6}} mode={'static'}
                                          type={item.icon}/>
                                      <Typography 　font={"text01"} text={item.title} color="text"/>
                                      </Container>
                                      <Typography numberOfLines={2} style={{flex:1,textAlign:'left',
                                       marginLeft:0}} font={"text00"}
                                      text={LangUtil.getStringByKey(item.desc)} color="#919191"/>
                                    </Container>
                            })}
                      </Container>
                      </Container>:null}
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
