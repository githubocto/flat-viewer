import React from "react";
import { useCombobox } from "downshift";
import { FileIcon } from "@primer/octicons-react";
import cc from "classcat";

interface FilePickerProps {
  label?: string;
  placeholder: string;
  items: string[];
  value?: string;
  onChange: (newValue: string) => void;
  itemRenderer: (item: string) => React.ReactNode;
  disclosureClass?: string;
  isClearable?: boolean;
}

export function FilePicker(props: FilePickerProps) {
  const {
    items,
    value,
    onChange,
    itemRenderer,
    placeholder,
    label,
    disclosureClass,
    isClearable = false,
  } = props;

  const [inputValue, setInputValue] = React.useState<string>("");
  const inputElement = React.useRef<HTMLInputElement>(null);

  const filteredItems = (items || []).filter((file: string) => {
    const hasFilterString = value === inputValue || file.includes(inputValue);
    return hasFilterString;
  });

  const {
    isOpen,
    getToggleButtonProps,
    getLabelProps,
    getMenuProps,
    getInputProps,
    getComboboxProps,
    highlightedIndex,
    getItemProps,
    openMenu,
    closeMenu,
  } = useCombobox({
    selectedItem: value || "",
    items: filteredItems,
    onInputValueChange: ({ inputValue }) => {
      setInputValue(inputValue || "");
      if (filteredItems.includes(inputValue || "")) onChange(inputValue || "");
      if (!inputValue && isClearable) onChange("");
    },
    onSelectedItemChange: ({ selectedItem }) => {
      if (!selectedItem) return;
      onChange(selectedItem);
      if (inputElement.current) inputElement.current.blur();
    },
  });

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

      <div className="relative">
        <label {...getLabelProps()}>{label}</label>

        <div
          className="flex items-center mt-2 appearance-none bg-indigo-700 hover:bg-indigo-800 h-9 px-2 rounded text-white w-full lg:max-w-md font-mono"
          {...getComboboxProps()}
        >
          <FileIcon size={16} />

          <input
            type="text"
            className="p-2 flex-1 bg-transparent border-none text-xs overflow-ellipsis"
            style={{
              boxShadow: "none",
            }}
            {...getInputProps({
              onFocus: (e) => {
                if (isOpen) return;
                openMenu();
                e.target.select();
              },
              ref: inputElement,
            })}
          />

          <button
            type="button"
            {...getToggleButtonProps()}
            aria-label="toggle menu"
            style={{
              height: "2.3em",
            }}
          >
            &#8595;
          </button>

          {isClearable && !!value && (
            <button
              className="absolute right-10 bg-transparent"
              onClick={() => {
                setInputValue("");
                onChange("");
              }}
            >
              <div className="codicon codicon-x pr-1 text-sm pt-px" />
            </button>
          )}
        </div>
        <ul
          className={cc([
            "absolute left-0 bg-white shadow-md text-gray-800 z-10 overflow-auto",
            {
              "sr-only": !isOpen,
            },
          ])}
          style={{
            top: "100%",
            maxWidth: "calc(100vw - 2em)",
            minWidth: "100%",
            maxHeight: "20em",
          }}
          {...getMenuProps()}
        >
          {isOpen && (
            <>
              {filteredItems.map((item, index) => (
                <li
                  className={cc([
                    "p-2",
                    {
                      "bg-indigo-100": highlightedIndex === index,
                    },
                  ])}
                  key={`${item}${index}`}
                  {...getItemProps({ item, index })}
                >
                  {itemRenderer(item)}
                </li>
              ))}
              {!items && (
                <div className="p-2 font-mono text-xs text-gray-500">
                  Loading...
                </div>
              )}
              {!filteredItems.length && (
                <div className="p-2 font-mono text-xs text-gray-500">
                  No files found
                  {inputValue && ` that include "${inputValue}"`}
                </div>
              )}
            </>
          )}
        </ul>
      </div>
    </div>
  );
}
