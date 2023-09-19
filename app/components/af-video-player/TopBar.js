import React from 'react'
import PropTypes from 'prop-types'

import {
  View,
  StyleSheet,
  Text,
  Image
} from 'react-native'

import LinearGradient from 'react-native-linear-gradient'
import { ToggleIcon } from './ToggleIcon'
import { checkSource } from './utils'
import {isIphoneX,getStatusBarHeight} from "react-native-iphone-x-helper";

const backgroundColor = 'transparent'

const styles = StyleSheet.create({
  container: {
    height: 35,
    justifyContent: 'center',
    //marginTop: 25
  },
  row: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center'
  },
  title: {
    flex: 1,
    backgroundColor,
    paddingLeft: 10,
    paddingRight: 35,
    fontSize: 16
  },
  logo: {
    marginLeft: 5,
    height: 25,
    width: 25
  },
})

const TopBar = (props) => {
  const {
    logo,
    more,
    title,
    theme,
    onMorePress
  } = props

  let marginTop = isIphoneX()? getStatusBarHeight()+10: 25;
  return (
    <View style={[styles.container,{marginTop:marginTop}]}>
      <View style={styles.row}>
        { logo && <Image style={styles.logo} resizeMode="contain" {...checkSource(logo)} />}
        <Text
          style={[styles.title, { color: theme.title }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
        { more &&
          <ToggleIcon
            style={styles.more}
            onPress={() => onMorePress()}
            paddingRight
            iconOff="close"
            iconOn="close"
            theme={theme.more}
            size={30}
          />
        }
      </View>
    </View>
  )
}

TopBar.propTypes = {
  title: PropTypes.string.isRequired,
  logo: PropTypes.string.isRequired,
  more: PropTypes.bool.isRequired,
  onMorePress: PropTypes.func.isRequired,
  theme: PropTypes.object.isRequired
}

export { TopBar }
