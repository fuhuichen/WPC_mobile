import React, {Component} from 'react';
import  {
  StyleSheet,
  View,
  Text,
} from 'react-native';
import {connect} from 'react-redux';
import * as actions from '../../actions';
import {AppContainer,
        PageContainer,
        Typography,
        Container,
        Icon,
        DataInput,
        NormalButton,
        Tab,
        IconButton} from '../../framework';
import {StringUtil, DimUtil,LangUtil} from '../../framework';
import {ERROR_CODE,ENVIRONMENT,PAGES,STORAGES,OPTIONS} from  "../define";
import MainAPI from "../api/main";

class PageLogin extends Component {
  constructor(props) {
    super(props);
    this.state={
      step:1,
      account:"",
      password:"",
    }
  }

  componentWillUnmount() {
  }
  
  async componentDidMount() {
    await this.init();
  }
  
  async init(){
    MainAPI.init(ENVIRONMENT.mainURL)
  }

  async login(){
    const { navigation} = this.props;
    let {account, password} = this.state;
    console.log("login account : ", account);
    console.log("login password : ", password);
    this.props.setLoading(true)
    let result = await MainAPI.loginRequest(account,password)
    console.log("login result : ", result);
    if(result.errorcode != ERROR_CODE.SUCCESS){
      this.setState({errorPassword:LangUtil.getStringByKey("error_auth_fail")})
    } else {
      MainAPI.setToken(result.token, result.userId);
      navigation.replace(PAGES.MAIN,{});
    }
    this.props.setLoading(false);
  }

  async next(){
    let {step, account, password} = this.state;
    if(step == 1) {
      if(account == '') {
        this.setState({errorAccount: LangUtil.getStringByKey("error_invalid_email")});
      } else {
        this.setState({step: 2});
      }      
    } else if (step == 2) {
      if(password.length==0){
        this.setState({errorPassword:LangUtil.getStringByKey("error_empty_password")})
        return;
      }
      await this.login();
    }
  }

  async previous(){
    let {step} = this.state;
    if(step == 2) {
      this.setState({step: 1});
    }
  }

  doCheckAccountChange(t){
    if(t){
      let err = "";
      if(t.length>0 && !StringUtil.validateEmail(t)){
        //err = LangUtil.getStringByKey("error_invalid_email")
      }
      this.setState({account:t,errorAccount:err})
    }
    else{
      this.setState({account:"",errorAccount:""})
    }
  }

  doCheckPasswordChange(t){
      this.setState({password:t,errorPassword:""})
  }

  renderStep1(){
    const {step,account,errorAccount} = this.state;
    if(step == 1)
      return <Container fullwidth alignItems={"flex-start"} style={{paddingTop:15}}>
                <Typography
                    style={{marginBottom:10}}
                    font={"text02"}
                    text={"Welcome"}
                    color='black'/>
                <Typography
                    style={{marginBottom:30}}
                    font={"head01"}
                    text={"Advantech / Course SignIn"}
                    color='black'/>
                <DataInput
                  alert={errorAccount!=""}
                  mode={"email"}
                  placeholder={LangUtil.getStringByKey("error_empty_email")}
                  onChangeText={this.doCheckAccountChange.bind(this)}
                  style={{marginBottom:7}}
                  value={account}/>
                <Typography
                          style={{marginBottom:7,marginLeft:5}}
                          font={"subtitle04"}
                          text={errorAccount}
                          color='error'/>
                <NormalButton
                    onPress={async()=>{await this.next()}}
                    text={LangUtil.getStringByKey("common_next_step")}/>
              </Container>
  }

  renderStep2(){
    const {step,password,errorPassword} = this.state;
    if(step == 2)
    return <Container fullwidth alignItems={"flex-start"} style={{paddingTop:105}}>
              <Container fullwidth
                  alignItems={"flex-start"}
                  justifyContent={'center'}
                  style={{position:'absolute',top:0,width:'100%'}}>
                  <IconButton
                    type={"back"}
                    mode="static"
                    textStyle="text01"
                    onPress={async()=>{await this.previous()}}
                    text={LangUtil.getStringByKey("login_account")}/>
              </Container>
              <DataInput
                  alert={errorPassword!=""}
                  mode={"password"}
                  placeholder={LangUtil.getStringByKey("login_enter_password")}
                  onChangeText={this.doCheckPasswordChange.bind(this)}
                  style={{marginBottom:7}}
                  value={password}/>
                  <Typography
                            style={{marginBottom:7,marginLeft:5}}
                            font={"subtitle04"}
                            text={errorPassword}
                            color='error'/>
                <NormalButton
                      onPress={async()=>{this.next()}}
                  text={LangUtil.getStringByKey("login_btn")}/>
             <Container fullwidth >
            </Container>
  </Container>
  }
  

  render(){
    const {dialog} =this.state;
    
    return ( <PageContainer
                backgrouncImage
                dialog={dialog}
                onCloseDialog={()=>this.setState({dialog:null})}
                style={{paddingTop:DimUtil.getTopPadding()+12}}>
                  {this.renderStep1()}
                  {this.renderStep2()}
             </PageContainer>);
  }


}

const mapStateToProps = state =>{
  return {loading:state.loading};
};
export default connect(mapStateToProps, actions)(PageLogin);
