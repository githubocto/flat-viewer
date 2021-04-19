import React from "react";
import { useSelect, UseSelectStateChange } from "downshift";
import { usePopper } from "react-popper";
import { ChevronDownIcon } from "@primer/octicons-react";
import cc from "classcat";

interface PickerProps<Item> {
  label?: string;
  placeholder: string;
  items: Item[];
  value?: Item;
  onChange: (selected: Item) => void;
  itemRenderer: (item: Item) => React.ReactNode;
  selectedItemRenderer: (item: Item) => React.ReactNode;
  disclosureClass?: string;
}

export function Picker<Item>(props: PickerProps<Item>) {
  const {
    items,
    value,
    onChange,
    itemRenderer,
    selectedItemRenderer,
    placeholder,
    label,
    disclosureClass,
  } = props;

  const handleSelectedItemChange = (changes: UseSelectStateChange<Item>) => {
    if (changes.selectedItem) {
      onChange(changes.selectedItem);
    }
  };

  const {
    isOpen,
    getToggleButtonProps,
    getLabelProps,
    getMenuProps,
    highlightedIndex,
    getItemProps,
  } = useSelect({
    items,
    selectedItem: value,
    onSelectedItemChange: handleSelectedItemChange,
  });

  const [
    referenceElement,
    setReferenceElement,
  ] = React.useState<HTMLDivElement | null>(null);
  const [
    popperElement,
    setPopperElement,
  ] = React.useState<HTMLDivElement | null>(null);

  const { styles, attributes, forceUpdate } = usePopper(
    referenceElement,
    popperElement,
    {
      placement: "bottom-start",
      modifiers: [
        {
          name: "offset",
          options: {
            offset: [0, 4],
          },
        },
      ],
    }
  );

  // Popper has the wrong position on mount, this hack seems to fix it...
  React.useEffect(() => {
    if (isOpen && forceUpdate) {
      forceUpdate();
    }
  }, [isOpen, forceUpdate]);

  return (
    <div className="w-full">
      {label && (
        <label
          className="text-xs text-gray-500 font-medium sr-only"
          {...getLabelProps()}
        >
          {label}
        </label>
      )}
      <div className="relative" ref={setReferenceElement}>
        <button
          type="button"
          {...getToggleButtonProps()}
          className={disclosureClass}
        >
          {value ? (
            selectedItemRenderer(value)
          ) : (
            <span className="text-gray-600">{placeholder}</span>
          )}
        </button>
        <div
          className={cc([
            "min-w-full bg-white z-10 m-0 w-72",
            {
              "sr-only": !isOpen,
            },
          ])}
          style={styles.popper}
          ref={setPopperElement}
          {...attributes.popper}
        >
          <div className="rounded-md bg-white shadow-lg max-h-48">
            <ul
              className="rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm max-h-48 overflow-auto"
              {...getMenuProps()}
            >
              {items.map((item, index) => {
                const isHighlighted = highlightedIndex === index;

                return (
                  <li
                    className={cc([
                      "cursor-default select-none relative py-2 pl-3 pr-4 text-sm",
                      {
                        "bg-gray-100": isHighlighted,
                      },
                    ])}
                    key={`${item}${index}`}
                    {...getItemProps({ item, index })}
                  >
                    <div className={cc(["block truncate text-xs text-left"])}>
                      {itemRenderer(item)}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
