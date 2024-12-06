import { IconButton } from '../IconButton';
import { useTranslation } from 'react-i18next';
import { EditorStore } from '../../editorStore';

interface Props {
  store: EditorStore;
}

export const HashtagButton = ({ store }: Props) => {
  const { t } = useTranslation();
  
  return (
    <IconButton 
      tooltip={t('insert-hashtag')} 
      icon="mdi:hashtag"
      onClick={() => store.inertHash()} 
    />
  );
}; 