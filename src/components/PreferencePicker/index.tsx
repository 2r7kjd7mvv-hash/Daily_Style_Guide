import { Button, Text, View } from '@tarojs/components';
import { toggleSelection } from '@/features/trip/preferences';
import styles from './index.module.scss';

interface Option<T extends string> { key: T; label: string; description?: string; hex?: string }
interface Props<T extends string> { options: readonly Option<T>[]; values: readonly T[]; onChange: (values: T[]) => void }

const PreferencePicker = <T extends string>({ options, values, onChange }: Props<T>) => (
  <View className={styles.grid}>
    {options.map((option) => {
      const selected = values.includes(option.key);
      return (
        <Button key={option.key} aria-pressed={selected} className={`${styles.option} ${selected ? styles.selected : ''}`} onClick={() => onChange(toggleSelection(values, option.key))}>
          {option.hex && <View className={styles.swatch} style={{ background: option.hex }} />}
          <View className={styles.copy}>
            <Text className={styles.label}>{option.label}</Text>
            {option.description && <Text className={styles.desc}>{option.description}</Text>}
          </View>
        </Button>
      );
    })}
  </View>
);
export default PreferencePicker;
