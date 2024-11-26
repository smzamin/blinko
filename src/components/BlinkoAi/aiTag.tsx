import React from 'react';
import { CheckboxGroup, Checkbox, Button } from "@nextui-org/react";
import { CustomCheckbox } from '../Common/CustomCheckbox';

interface AiTagProps {
  tags: string[];
  defaultSelected?: string[];
  onSelect: (selected: string[]) => void;
  confirmText?: string;
  label?: string;
}

export const AiTag: React.FC<AiTagProps> = ({
  tags,
  defaultSelected = [],
  onSelect,
  confirmText = "Confirm",
}) => {
  const [selected, setSelected] = React.useState<string[]>(defaultSelected);

  const handleConfirm = () => {
    onSelect(selected);
  };

  return (
    <div className="flex flex-col gap-4">
      <CheckboxGroup
        className="gap-1"
        orientation="horizontal"
        value={selected}
        onChange={setSelected}
      >
        {tags.map((tag) => (
          <CustomCheckbox key={tag} value={tag}>
            {tag}
          </CustomCheckbox>
        ))}
      </CheckboxGroup>
      <div className='flex justify-end mt-2'>
        <Button
          color="primary"
          onClick={handleConfirm}
          className="w-fit"
        >
          {confirmText}
        </Button>
      </div>
    </div>
  );
};