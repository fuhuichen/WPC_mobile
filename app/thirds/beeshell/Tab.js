import React from 'react';
import PropTypes from 'prop-types';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    PixelRatio,
} from 'react-native';

import { colors, padding, border, fontSize } from './varibles';
import styleUtils from './utils';
import {ColorStyles} from '../../common/ColorStyles';

const px = 1 / PixelRatio.get();

const defaultStyles = StyleSheet.create({
    container: {
        paddingHorizontal: padding.horizontalBase,
        // paddingBottom: 0,
        backgroundColor: '#fff',
    },

    scrollWrapper: {
        flexDirection: 'row',
    },

    item: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        paddingVertical: padding.verticalSmall,
        paddingHorizontal: padding.horizontalBase,
    },

    text: {
        fontSize: fontSize.base,
    },

    line: {
        position: 'absolute',
        bottom: 0,
        width: 25,
        height: 2 * px,
        marginTop: padding.verticalSmall - 1,
        backgroundColor: '#fff',
    },
});

export default class Tab extends React.Component {
    static propTypes = {
        theme: PropTypes.string,
        value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        options: PropTypes.array,
        onChange: PropTypes.func,
        height: PropTypes.number,
        showCount: PropTypes.number
    };
    static defaultProps = {
        threshold: 4,
        theme: 'dark',
        value: null,
        options: [],
        onChange: () => {},
        showCount: true
    }

    themeFilter() {

        return {
            activeColor: ColorStyles.COLOR_MAIN_RED,
            activeBg: colors.brandPrimary,
        };
    }

    renderContent() {
        const itemVels = this.getItemVels();
        return (
            <View style={[defaultStyles.container]}>
                <View style={styleUtils.row}>
                    <View style={defaultStyles.scrollWrapper}>
                        {itemVels}
                    </View>
                </View>
            </View>
        );
    }

    renderScrollContent() {
        const itemVels = this.getItemVels();
        return (
            <View style={[defaultStyles.container]}>
                <View style={styleUtils.row}>
                    <ScrollView
                        style={defaultStyles.scrollWrapper}
                        horizontal
                        showsHorizontalScrollIndicator={false}>
                        {itemVels}
                    </ScrollView>
                </View>
            </View>
        );
    }

    getItemVels() {
        const { value, options = [], onChange, theme, threshold } = this.props;
        const themeStyles = this.themeFilter();

        return options.map((item, index) => {
            const selected = !item.disabled && value === item.value;

            return (
                <TouchableOpacity
                    style={this.props.showCount ? defaultStyles.item :
                        [defaultStyles.item ,{paddingVertical: padding.verticalXSmall}]}
                    key={index}
                    activeOpacity={1}
                    onPress={() => {
                        if (item.disabled) {
                            return;
                        }
                        onChange(item.value);
                    }}>

                    <View>
                        {
                            this.props.showCount ? item.label && React.isValidElement(item.label) ?
                                item.label :
                                <Text style={[
                                    defaultStyles.text,
                                    {
                                        color: item.disabled ? colors.grayLighter : (
                                            selected ? themeStyles.activeColor : colors.gray
                                        ),
                                        alignSelf: 'center'
                                    }
                                ]}>
                                    {item.count}
                                </Text> : null
                        }
                        {
                            item.label && React.isValidElement(item.label) ?
                                item.label :
                                <Text style={[
                                    defaultStyles.text,
                                    {
                                        color: item.disabled ? colors.grayLighter : (
                                            selected ? themeStyles.activeColor : colors.gray
                                        )
                                    }
                                ]}>
                                    {item.label}
                                </Text>
                        }
                    </View>

                    {/*<View style={[defaultStyles.line, { backgroundColor: selected ? themeStyles.activeBg: null }]}></View>*/}
                </TouchableOpacity>
            );
        });
    }

    render() {
        const { options = [], threshold } = this.props;
        // let styles
        // let custOptionPanelStyles = {}
        // switch (theme) {
        //     case 'light':
        //         styles = lightStyle
        //         break
        //     case 'highlight':
        //         styles = highlightStyle
        //         custOptionPanelStyles = { height }
        //         break
        //     default:
        //         styles = darkStyle
        // }

        if (options.length > threshold) {
            return this.renderScrollContent();
        } else {
            return this.renderContent();
        }
    }
}