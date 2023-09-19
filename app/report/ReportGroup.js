import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, TouchableOpacity} from "react-native";
import I18n from 'react-native-i18n';
import moment from "moment";
import {Actions} from "react-native-router-flux";
import ReportCell from "./ReportCell";
import PropTypes from "prop-types";
import store from "../../mobx/Store";
import {getReportList} from "../common/FetchRequest";
import BoxShadow from "react-native-shadow/lib/BoxShadow";
import ViewIndicator from "../customization/ViewIndicator";
import BorderShadow from "../element/BorderShadow";

const {width} = Dimensions.get('screen');
export default class ReportGroup extends Component {
    state = {
        viewType:store.enumSelector.viewType.FAILURE,
        enumSelector:store.enumSelector,
        patrolSelector: store.patrolSelector,
        data:[]
    };

    static propTypes =  {
        data: PropTypes.array,
        storeId: PropTypes.string.isRequired
    };

    static defaultProps = {
        data: [],
        storeId:''
    };

    componentDidMount(){
        (async () => {
            await this.fetchData();
        })();
    }

    async fetchData(){
        let {enumSelector,patrolSelector} = this.state;
        const {storeId} = this.props;
        this.setState({viewType:enumSelector.viewType.LOADING});

        let filter = {
            beginTs: moment().subtract(89, 'days').startOf('day').unix()*1000,
            endTs: moment().endOf('day').unix()*1000,
            clause:{
                storeId:[storeId]
            }
        };
        let result = await getReportList(filter);
        if(result.errCode !== enumSelector.errorType.SUCCESS){
            this.setState({viewType:enumSelector.viewType.FAILURE});
            return false;
        }

        if(result.data.content.length !== 0){
            patrolSelector.reportList = result.data.content;
            this.setState({patrolSelector,
                data:result.data.content.slice(0,5),
                viewType:enumSelector.viewType.SUCCESS});
        }else{
            this.setState({viewType:enumSelector.viewType.EMPTY});
        }
    }

    render() {
        const {viewType,enumSelector,data} = this.state;
        let {storeId} = this.props;

        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>{I18n.t('Recent reports')}</Text>
                    <TouchableOpacity activeOpacity={0.5} onPress={() => {
                        Actions.push('reportList',{storeId: storeId});
                    }}>
                        <View style={styles.allReport}>
                            <Text style={styles.menuText}>{I18n.t('Report all')}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
                {
                    (viewType === enumSelector.viewType.SUCCESS) && <BoxShadow setting={{width:width-20, height:84*data.length, color:"#000000",
                    border:1, radius:10, opacity:0.1, x:0, y:1, style:{marginTop:0}}}>
                        <View style={styles.cellView}>
                            {data.map((item,index) => {
                                    return <ReportCell data={item} length={data.length} index={index} storeId={storeId}/>
                                })
                            }
                        </View>
                    </BoxShadow>
                }
                {(viewType !== enumSelector.viewType.SUCCESS) &&
                        <View style={[styles.indicatorPanel, BorderShadow.div]}>
                            <ViewIndicator viewType={viewType}
                                           containerStyle={{justifyContent: 'center'}}
                                           refresh={() => {
                                               (async ()=> this.fetchData())();
                                           }}
                            />
                        </View>
                }
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex:1,
        marginTop:36
    },
    allReport:{
        width:110,
        height:30,
        borderRadius:10,
        borderColor:'#006AB7',
        borderWidth:1,
        marginRight:14
    },
    menuText:{
        fontSize:14,
        color:'#006AB7',
        marginLeft:5,
        height:30,
        lineHeight:30,
        textAlign: 'center',
        textAlignVertical:'center',
        marginTop:-2
    },
    cellView:{
        backgroundColor:'#fff',
        borderRadius:10,
        width:width-22,
        marginLeft:1,
        paddingLeft:16,
        paddingRight: 16
    },
    header:{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    title:{
        fontSize: 16,
        color:'#64686D',
        marginLeft: 10
    },
    text:{
        color:'#FFFFFF',
        fontSize:14
    },
    indicatorPanel:{
        backgroundColor:'#fff',
        height:151,
        borderRadius:10
    }
});
