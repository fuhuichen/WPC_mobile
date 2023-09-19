/**
 * React native material design search bar
 */
import React from 'react';
import PropTypes from 'prop-types'
import {
    TextInput,
    StyleSheet,
    View,
    TouchableOpacity,
    Dimensions,
    Image
} from 'react-native';
import dismissKeyboard from 'react-native/Libraries/Utilities/dismissKeyboard';
import StringFilter from "../../common/StringFilter";

let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');

const styles = StyleSheet.create({
    searchBar: {
        flexDirection: 'row',
        alignSelf:'flex-end',
        alignItems: 'center',
        backgroundColor: '#3a3f51',
        borderColor: '#3a3f51',
        marginTop:7,
        // borderStyle: 'solid',
        // borderWidth: 1,
        borderRadius:10,
        marginRight:30,
        height:24,
        // marginTop:60,
        width:width-100
    },
    searchBarInput: {
        fontWeight: 'normal',
        color: '#ffffff',
        fontSize:10,
        backgroundColor: '#3a3f51',
        height:24,
        paddingVertical:0,
        width:width-170,
        marginLeft:0
    },
});

export default class SearchBar extends React.Component {
    static propTypes = {
        height: PropTypes.number,
        autoCorrect: PropTypes.bool,
        returnKeyType: PropTypes.string,
        onSearchChange: PropTypes.func,
        onEndEditing: PropTypes.func,
        onSubmitEditing: PropTypes.func,
        placeholder: PropTypes.string,
        padding: PropTypes.number,
        inputStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
        iconCloseComponent: PropTypes.object,
        iconSearchComponent: PropTypes.object,
        iconBackComponent: PropTypes.object,
        iconCloseName: PropTypes.string,
        iconSearchName: PropTypes.string,
        iconBackName: PropTypes.string,
        placeholderColor: PropTypes.string,
        iconColor: PropTypes.string,
        textStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
        inputProps: PropTypes.object,
        onBackPress: PropTypes.func,
        alwaysShowBackButton: PropTypes.bool,
    };

    static defaultProps = {
        height: 24,
        onSearchChange: () => {},
        onEndEditing: () => {},
        onSubmitEditing: () => {},
        inputStyle: {},
        iconCloseName: 'times-circle',
        iconSearchName: 'search',
        iconBackName: 'search',
        placeholder: 'Search...',
        returnKeyType: 'search',
        padding: 5,
        placeholderColor: '#bdbdbd',
        iconColor: '#ffffff',
        textStyle: {},
        alwaysShowBackButton: false,
    };

    constructor(props) {
        super(props);
        this.state = {
            isOnFocus: false,
            wait: true,
            searchContent: ''
        };
        this._onFocus = this._onFocus.bind(this);
        this._onBlur = this._onBlur.bind(this);
        this._onClose = this._onClose.bind(this);
    }

    _onClose() {
        this.changeText('');
        this._textInput.setNativeProps({text: ''});
        this.props.onSearchChange('');
        if (this.props.onClose) {
            this.props.onClose();
        }
    }

    setFocus(focus){
        if(focus){
            this._textInput.blur();
        }
    }

    _onFocus() {
        this.setState({isOnFocus: true});
        if (this.props.onFocus) {
            this.props.onFocus();
        }
    }

    _onBlur() {
        this.setState({isOnFocus: false});
        if (this.props.onBlur) {
            this.props.onBlur();
        }
        this._dismissKeyboard();
    }

    _dismissKeyboard() {
        dismissKeyboard();
    }

    _backPressed() {
        dismissKeyboard()
        if(this.props.onBackPress) {
            this.props.onBackPress()
        }
    }

    setText(text, focus) {
        this._textInput.setNativeProps({ text: text });
        if (focus) {
            this._onFocus();
        }
    }

    changeText(text){
        text = StringFilter.standard(text,50);
        this.setState({
           searchContent:text
        });
        this.props.onSearchChange(text);

        (text === '') && this._onBlur();
    }

    render() {
        const {
            height,
            autoCorrect,
            returnKeyType,
            onSearchChange,
            placeholder,
            padding,
            inputStyle,
            iconColor,
            iconCloseComponent,
            iconSearchComponent,
            iconBackComponent,
            iconBackName,
            iconSearchName,
            iconCloseName,
            placeholderColor,
            textStyle,
        } = this.props;

        let { iconSize, iconPadding } = this.props

        iconSize = typeof iconSize !== 'undefined' ? iconSize : height * 0.5
        iconPadding = typeof iconPadding !== 'undefined' ? iconPadding : height * 0.25

        return (
            <View onStartShouldSetResponder={this._dismissKeyboard} style={{padding: padding}}>
                <View style={[styles.searchBar, {height: height, paddingLeft: iconPadding}, inputStyle]}>
                    <TouchableOpacity activeOpacity={1}>
                        <Image style={{width:36,height:36,marginLeft:-10}} source={require('../../assets/images/img_monitor_search.png')} />
                    </TouchableOpacity>
                    <TextInput
                        autoCorrect={autoCorrect === true}
                        ref={c => this._textInput = c}
                        returnKeyType={returnKeyType}
                        onFocus={this._onFocus}
                        onBlur={this._onBlur}
                        onChangeText={this.changeText.bind(this)}
                        onEndEditing={this.props.onEndEditing}
                        onSubmitEditing={this.props.onSubmitEditing}
                        placeholder={placeholder}
                        placeholderTextColor={placeholderColor}
                        underlineColorAndroid="transparent"
                        style={styles.searchBarInput}
                        value={this.state.searchContent}
                        {...this.props.inputProps}
                    />
                    {this.state.searchContent !== ''?
                        <TouchableOpacity onPress={this._onClose}>
                            <Image style={{width:16,height:16,marginLeft:12}} source={require('../../assets/images/img_audio_delete.png')} />
                        </TouchableOpacity>
                        : null
                    }
                </View>
            </View>
        );
    }
}