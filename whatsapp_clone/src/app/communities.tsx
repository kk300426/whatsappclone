import {
  Text,
  View,
} from 'react-native';
import {images} from './assets';
import {styles} from './styles';
import { Fab, Icon, SimpleList, PageHeader } from './otherfeatures';
import { communities } from './constants';
import { Theme } from '../types/types';
export default function Communities({ theme }: { theme: Theme }) {
  return (
    <View style={styles.screen}>
      <PageHeader title="Communities" theme={theme} />
      <View style={[styles.banner, { backgroundColor: theme.soft }]}>
        <Icon source={images.communities} size={50} />
        <View>
          <Text style={[styles.title, { color: theme.text }]}>New Community</Text>
          <Text style={{ color: theme.muted }}>Create a community</Text>
        </View>
      </View>
      <SimpleList pairs={communities} theme={theme} square />
      <Fab label="+" />
    </View>
  );
}