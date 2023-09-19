/**
 * @prettier
 * @flow
 * */

import React from 'react'
import {
    View,
    StyleSheet,
    Dimensions,
    Text,
    TouchableOpacity
} from 'react-native'
import PatrolParser from "../../components/inspect/PatrolParser";

let {width} =  Dimensions.get('screen');

type Props = {
    onGrade: string
}

type State = {
    score: number,
    enable: boolean
}

export default class PatrolGrade extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.score = PatrolParser.getScore();
        this.state = {
            score: this.props.score
        };
    }

    onGrade(grade){
        this.props.enable && this.setState({
            score: (this.state.score !== grade) ? grade : this.score[0].label
        },()=>{
            this.props.onGrade(this.state.score);
        })
    }

    render() {
        return (
            <View style={styles.container}>
                <TouchableOpacity activeOpacity={1} onPress={()=>{this.onGrade(1)}}>
                    <View style={(this.props.score !== this.score[2].label) ? styles.passNormal : styles.passSelect}>
                        <Text style={(this.props.score !== this.score[2].label)? [styles.content,{color:'#989ba3'}]
                            : [styles.content,{color:'#ffffff'}]}>
                            {this.score[2].score}
                        </Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={1} onPress={()=>{this.onGrade(0)}}>
                    <View style={(this.props.score !== this.score[1].label) ? styles.failedNormal : styles.failedSelect}>
                        <Text style={(this.props.score !== this.score[1].label) ? [styles.content,{color:'#989ba3'}]
                            : [styles.content,{color:'#ffffff'}]}>
                            {this.score[1].score}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container:{
        flexDirection:'row',
        justifyContent:'space-between'
    },
    passNormal:{
        width: 60,
        height: 20,
        borderWidth:0.5,
        borderRightWidth: 0.25,
        borderBottomWidth: 0.25,
        backgroundColor: '#f7f8fc',
        borderTopLeftRadius: 2,
        borderBottomLeftRadius: 2,
        borderColor: '#dcdcdc'
    },
    passSelect:{
        width: 60,
        height: 20,
        backgroundColor: '#fcba3f',
        borderTopLeftRadius: 2,
        borderBottomLeftRadius: 2
    },
    failedNormal:{
        width: 60,
        height: 20,
        borderWidth: 0.5,
        borderLeftWidth: 0.25,
        borderBottomWidth:0.25,
        backgroundColor: '#f7f8fc',
        borderTopRightRadius: 2,
        borderBottomRightRadius: 2,
        borderColor: '#dcdcdc'
    },
    failedSelect:{
        width: 60,
        height: 20,
        backgroundColor: '#fcba3f',
        borderTopRightRadius: 2,
        borderBottomRightRadius: 2
    },
    content:{
        height:20,
        lineHeight:20,
        textAlign: 'center',
        textAlignVertical:'center',
        fontSize: 12,
        marginTop: -1
    }
});
