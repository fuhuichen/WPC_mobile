import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, ScrollView, DeviceEventEmitter} from "react-native";
import Navigation from "../element/Navigation";
import I18n from "react-native-i18n";
import dismissKeyboard from 'react-native-dismiss-keyboard';
import {Actions} from "react-native-router-flux";
import NetInfoIndicator from "../components/NetInfoIndicator";
import ProcessResult from "../event/ProcessResult";
import store from "../../mobx/Store";
import ViewIndicator from "../customization/ViewIndicator";
import {getWorkflowTaskConfig, submitWorkflowTask, getWorkflowTaskInfo, getWorkflowInfo} from "../common/FetchRequest";
import ApproveComment from "./common/ApproveComment";
import Signature from "../components/Signature";
import Appendix from "../components/Appendix";
import OSSUtil from "../utils/OSSUtil";
import {APPROVE_SUCCESS, MODULE_WORKFLOW} from "../common/Constant";
import ApproveWorkflow from "./common/ApproveWorkfow";
import ScrollTop from "../element/ScrollTop";
import EventBus from "../common/EventBus";
import ModalCenter from "../components/ModalCenter";
import Marker, {Position} from "react-native-image-marker";
import UserPojo from "../entities/UserPojo";
import rnTextSize, { TSFontSpecs } from 'react-native-text-size'

const {width} = Dimensions.get('screen');
export default class PageReview extends Component {
    state = {
        showScrollTop: false,
        enumSelector: store.enumSelector,
        userSelector: store.userSelector,
        approveSelector: store.approveSelector,
        viewType: store.enumSelector.viewType.FAILURE,
        advise: '',
        data: {},
        signature: [],
        attachment: [],
        approveResult: null,
        approvingNode: null,
        approvingNodeTaskId: '',
        approveAble: false,
        approveCustomButton1: '',
        approveCustomButton2: '',
        signatureRequire: false
    };

    componentDidMount(){
        (async () => {
            await this.fetchData();
        })();
    }

    async fetchData(){
        let {enumSelector, approveSelector, userSelector, data, viewType, approveAble} = this.state;
        let collection = approveSelector.collection;
        this.setState({viewType: enumSelector.viewType.LOADING});

        viewType = enumSelector.viewType.FAILURE;

        let result = await getWorkflowTaskInfo(collection.inspectReportId, enumSelector.workflowInfoType.INSPECTREPORT);
        if (result.errCode === enumSelector.errorType.SUCCESS){
            data = result.data.taskList;

            let parseData = []; // parentId-1的node開始顯示
            data.forEach(element => {
                if(element.parentId == -1 && element.state == enumSelector.workflowType.APPROVED) {
                    parseData = [];
                    element.state = enumSelector.workflowType.CREATED;
                    parseData.push(element);
                } else {
                    parseData.push(element);
                }
            });
            data = parseData;
            let approvingNodeId = '', approvingNodeTaskId = '';
            data.forEach(element => {
                if(element.state == enumSelector.workflowType.APPROVING) {                    
                    //approveAble = (element.tasks[0].userIds.indexOf(userSelector.userId) != -1);
                    approveAble = false;
                    for(var i=0 ; i<element.tasks.length ; ++i) {
                        if(element.tasks[i].userIds.indexOf(userSelector.userId) != -1) {
                            approveAble = true;
                            approvingNodeId = element.nodeId;
                            approvingNodeTaskId = element.tasks[i].taskId;
                            break;
                        }
                    }
                    this.setState({approvingNode: element, approvingNodeTaskId, approveAble});
                }
            });

            let resultWorkflowInfo = await getWorkflowInfo(collection.processDefinitionKey);
            if (resultWorkflowInfo.errCode === enumSelector.errorType.SUCCESS){
                if(approvingNodeId != '' && resultWorkflowInfo.data) {
                    this.getCustomButtonText(approvingNodeId, resultWorkflowInfo.data.nextAuditNode);
                }                
            }    

            viewType = (data.length > 0) ? enumSelector.viewType.SUCCESS : enumSelector.viewType.EMPTY;
        }
        this.setState({data, viewType});
    }

    getCustomButtonText(nodeId, node) {
        if(node.id == nodeId) {
            let approveCustomButton1 = '', approveCustomButton2 = '', signatureRequire = false;
            if(node.customButton.length > 1) {
                approveCustomButton1 = node.customButton[0].text;
                approveCustomButton2 = node.customButton[1].text;
                signatureRequire = node.signature
            }
            this.setState({approveCustomButton1, approveCustomButton2, signatureRequire});
        } else {
            if(node.nextAuditNode != null) {
                this.getCustomButtonText(nodeId, node.nextAuditNode);
            }
        }
    }

    async onSubmit(){
        dismissKeyboard();

        let {data, signature, approveResult, signatureRequire, advise, enumSelector} = this.state;

        if(approveResult == null) {
            DeviceEventEmitter.emit('Toast', I18n.t('Select Approve Comment'));
            return;
        }

        if(approveResult == enumSelector.approveFeedbackType.REJECT && advise == '') {
            DeviceEventEmitter.emit('Toast', I18n.t('Reject Require Description'));
            return;
        }

        if (signatureRequire && signature.length === 0){
            DeviceEventEmitter.emit('Toast', I18n.t('Give sign'));
            return;
        }

        this.onSeed();
    }

    onSeed(){
        let {enumSelector, signature, approveSelector, advise, attachment, approveResult, approvingNodeTaskId} = this.state;
        let collection = approveSelector.collection;

        try {
            OSSUtil.init(collection.storeId).then(() => {
                let uploads = [], keyIndex = 1;

                let uploadSignature = JSON.parse(JSON.stringify(signature));
                uploadSignature.forEach((key) => {
                    let mediaType = enumSelector.mediaTypes.IMAGE;
                    let ossKey = OSSUtil.formatOssUrl(MODULE_WORKFLOW, mediaType,
                        collection.storeId,collection.formId + '_' + keyIndex++);

                    uploads.push(OSSUtil.upload(ossKey, key.content));
                    key.type = mediaType;
                    key.content = OSSUtil.formatRemoteUrl(ossKey);
                });

                let uploadAttachment = JSON.parse(JSON.stringify(attachment));
                uploadAttachment.forEach((key) => {
                    let ossKey = OSSUtil.formatOssUrl(MODULE_WORKFLOW, key.mediaType,
                        collection.storeId,collection.formId + '_' + keyIndex++);

                    uploads.push(OSSUtil.upload(ossKey, key.url));
                    key.url = OSSUtil.formatRemoteUrl(ossKey);
                });

                Promise.all(uploads).then(async (res) => {
                    let body = {
                        taskId: approvingNodeTaskId,
                        comment: {
                            description: advise,
                            signature: uploadSignature,
                            attachment: uploadAttachment
                        },
                        result: approveResult
                    };


                    let result = await submitWorkflowTask(body);
                    if (result.errCode === enumSelector.errorType.SUCCESS){
                        if(result.data && result.data.isSystemReject == true) {            
                            this.modalSystemReject && this.modalSystemReject.open();
                        } else {
                            this.onActionPop();
                        }
                    }
                }).catch(error => {
                })
            }).catch(errpr => {
            });
        }catch (e) {
        }
    }

    onActionPop() {
        let {approveSelector} = this.state;
        DeviceEventEmitter.emit(APPROVE_SUCCESS, {
            type: approveSelector.screen,
            prompt: I18n.t('Sent success')
        });
        EventBus.refreshApprovePage();
        Actions.pop();
    }

    rgba2hex(orig) {
      let a, isPercent,
      rgb = orig.replace(/\s/g, '').match(/^rgba?\((\d+),(\d+),(\d+),?([^,\s)]+)?/i),
      alpha = (rgb && rgb[4] || "").trim(),
      hex = rgb ?
      (rgb[1] | 1 << 8).toString(16).slice(1) +
      (rgb[2] | 1 << 8).toString(16).slice(1) +
      (rgb[3] | 1 << 8).toString(16).slice(1) : orig;

      if (alpha !== "") {
        a = alpha;
      } else {
        a = '01';
      }
      // multiply before convert to HEX
      a = ((a * 255) | 1 << 8).toString(16).slice(1)
      hex = hex + a;

      return '#' + hex;
    }

    addMarkerArray(data) {
        data.forEach(item => {
            this.addMarker(item);
        })
    }

    async addMarker(item) {
        let {attachment} = this.state;
        let path = item.url, imgW = item.width, imgH = item.height;
        let settings = store.paramSelector.waterPrintParam;
        let fontSize = parseFloat(settings.waterPrintSize.replace('px', ''));
        let color = this.rgba2hex(settings.waterPrintColor);
        let text = settings.waterPrintType == 0 ? settings.waterPrintText : UserPojo.getUserName();
        
        let options = {
            src: path,
            text: text, 
            //position: settings.waterPrintPosition, 
            //X: imgW - length - 10,
            //Y: imgH/2 - (fontSize/2),
            color: color,
            fontName: 'Arial', 
            fontSize: fontSize, 
            /*shadowStyle: {
            dx: 5,
            dy: 5,
            radius: 5,
            color: '#000000'
            },*/
            /*textBackgroundStyle: {
            type: 'default',
            paddingX: 10,
            paddingY: 10,
            color: '#0f0'
            },*/
            scale: 1, 
            quality: 100
        }
        if( settings.waterPrintPosition == "topLeft" || settings.waterPrintPosition == "topCenter" || 
            settings.waterPrintPosition == "topRight" || settings.waterPrintPosition == "center" || 
            settings.waterPrintPosition == "bottomLeft" || settings.waterPrintPosition == "bottomCenter" || 
            settings.waterPrintPosition == "bottomRight") {
            options.position = settings.waterPrintPosition;
        } else if(settings.waterPrintPosition == "centerLeft") {  // 中左
            options.X = 20;
            options.Y = imgH/2 - (fontSize/2);
        } else if(settings.waterPrintPosition == "centerRight") { // 中右
            const fontSpecs = {
                fontFamily: undefined,
                fontSize: fontSize,
                fontStyle: 'Arial'
            }
            const textSize = await rnTextSize.measure({
                text,             // text to measure, can include symbols
                imgW,            // max-width of the "virtual" container
                ...fontSpecs,     // RN font specification
            })
            options.X = imgW - 20 - textSize.width;
            options.Y = imgH/2 - (fontSize/2);
        } else {
            options.position = 'center';
        }
        Marker.markText(options).then((res) => {
            let filePath = 'file://' + res
            item.url = filePath;
            attachment.push(item);
            this.setState({attachment});
        }).catch((err) => {
            attachment.push(item);
            this.setState({attachment});
        })
    }


    render() {
        let { enumSelector, viewType, advise, data, signature, attachment, showScrollTop, approveAble, 
              approveCustomButton1, approveCustomButton2, signatureRequire} = this.state;

        return (
            <View style={styles.container}>
                <Navigation
                    onLeftButtonPress={() => {this.onBack()}}
                    title={I18n.t('Approve')}
                    rightButtonEnable={approveAble}
                    rightButtonTitle={approveAble ? I18n.t('Send out') : ''}
                    rightButtonStyle={approveAble ? {activeColor:'#C60957', inactiveColor:'#DCDFE5',
                        textColor:'#ffffff', padding: 12, fontSize:14} : {}}
                    onRightButtonPress={async () => { await this.onSubmit()}}
                />
                <NetInfoIndicator />
                {(viewType !== enumSelector.viewType.SUCCESS) && <ViewIndicator viewType={viewType}
                                                                                containerStyle={{marginTop:100}}
                                                                                refresh={() => this.fetchData()}/>}
                {(viewType === enumSelector.viewType.SUCCESS) && <ScrollView ref={c => this.scroll = c}
                                                                             onScroll={event =>{
                                                                                 let showScrollTop = (event.nativeEvent.contentOffset.y > 200);
                                                                                 this.setState({showScrollTop});
                                                                                 dismissKeyboard();
                                                                             }}
                                                                             showsVerticalScrollIndicator={false}>
                    {approveAble && <View style={styles.viewPanel}>
                        <ApproveComment advise={advise}
                                        onAdvise={(text) => {this.setState({advise: text})}}
                                        onApprove={(result) => {this.setState({approveResult: result})}}
                                        button1Text={approveCustomButton1} button2Text={approveCustomButton2}/>

                        <View style={{marginTop:36}}>
                            <View style={styles.header}>
                                {signatureRequire && <Text style={styles.starLabel}>*</Text>}
                                <Text style={styles.subject}>{I18n.t('Label signature or photo')}</Text>
                            </View>
                            <Signature content={I18n.t('Label signature or photo')}
                                       showHeader={false}
                                       enableCamera={false}
                                       maxCount={1}
                                       onlySign={true}
                                       data={signature}
                                       onSign={(data, index) => {
                                           signature.push(data);
                                           this.setState({signature});
                                       }}
                                       onDelete={(index, flag) => {
                                           signature.splice(index, 1);
                                           this.setState({signature});
                                       }}/>
                        </View>

                        <Appendix content={I18n.t('Add Attachment')}
                                data={attachment}
                                onData={async (data) => {
                                    // 加浮水印
                                    if(store.userSelector.isWaterPrintOn == true) {
                                        this.addMarkerArray(data);
                                    } else {
                                        attachment = attachment.concat(data);
                                        this.setState({attachment});
                                    }
                                }}
                                onDelete={(index) => {
                                    attachment.splice(index,1);
                                    this.setState({attachment});
                                }}/>
                    </View>}

                    <ApproveWorkflow data={data} approveAble={approveAble}/>
                </ScrollView>}                

                <ModalCenter ref={c => this.modalSystemReject = c}
                            title={I18n.t('System Approve Withdraw')}
                            description={I18n.t('System Reject Description')}
                            showCancel={false}
                            confirm={()=>this.onActionPop()} />

                <ScrollTop showOperator={showScrollTop} onScroll={() => {this.scroll && this.scroll.scrollTo({x:0 ,y:0, animated:true})}}/>
            </View>
        )
    }

    // function
    onBack(){
        Actions.pop();
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor:'#F7F9FA'
    },
    viewPanel:{
        paddingLeft:10,
        paddingRight:10
    },
    header:{
        flexDirection:'row',
        justifyContent:'flex-start',
        paddingLeft:10
    },
    starLabel:{
        color:'#ff2400',
        marginRight: 3
    },
    subject:{
        fontSize: 16,
        color: 'rgb(100,104,109)'
    },
});
