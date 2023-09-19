const React = require('react');
const { ViewPropTypes } = ReactNative = require('react-native');
const PropTypes = require('prop-types');
const createReactClass = require('create-react-class');
const {
    StyleSheet,
    Text,
    View,
    Animated
} = ReactNative;

const ButtonEx = require('./Button');
import {ColorStyles} from '../../common/ColorStyles';

const DefaultTabBar = createReactClass({
    propTypes: {
        goToPage: PropTypes.func,
        activeTab: PropTypes.number,
        tabs: PropTypes.array,
        backgroundColor: PropTypes.string,
        activeTextColor: PropTypes.string,
        inactiveTextColor: PropTypes.string,
        textStyle: Text.propTypes.style,
        tabStyle: ViewPropTypes.style,
        renderTab: PropTypes.func,
        underlineStyle: ViewPropTypes.style,
    },

    getDefaultProps() {
        return {
            activeTextColor: '#ffffff',
            inactiveTextColor: '#7c8595',
            backgroundColor: '#24293d',
            textStyle: {
                fontSize: 12,
                marginTop: 12
            }
        };
    },

    renderTabOption(name, page) {
    },

    renderTab(name, page, isTabActive, onPressHandler) {
        const { activeTextColor, inactiveTextColor, textStyle, } = this.props;
        const textColor = isTabActive ? activeTextColor : inactiveTextColor;
        const fontWeight = isTabActive ? 'bold' : 'normal';
        const textStyleSelected = isTabActive ? {fontSize: 16} : textStyle;

        return <ButtonEx
            style={{flex: 1}}
            key={name}
            accessible={true}
            accessibilityLabel={name}
            accessibilityTraits='button'
            onPress={() => onPressHandler(page)}>
            <View style={[styles.tab, this.props.tabStyle, ]}>
                <Text style={[{color: textColor, fontWeight, }, textStyleSelected]}>
                    {name}
                </Text>
            </View>
        </ButtonEx>;
    },

    render() {
        const containerWidth = this.props.containerWidth;
        const numberOfTabs = this.props.tabs.length;
        const tabUnderlineStyle = {
            position: 'absolute',
            width: 80,
            height: 2,
            backgroundColor: ColorStyles.COLOR_MAIN_RED,
            bottom: 0,
        };

        const translateX = this.props.scrollValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 80],
        });
        return (
            <View style={[styles.tabs, {backgroundColor: this.props.backgroundColor, }, this.props.style, ]}>
                {this.props.tabs.map((name, page) => {
                    const isTabActive = this.props.activeTab === page;
                    const renderTab = this.props.renderTab || this.renderTab;
                    return renderTab(name, page, isTabActive, this.props.goToPage);
                })}
                <Animated.View
                    style={[
                        tabUnderlineStyle,
                        {
                            transform: [
                                { translateX },
                            ]
                        },
                        this.props.underlineStyle,
                    ]}
                />
            </View>
        );
    },
});

const styles = StyleSheet.create({
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    tabs: {
        height: 48,
        flexDirection: 'row',
        width: 160,
        marginLeft: 0,
        color: ColorStyles.COLOR_MAIN_RED,
        justifyContent: 'space-around',
        borderWidth: 0,
        borderTopWidth: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
        borderColor: ColorStyles.COLOR_MAIN_RED,
    },
});

module.exports = DefaultTabBar;